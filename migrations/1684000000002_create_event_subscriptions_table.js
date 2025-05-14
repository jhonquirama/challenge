/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Crear tabla de suscripciones a eventos
  pgm.createTable('event_subscriptions', {
    id: { type: 'serial', primaryKey: true },
    client_id: { 
      type: 'varchar(50)', 
      notNull: true
    },
    event_type: { 
      type: 'varchar(50)', 
      notNull: true 
    },
    webhook_url: { 
      type: 'varchar(255)', 
      notNull: true 
    },
    active: { 
      type: 'boolean', 
      notNull: true, 
      default: true 
    },
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

  // Crear índices para mejorar el rendimiento
  pgm.createIndex('event_subscriptions', 'client_id');
  pgm.createIndex('event_subscriptions', 'event_type');
  pgm.createIndex('event_subscriptions', ['client_id', 'event_type'], { unique: true });

  // Aplicar el mismo trigger de updated_at
  pgm.createTrigger(
    'event_subscriptions',
    'update_updated_at_trigger',
    {
      when: 'BEFORE',
      operation: 'UPDATE',
      level: 'ROW',
      function: 'update_updated_at_column',
    }
  );

  // Datos de ejemplo
  pgm.sql(`
    INSERT INTO event_subscriptions (client_id, event_type, webhook_url)
    VALUES 
      ('CLIENT001', 'credit_card_payment', 'https://webhook.site/client001-payments'),
      ('CLIENT001', 'debit_card_withdrawal', 'https://webhook.site/client001-withdrawals'),
      ('CLIENT002', 'credit_transfer', 'https://webhook.site/client002-transfers'),
      ('CLIENT002', 'account_update', 'https://webhook.site/client002-updates')
  `);
};

exports.down = pgm => {
  pgm.dropTable('event_subscriptions');
};