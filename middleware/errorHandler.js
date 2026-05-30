// Centralized error handler for the whole app.
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Something went wrong on the server.',
    statusCode
  });
};

module.exports = errorHandler;