"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ReplayNotificationEventUseCase_1 = require("../../../src/core/use_cases/ReplayNotificationEventUseCase");
// Mock del repositorio para pruebas
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
// Mock del caso de uso de entrega
class MockDeliverNotificationUseCase {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async execute(eventId, webhookUrl) {
        // Simular entrega exitosa
        return {
            event_id: eventId,
            event_type: 'test_event',
            content: 'Test content',
            delivery_date: new Date().toISOString(),
            delivery_status: 'completed',
            retry_count: 1,
            last_retry_date: new Date().toISOString(),
        };
    }
}
describe('ReplayNotificationEventUseCase', () => {
    let useCase;
    let repository;
    let deliverUseCase;
    const mockEvents = [
        {
            event_id: 'EVT001',
            event_type: 'credit_card_payment',
            content: 'Credit card payment received for $150.00',
            delivery_date: '2024-03-15T09:30:22Z',
            delivery_status: 'failed',
            client_id: 'CLIENT001',
        },
        {
            event_id: 'EVT002',
            event_type: 'debit_card_withdrawal',
            content: 'ATM withdrawal of $200.00',
            delivery_date: '2024-03-15T10:15:45Z',
            delivery_status: 'completed',
            client_id: 'CLIENT001',
        },
    ];
    beforeEach(() => {
        repository = new MockNotificationEventRepository(mockEvents);
        deliverUseCase = new MockDeliverNotificationUseCase();
        useCase = new ReplayNotificationEventUseCase_1.ReplayNotificationEventUseCase(repository, deliverUseCase);
    });
    it('should replay a failed event successfully', async () => {
        const result = await useCase.execute('EVT001');
        expect(result).not.toBeNull();
        expect(result?.event_id).toBe('EVT001');
        expect(result?.delivery_status).toBe('completed');
    });
    it('should return null when event does not exist', async () => {
        const result = await useCase.execute('NON_EXISTENT');
        expect(result).toBeNull();
    });
    it('should throw error when trying to replay a completed event', async () => {
        await expect(useCase.execute('EVT002')).rejects.toThrow('Solo se pueden reenviar eventos con estado fallido');
    });
});
