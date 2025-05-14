"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DeliverNotificationUseCase_1 = require("../../../src/core/use_cases/DeliverNotificationUseCase");
// Mock del repositorio
class MockNotificationEventRepository {
    constructor(initialEvents = []) {
        this.events = [...initialEvents];
    }
    async findAll() {
        return [...this.events];
    }
    async findById(id) {
        const event = this.events.find((event) => event.event_id === id);
        return event ? { ...event } : null;
    }
    async save(event) {
        const existingEventIndex = this.events.findIndex((e) => e.event_id === event.event_id);
        if (existingEventIndex >= 0) {
            this.events[existingEventIndex] = { ...event };
        }
        else {
            this.events.push({ ...event });
        }
        return { ...event };
    }
    async update(event) {
        const existingEventIndex = this.events.findIndex((e) => e.event_id === event.event_id);
        if (existingEventIndex === -1) {
            throw new Error(`Event with id ${event.event_id} not found`);
        }
        this.events[existingEventIndex] = { ...event };
        return { ...event };
    }
}
// Mock del servicio de webhook
class MockWebhookService {
    constructor(shouldSucceed = true) {
        this.shouldSucceed = shouldSucceed;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async deliverNotification(event, url) {
        if (this.shouldSucceed) {
            return {
                success: true,
                statusCode: 200,
                timestamp: new Date().toISOString(),
            };
        }
        else {
            return {
                success: false,
                statusCode: 500,
                error: 'Error de prueba',
                timestamp: new Date().toISOString(),
            };
        }
    }
}
// Mock de la estrategia de reintentos
class MockRetryStrategy {
    constructor(shouldRetry = true) {
        this.shouldRetry = shouldRetry;
    }
    shouldRetry(event) {
        console.log(event);
        if (this.shouldRetry) {
            return {
                shouldRetry: true,
                nextRetryDate: new Date(Date.now() + 60000).toISOString(),
                reason: 'Reintento de prueba',
            };
        }
        else {
            return {
                shouldRetry: false,
                reason: 'No se debe reintentar',
            };
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calculateNextRetryDelay(retryCount) {
        return 60000; // 1 minuto
    }
}
describe('DeliverNotificationUseCase', () => {
    let useCase;
    let repository;
    let webhookService;
    let retryStrategy;
    const mockEvent = {
        event_id: 'EVT001',
        event_type: 'credit_card_payment',
        content: 'Credit card payment received for $150.00',
        delivery_date: '2024-03-15T09:30:22Z',
        delivery_status: 'pending',
        client_id: 'CLIENT001',
        retry_count: 0,
        delivery_attempts: [],
    };
    beforeEach(() => {
        repository = new MockNotificationEventRepository([mockEvent]);
    });
    it('should mark event as completed when delivery succeeds', async () => {
        webhookService = new MockWebhookService(true);
        retryStrategy = new MockRetryStrategy();
        useCase = new DeliverNotificationUseCase_1.DeliverNotificationUseCase(repository, webhookService, retryStrategy);
        const result = await useCase.execute('EVT001', 'https://test.com/webhook');
        expect(result).not.toBeNull();
        expect(result?.delivery_status).toBe('completed');
        expect(result?.delivery_attempts?.length).toBe(1);
        expect(result?.delivery_attempts?.[0].status).toBe('success');
    });
    it('should mark event for retry when delivery fails and retry is possible', async () => {
        webhookService = new MockWebhookService(false);
        retryStrategy = new MockRetryStrategy(true);
        useCase = new DeliverNotificationUseCase_1.DeliverNotificationUseCase(repository, webhookService, retryStrategy);
        const result = await useCase.execute('EVT001', 'https://test.com/webhook');
        expect(result).not.toBeNull();
        expect(result?.delivery_status).toBe('retrying');
        expect(result?.retry_count).toBe(1);
        expect(result?.next_retry_date).toBeDefined();
        expect(result?.delivery_attempts?.length).toBe(1);
        expect(result?.delivery_attempts?.[0].status).toBe('failure');
    });
    it('should mark event as failed when delivery fails and retry is not possible', async () => {
        webhookService = new MockWebhookService(false);
        retryStrategy = new MockRetryStrategy(false);
        useCase = new DeliverNotificationUseCase_1.DeliverNotificationUseCase(repository, webhookService, retryStrategy);
        const result = await useCase.execute('EVT001', 'https://test.com/webhook');
        expect(result).not.toBeNull();
        expect(result?.delivery_status).toBe('failed');
        expect(result?.retry_count).toBe(1);
        expect(result?.delivery_attempts?.length).toBe(1);
        expect(result?.delivery_attempts?.[0].status).toBe('failure');
    });
    it('should return null when event does not exist', async () => {
        webhookService = new MockWebhookService();
        retryStrategy = new MockRetryStrategy();
        useCase = new DeliverNotificationUseCase_1.DeliverNotificationUseCase(repository, webhookService, retryStrategy);
        const result = await useCase.execute('NON_EXISTENT', 'https://test.com/webhook');
        expect(result).toBeNull();
    });
});
