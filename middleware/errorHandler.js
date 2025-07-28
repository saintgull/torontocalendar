// Centralized error handling middleware

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// PostgreSQL error code mapping
const pgErrorMap = {
  '23505': { status: 409, message: 'A record with this information already exists' },
  '23503': { status: 400, message: 'Referenced record does not exist' },
  '22P02': { status: 400, message: 'Invalid input format' },
  '22001': { status: 400, message: 'Input value too long' },
  '23502': { status: 400, message: 'Required field is missing' },
  '08000': { status: 503, message: 'Database connection error' },
  '08003': { status: 503, message: 'Database connection does not exist' },
  '08006': { status: 503, message: 'Database connection failure' },
  '08001': { status: 503, message: 'Unable to connect to database' },
  '08004': { status: 503, message: 'Database connection rejected' },
  '57P03': { status: 503, message: 'Database is not available' },
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.url}:`);
  console.error('Error:', err);
  
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  
  // Handle PostgreSQL errors
  if (err.code && pgErrorMap[err.code]) {
    const pgError = pgErrorMap[err.code];
    statusCode = pgError.status;
    message = pgError.message;
    code = `DB_ERROR_${err.code}`;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    code = 'TOKEN_EXPIRED';
  }
  
  // Handle validation errors from express-validator
  if (err.type === 'validation') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size too large';
    code = 'FILE_TOO_LARGE';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file upload';
    code = 'UNEXPECTED_FILE';
  }
  
  // Prepare error response
  const errorResponse = {
    error: {
      message,
      code,
      statusCode
    }
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler
};