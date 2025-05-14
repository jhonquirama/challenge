import { Request, Response, NextFunction } from 'express';

export class RateLimitMiddleware {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit = 100, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const identifier = req.ip || 'unknown';
      const now = Date.now();

      if (now % 600000 < 1000) {
        this.cleanup(now);
      }

      let record = this.requestCounts.get(identifier);
      if (!record) {
        record = { count: 0, resetTime: now + this.windowMs };
        this.requestCounts.set(identifier, record);
      }

      if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + this.windowMs;
      }

      record.count++;

      if (record.count > this.limit) {
        res.status(429).json({
          message: 'Demasiadas peticiones, intente más tarde',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
        return;
      }

      res.setHeader('X-RateLimit-Limit', this.limit.toString());
      res.setHeader('X-RateLimit-Remaining', (this.limit - record.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

      next();
    } catch (error) {
      next();
    }
  };

  private cleanup(now: number): void {
    for (const [key, value] of this.requestCounts.entries()) {
      if (now > value.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}
