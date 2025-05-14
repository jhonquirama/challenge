"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AxiosWebhookService_1 = require("../../../../../src/infrastructure/driven_adapters/webhook/AxiosWebhookService");
const axios_1 = __importDefault(require("axios"));
// Mock axios
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('AxiosWebhookService', () => {
    let webhookService;
    beforeEach(() => {
        webhookService = new AxiosWebhookService_1.AxiosWebhookService();
        jest.clearAllMocks();
    });
    const mockEvent = {
        event_id: 'EVT001',
        event_type: 'test_event',
        content: 'Test content',
        delivery_date: '2024-03-15T09:30:22Z',
        delivery_status: 'pending',
        client_id: 'CLIENT001',
    };
    it('should deliver notification successfully', async () => {
        // Mock successful axios response
        mockedAxios.post.mockResolvedValueOnce({
            status: 200,
            data: { success: true },
        });
        const result = await webhookService.deliverNotification(mockEvent, 'https://test.com/webhook');
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.timestamp).toBeDefined();
        expect(mockedAxios.post).toHaveBeenCalledWith('https://test.com/webhook', expect.objectContaining({
            event_id: 'EVT001',
            event_type: 'test_event',
        }), expect.any(Object));
    });
    it('should handle delivery failure with error response', async () => {
        // Mock failed axios response
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                status: 500,
                data: { error: 'Internal server error' },
            },
        });
        const result = await webhookService.deliverNotification(mockEvent, 'https://test.com/webhook');
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(500);
        expect(result.error).toBeDefined();
        expect(result.timestamp).toBeDefined();
    });
    it('should handle delivery failure with network error', async () => {
        // Mock network error
        mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));
        const result = await webhookService.deliverNotification(mockEvent, 'https://test.com/webhook');
        expect(result.success).toBe(false);
        expect(result.statusCode).toBeUndefined();
        expect(result.error).toContain('Network Error');
        expect(result.timestamp).toBeDefined();
    });
});
