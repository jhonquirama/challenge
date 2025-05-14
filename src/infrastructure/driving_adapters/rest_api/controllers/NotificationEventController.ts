import { Request, Response } from 'express';
import { IGetNotificationEventsUseCase } from '../../../../core/ports/input/IGetNotificationEventsUseCase';
import { IGetNotificationEventByIdUseCase } from '../../../../core/ports/input/IGetNotificationEventByIdUseCase';
import { IReplayNotificationEventUseCase } from '../../../../core/ports/input/IReplayNotificationEventUseCase';
import { NotificationEventFilter } from '../../../../core/ports/output/INotificationEventRepository';
import { logger } from '../../../../shared/utils/logger';

export class NotificationEventController {
  constructor(
    private readonly getNotificationEventsUseCase: IGetNotificationEventsUseCase,
    private readonly getNotificationEventByIdUseCase: IGetNotificationEventByIdUseCase,
    private readonly replayNotificationEventUseCase: IReplayNotificationEventUseCase,
  ) {}

  async getNotificationEvents(req: Request, res: Response): Promise<void> {
    try {
      const filter: NotificationEventFilter = {};
      
      if (req.query.clientId) {
        filter.clientId = req.query.clientId as string;
      } else if (req.headers['authorized-client-id']) {
        filter.clientId = req.headers['authorized-client-id'] as string;
      }

      if (req.query.startDate) {
        filter.startDate = req.query.startDate as string;
      }

      if (req.query.endDate) {
        filter.endDate = req.query.endDate as string;
      }

      if (req.query.deliveryStatus) {
        filter.deliveryStatus = req.query.deliveryStatus as any;
      }

      const events = await this.getNotificationEventsUseCase.execute(filter);
      
      logger.info('Eventos consultados exitosamente', {
        clientId: filter.clientId,
        count: events.length,
        ip: req.ip
      });
      
      res.status(200).json(events);
    } catch (error) {
      logger.error('Error al obtener eventos', {
        error: (error as Error).message,
        ip: req.ip
      });
      
      res.status(500).json({ 
        message: 'Error al obtener los eventos de notificación'
      });
    }
  }

  async getNotificationEventById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = await this.getNotificationEventByIdUseCase.execute(id);

      if (!event) {
        res.status(404).json({ message: `Evento con id ${id} no encontrado` });
        return;
      }
      
      const authorizedClientId = req.headers['authorized-client-id'] as string;
      if (authorizedClientId && event.client_id && event.client_id !== authorizedClientId) {
        logger.warn('Intento de acceso no autorizado a evento', {
          eventId: id,
          requestedBy: authorizedClientId,
          eventOwner: event.client_id,
          ip: req.ip
        });
        
        res.status(403).json({ 
          message: 'No tiene permiso para acceder a este evento' 
        });
        return;
      }
      
      logger.info('Evento consultado exitosamente', {
        eventId: id,
        clientId: event.client_id,
        ip: req.ip
      });
      
      res.status(200).json(event);
    } catch (error) {
      logger.error('Error al obtener evento por ID', {
        id: req.params.id,
        error: (error as Error).message,
        ip: req.ip
      });
      
      res.status(500).json({ 
        message: 'Error al obtener el evento de notificación'
      });
    }
  }

  async replayNotificationEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const existingEvent = await this.getNotificationEventByIdUseCase.execute(id);
      
      if (!existingEvent) {
        res.status(404).json({ message: `Evento con id ${id} no encontrado` });
        return;
      }
      
      const authorizedClientId = req.headers['authorized-client-id'] as string;
      if (authorizedClientId && existingEvent.client_id && existingEvent.client_id !== authorizedClientId) {
        logger.warn('Intento de reenvío no autorizado de evento', {
          eventId: id,
          requestedBy: authorizedClientId,
          eventOwner: existingEvent.client_id,
          ip: req.ip
        });
        
        res.status(403).json({ 
          message: 'No tiene permiso para reenviar este evento' 
        });
        return;
      }
      
      const event = await this.replayNotificationEventUseCase.execute(id);
      
      logger.info('Evento reenviado exitosamente', {
        eventId: id,
        clientId: event?.client_id,
        newStatus: event?.delivery_status,
        ip: req.ip
      });
      
      res.status(200).json({
        message: 'Evento reenviado correctamente',
        event,
      });
    } catch (error) {
      logger.error('Error al reenviar evento', {
        id: req.params.id,
        error: (error as Error).message,
        ip: req.ip
      });
      
      res.status(500).json({ 
        message: 'Error al reenviar el evento de notificación'
      });
    }
  }
}