/**
 * 404 Not Found handler
 */

import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './errorHandler.js';

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
}
