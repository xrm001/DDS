const path = require('path');
const dotenv = require('dotenv');

// 加载根目录的 .env 配置（必须在其他模块加载前执行）
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[DDS 后端] 服务已启动：http://localhost:${PORT}`);
  console.log(`[DDS 后端] 运行环境：${process.env.NODE_ENV || 'development'}`);
});
