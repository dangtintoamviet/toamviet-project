require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`✅ Backend ToamViet đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error.message);
    process.exit(1);
  }
}

startServer();
