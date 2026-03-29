const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/jwt');

function buildAuthResponse(user) {
  const token = signToken({ id: user._id, role: user.role });

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    }
  };
}

const register = asyncHandler(async (req, res) => {
  const { fullName, phone, email, password } = req.body;

  if (!fullName || !phone || !email || !password) {
    throw new AppError('Vui lòng nhập đầy đủ họ tên, số điện thoại, email và mật khẩu.', 400);
  }

  const existingUser = await User.findOne({
    $or: [{ email: String(email).toLowerCase().trim() }, { phone: String(phone).trim() }]
  });

  if (existingUser) {
    throw new AppError('Email hoặc số điện thoại đã tồn tại.', 409);
  }

  const user = await User.create({
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    email: String(email).toLowerCase().trim(),
    password: String(password)
  });

  res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản thành công.',
    data: buildAuthResponse(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { account, email, phone, password } = req.body;
  const loginValue = account || email || phone;

  if (!loginValue || !password) {
    throw new AppError('Vui lòng nhập tài khoản và mật khẩu.', 400);
  }

  const normalizedValue = String(loginValue).trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalizedValue }, { phone: String(loginValue).trim() }]
  }).select('+password');

  if (!user) {
    throw new AppError('Tài khoản hoặc mật khẩu không đúng.', 401);
  }

  const isMatch = await user.comparePassword(String(password));
  if (!isMatch) {
    throw new AppError('Tài khoản hoặc mật khẩu không đúng.', 401);
  }

  res.status(200).json({
    success: true,
    message: 'Đăng nhập thành công.',
    data: buildAuthResponse(user)
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        phone: req.user.phone,
        email: req.user.email,
        avatar: req.user.avatar,
        role: req.user.role,
        status: req.user.status,
        createdAt: req.user.createdAt
      }
    }
  });
});

module.exports = {
  register,
  login,
  getMe
};
