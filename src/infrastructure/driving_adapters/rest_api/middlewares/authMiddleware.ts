import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Aquí iría la lógica de autenticación
  // Por ejemplo, verificar un token JWT
  
  // Por ahora, simplemente pasamos al siguiente middleware
  next();
};