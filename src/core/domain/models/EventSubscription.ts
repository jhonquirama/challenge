export interface EventSubscription {
  id?: number;
  client_id: string;
  event_type: string;
  webhook_url: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}
