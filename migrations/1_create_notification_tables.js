/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Crear tabla de eventos de notificación
  pgm.createTable('notification_events', {
    event_id: { type: 'varchar(50)', primaryKey: true },
    event_type: { type: 'varchar(100)', notNull: true },
    content: { type: 'text', notNull: true },
    delivery_date: { type: 'timestamp with time zone', notNull: true },
    delivery_status: { type: 'varchar(20)', notNull: true },
    client_id: { type: 'varchar(50)' },
    retry_count: { type: 'integer', default: 0 },
    last_retry_date: { type: 'timestamp with time zone' },
    max_retries: { type: 'integer', default: 5 },
    next_retry_date: { type: 'timestamp with time zone' },
    webhook_url: { type: 'text' },
    created_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') }
  });

  // Crear tabla para los intentos de entrega
  pgm.createTable('delivery_attempts', {
    id: 'id',
    event_id: {
      type: 'varchar(50)',
      references: 'notification_events',
      onDelete: 'CASCADE'
    },
    attempt_date: { type: 'timestamp with time zone', notNull: true },
    status: { type: 'varchar(20)', notNull: true },
    status_code: { type: 'integer' },
    error_message: { type: 'text' },
    created_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') }
  });

  // Crear índices para mejorar el rendimiento
  pgm.createIndex('notification_events', 'client_id');
  pgm.createIndex('notification_events', 'delivery_status');
  pgm.createIndex('notification_events', 'delivery_date');
  pgm.createIndex('delivery_attempts', 'event_id');
};

exports.down = pgm => {
  // Eliminar índices
  pgm.dropIndex('delivery_attempts', 'event_id');
  pgm.dropIndex('notification_events', 'delivery_date');
  pgm.dropIndex('notification_events', 'delivery_status');
  pgm.dropIndex('notification_events', 'client_id');

  // Eliminar tablas
  pgm.dropTable('delivery_attempts');
  pgm.dropTable('notification_events');
};