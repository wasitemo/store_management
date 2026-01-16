import ErrorMessage from "../error/ErrorMessage.js";

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err instanceof ErrorMessage;

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Internal server error",
  });
}

export default errorHandler;
