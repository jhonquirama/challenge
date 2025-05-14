/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Datos de ejemplo para la tabla notification_events
  const sampleEvents = [
    {
      event_id: 'EVT001',
      event_type: 'credit_card_payment',
      content: 'Credit card payment received for $150.00',
      delivery_date: '2024-03-15T09:30:22Z',
      delivery_status: 'completed',
      client_id: 'CLIENT001',
      retry_count: 0,
      webhook_url: 'https://webhook.site/test-endpoint-1'
    },
    {
      event_id: 'EVT002',
      event_type: 'debit_card_withdrawal',
      content: 'ATM withdrawal of $200.00',
      delivery_date: '2024-03-15T10:15:45Z',
      delivery_status: 'failed',
      client_id: 'CLIENT001',
      retry_count: 3,
      last_retry_date: '2024-03-15T10:45:22Z',
      webhook_url: 'https://webhook.site/test-endpoint-1'
    },
    {
      event_id: 'EVT003',
      event_type: 'credit_transfer',
      content: 'Bank transfer received from Account #4567 for $1,500.00',
      delivery_date: '2024-03-15T11:20:18Z',
      delivery_status: 'pending',
      client_id: 'CLIENT002',
      retry_count: 0,
      webhook_url: 'https://webhook.site/test-endpoint-2'
    },
    {
      event_id: 'EVT004',
      event_type: 'account_update',
      content: 'Account details updated: email changed',
      delivery_date: '2024-03-15T14:05:33Z',
      delivery_status: 'retrying',
      client_id: 'CLIENT002',
      retry_count: 1,
      last_retry_date: '2024-03-15T14:10:45Z',
      next_retry_date: '2024-03-15T14:40:45Z',
      webhook_url: 'https://webhook.site/test-endpoint-2'
    }
  ];

  // Datos de ejemplo para la tabla delivery_attempts
  const sampleAttempts = [
    {
      event_id: 'EVT001',
      attempt_date: '2024-03-15T09:30:25Z',
      status: 'success',
      status_code: 200
    },
    {
      event_id: 'EVT002',
      attempt_date: '2024-03-15T10:15:48Z',
      status: 'failure',
      status_code: 500,
      error_message: 'Internal server error'
    },
    {
      event_id: 'EVT002',
      attempt_date: '2024-03-15T10:25:48Z',
      status: 'failure',
      status_code: 500,
      error_message: 'Internal server error'
    },
    {
      event_id: 'EVT002',
      attempt_date: '2024-03-15T10:45:22Z',
      status: 'failure',
      status_code: 500,
      error_message: 'Internal server error'
    },
    {
      event_id: 'EVT004',
      attempt_date: '2024-03-15T14:10:45Z',
      status: 'failure',
      status_code: 503,
      error_message: 'Service unavailable'
    }
  ];

  // Insertar los eventos de ejemplo
  sampleEvents.forEach(event => {
    pgm.sql(`
      INSERT INTO notification_events (
        event_id, event_type, content, delivery_date, delivery_status, 
        client_id, retry_count, last_retry_date, next_retry_date, webhook_url
      ) VALUES (
        '${event.event_id}', 
        '${event.event_type}', 
        '${event.content}', 
        '${event.delivery_date}', 
        '${event.delivery_status}', 
        '${event.client_id}', 
        ${event.retry_count}, 
        ${event.last_retry_date ? `'${event.last_retry_date}'` : 'NULL'}, 
        ${event.next_retry_date ? `'${event.next_retry_date}'` : 'NULL'}, 
        '${event.webhook_url}'
      )
      ON CONFLICT (event_id) DO NOTHING
    `);
  });

  // Insertar los intentos de entrega de ejemplo
  sampleAttempts.forEach(attempt => {
    pgm.sql(`
      INSERT INTO delivery_attempts (
        event_id, attempt_date, status, status_code, error_message
      ) VALUES (
        '${attempt.event_id}', 
        '${attempt.attempt_date}', 
        '${attempt.status}', 
        ${attempt.status_code}, 
        ${attempt.error_message ? `'${attempt.error_message}'` : 'NULL'}
      )
    `);
  });
};

exports.down = pgm => {
  // Eliminar los datos de ejemplo
  pgm.sql(`DELETE FROM delivery_attempts WHERE event_id IN ('EVT001', 'EVT002', 'EVT003', 'EVT004')`);
  pgm.sql(`DELETE FROM notification_events WHERE event_id IN ('EVT001', 'EVT002', 'EVT003', 'EVT004')`);
};