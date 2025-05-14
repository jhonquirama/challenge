/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Crear tabla principal de eventos
  pgm.createTable('notification_events', {
    event_id: { type: 'varchar(50)', primaryKey: true },
    event_type: { type: 'varchar(50)', notNull: true },
    content: { type: 'text', notNull: true },
    delivery_date: { type: 'timestamp', notNull: true },
    delivery_status: { 
      type: 'varchar(20)', 
      notNull: true,
      check: "delivery_status IN ('completed', 'failed', 'pending', 'retrying')"
    },
    client_id: { type: 'varchar(50)' },
    retry_count: { type: 'integer', default: 0 },
    last_retry_date: { type: 'timestamp' },
    max_retries: { type: 'integer', default: 5 },
    next_retry_date: { type: 'timestamp' },
    webhook_url: { type: 'varchar(255)' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Crear tabla de intentos de entrega
  pgm.createTable('delivery_attempts', {
    id: { type: 'serial', primaryKey: true },
    event_id: { 
      type: 'varchar(50)', 
      notNull: true,
      references: '"notification_events"',
      onDelete: 'CASCADE'
    },
    attempt_date: { type: 'timestamp', notNull: true },
    status: { 
      type: 'varchar(10)', 
      notNull: true,
      check: "status IN ('success', 'failure')"
    },
    status_code: { type: 'integer' },
    error_message: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Índices para mejorar el rendimiento de las consultas
  pgm.createIndex('notification_events', 'client_id');
  pgm.createIndex('notification_events', 'delivery_status');
  pgm.createIndex('notification_events', 'delivery_date');
  pgm.createIndex('notification_events', 'next_retry_date');
  pgm.createIndex('delivery_attempts', 'event_id');
  pgm.createIndex('delivery_attempts', 'status');

  // Trigger para actualizar automáticamente updated_at
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
    },
    `
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger(
    'notification_events',
    'update_updated_at_trigger',
    {
      when: 'BEFORE',
      operation: 'UPDATE',
      level: 'ROW',
      function: 'update_updated_at_column',
    }
  );
};

exports.down = pgm => {
  pgm.dropTable('delivery_attempts');
  pgm.dropTrigger('notification_events', 'update_updated_at_trigger');
  pgm.dropFunction('update_updated_at_column');
  pgm.dropTable('notification_events');
};