"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProcessPendingNotificationsUseCase_1 = require("../../../src/core/use_cases/ProcessPendingNotificationsUseCase");
// Mock del repositorio
class MockNotificationEventRepository {
    constructor(initialEvents = []) {
        this.events = [...initialEvents];
    }
    async findAll(filter) {
        let filteredEvents = [...this.events];
        if (filter) {
            if (filter.deliveryStatus) {
                filteredEvents = filteredEvents.filter((event) => event.delivery_status === filter.deliveryStatus);
            }
        }
        return filteredEvents;
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
    constructor() {
        this.processedEvents = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async execute(eventId, webhookUrl) {
        this.processedEvents.push(eventId);
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
    getProcessedEvents() {
        return this.processedEvents;
    }
}
describe('ProcessPendingNotificationsUseCase', () => {
    let useCase;
    let repository;
    let deliverUseCase;
    const mockEvents = [
        {
            event_id: 'EVT001',
            event_type: 'credit_card_payment',
            content: 'Credit card payment received for $150.00',
            delivery_date: '2024-03-15T09:30:22Z',
            delivery_status: 'pending',
            client_id: 'CLIENT001',
            webhook_url: 'https://test.com/webhook',
        },
        {
            event_id: 'EVT002',
            event_type: 'debit_card_withdrawal',
            content: 'ATM withdrawal of $200.00',
            delivery_date: '2024-03-15T10:15:45Z',
            delivery_status: 'retrying',
            client_id: 'CLIENT001',
            webhook_url: 'https://test.com/webhook',
            next_retry_date: new Date(Date.now() - 60000).toISOString(), // Fecha en el pasado
        },
        {
            event_id: 'EVT003',
            event_type: 'credit_transfer',
            content: 'Bank transfer received',
            delivery_date: '2024-03-15T11:20:18Z',
            delivery_status: 'retrying',
            client_id: 'CLIENT002',
            webhook_url: 'https://test.com/webhook',
            next_retry_date: new Date(Date.now() + 60000).toISOString(), // Fecha en el futuro
        },
    ];
    beforeEach(() => {
        repository = new MockNotificationEventRepository(mockEvents);
        deliverUseCase = new MockDeliverNotificationUseCase();
        useCase = new ProcessPendingNotificationsUseCase_1.ProcessPendingNotificationsUseCase(repository, deliverUseCase);
    });
    it('should process pending and ready-to-retry events', async () => {
        await useCase.execute();
        const processedEvents = deliverUseCase.getProcessedEvents();
        expect(processedEvents).toContain('EVT001'); // Pending event
        expect(processedEvents).toContain('EVT002'); // Retrying event with past retry date
        expect(processedEvents).not.toContain('EVT003'); // Retrying event with future retry date
        expect(processedEvents.length).toBe(2);
    });
});
