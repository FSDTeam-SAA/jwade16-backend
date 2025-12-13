import { Request, Response, NextFunction } from 'express';

export function sanitizeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
}

function sanitize(obj: Record<string, any>) {
  if (!obj || typeof obj !== 'object') return;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  }
}
