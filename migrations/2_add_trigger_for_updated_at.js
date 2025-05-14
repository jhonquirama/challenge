/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Crear función para actualizar el timestamp de updated_at
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
    },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `
  );

  // Crear trigger para actualizar automáticamente updated_at
  pgm.createTrigger(
    'notification_events',
    'update_updated_at_trigger',
    {
      when: 'BEFORE',
      operation: 'UPDATE',
      level: 'ROW',
      function: 'update_updated_at_column'
    }
  );
};

exports.down = pgm => {
  // Eliminar trigger
  pgm.dropTrigger('notification_events', 'update_updated_at_trigger');
  
  // Eliminar función
  pgm.dropFunction('update_updated_at_column', []);
};