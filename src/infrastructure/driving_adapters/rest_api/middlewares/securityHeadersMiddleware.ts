import { Request, Response, NextFunction } from 'express';

export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Prevenir que el navegador MIME-sniffing una respuesta de su tipo de contenido declarado
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Protección contra clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Habilitar la protección XSS en navegadores modernos
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Evitar que la aplicación se cargue en un iframe
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");

  // Forzar conexiones HTTPS (en producción)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Limitar información expuesta sobre la plataforma
  res.setHeader('X-Powered-By', 'Notification Events API');

  next();
};
