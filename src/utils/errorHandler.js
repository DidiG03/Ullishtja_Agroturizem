// Centralized error handling for production

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (err, req, res, next) => {
  const { statusCode = 500, message, isOperational = false } = err;
  
  // Log error details
  console.error(`[${new Date().toISOString()}] Error:`, {
    message,
    statusCode,
    isOperational,
    method: req?.method,
    url: req?.url,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    error: isOperational ? message : 'Internal server error',
    ...(isDevelopment && { 
      stack: err.stack,
      details: err 
    })
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    message: `Cannot ${req.method} ${req.url}`
  });
};

// Database error handler
export const handleDatabaseError = (error) => {
  if (error.code === 'P2002') {
    return new AppError('Duplicate entry found', 409);
  }
  
  if (error.code === 'P2025') {
    return new AppError('Record not found', 404);
  }
  
  if (error.code === 'P2003') {
    return new AppError('Foreign key constraint failed', 400);
  }
  
  return new AppError('Database operation failed', 500);
};

// Validation error handler
export const handleValidationError = (errors) => {
  const message = Array.isArray(errors) ? errors.join(', ') : errors;
  return new AppError(`Validation failed: ${message}`, 400);
};