const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('Thiếu biến môi trường MONGODB_URI');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri);
  console.log('✅ Đã kết nối MongoDB');
}

module.exports = connectDB;
