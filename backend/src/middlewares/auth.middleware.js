const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    throw new AppError('Bạn chưa đăng nhập.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Không tìm thấy người dùng.', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('Tài khoản đang bị khóa.', 403);
  }

  req.user = user;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện chức năng này.', 403));
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
