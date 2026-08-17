import mongoose from 'mongoose';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Centralized error handler with mongoose validation/duplicate-key mapping. */
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  const details = err.details || null;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'record';
    message = `A record with this ${field} already exists.`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier provided.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body.';
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ message, ...(details ? { details } : {}) });
}
