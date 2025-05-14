import { Request, Response } from 'express';
import { IGetNotificationEventsUseCase } from '../../../../core/ports/input/IGetNotificationEventsUseCase';
import { IGetNotificationEventByIdUseCase } from '../../../../core/ports/input/IGetNotificationEventByIdUseCase';
import { IReplayNotificationEventUseCase } from '../../../../core/ports/input/IReplayNotificationEventUseCase';
import { NotificationEventFilter } from '../../../../core/ports/output/INotificationEventRepository';

export class NotificationEventController {
  constructor(
    private readonly getNotificationEventsUseCase: IGetNotificationEventsUseCase,
    private readonly getNotificationEventByIdUseCase: IGetNotificationEventByIdUseCase,
    private readonly replayNotificationEventUseCase: IReplayNotificationEventUseCase,
  ) {}

  async getNotificationEvents(req: Request, res: Response): Promise<void> {
    try {
      const filter: NotificationEventFilter = {};

      // Extraer parámetros de consulta
      if (req.query.clientId) {
        filter.clientId = req.query.clientId as string;
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
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({
        message: 'Error al obtener los eventos de notificación',
        error: (error as Error).message,
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

      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        message: 'Error al obtener el evento de notificación',
        error: (error as Error).message,
      });
    }
  }

  async replayNotificationEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = await this.replayNotificationEventUseCase.execute(id);

      if (!event) {
        res.status(404).json({ message: `Evento con id ${id} no encontrado` });
        return;
      }

      res.status(200).json({
        message: 'Evento reenviado correctamente',
        event,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error al reenviar el evento de notificación',
        error: (error as Error).message,
      });
    }
  }
}
