export type DeliveryStatus = 'completed' | 'failed' | 'pending';

export interface NotificationEvent {
  event_id: string;
  event_type: string;
  content: string;
  delivery_date: string;
  delivery_status: DeliveryStatus;
  client_id?: string; 
  retry_count?: number; 
  last_retry_date?: string;
}