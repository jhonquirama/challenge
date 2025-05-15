import { EventSubscription } from '../../domain/models/EventSubscription';

export interface IEventSubscriptionRepository {
  /**
   * Encuentra todas las suscripciones activas para un cliente y tipo de evento específicos
   * @param clientId ID del cliente
   * @param eventType Tipo de evento
   * @returns Lista de suscripciones activas
   */
  findActiveSubscriptions(clientId: string, eventType: string): Promise<EventSubscription[]>;

  /**
   * Encuentra todas las suscripciones para un cliente
   * @param clientId ID del cliente
   * @returns Lista de suscripciones del cliente
   */
  findByClientId(clientId: string): Promise<EventSubscription[]>;

  /**
   * Guarda una nueva suscripción
   * @param subscription Suscripción a guardar
   * @returns Suscripción guardada
   */
  save(subscription: EventSubscription): Promise<EventSubscription>;

  /**
   * Actualiza una suscripción existente
   * @param subscription Suscripción a actualizar
   * @returns Suscripción actualizada
   */
  update(subscription: EventSubscription): Promise<EventSubscription>;
}
