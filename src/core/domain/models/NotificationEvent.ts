export type DeliveryStatus = 'completed' | 'failed' | 'pending' | 'retrying';

export interface NotificationEvent {
  event_id: string;
  event_type: string;
  content: string;
  delivery_date: string;
  delivery_status: DeliveryStatus;
  client_id?: string;
  retry_count?: number;
  last_retry_date?: string;
  max_retries?: number;
  next_retry_date?: string;
  webhook_url?: string;
  delivery_attempts?: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  attempt_date: string;
  status: 'success' | 'failure';
  status_code?: number;
  error_message?: string;
}
