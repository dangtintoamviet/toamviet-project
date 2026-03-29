function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy đường dẫn ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV !== 'production') {
    console.error('ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Đã có lỗi xảy ra trên máy chủ.',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
