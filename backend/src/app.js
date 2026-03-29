const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.'
  }
});

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(item => item.trim())
  : ['*'];

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend ToamViet hoạt động bình thường.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
