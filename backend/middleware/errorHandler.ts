import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
  
  // Structured log for debugging
  console.error(`[API Error] [${req.method} ${req.originalUrl}]`, {
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
    errors: err.errors || undefined,
  });
}
