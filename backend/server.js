const path = require('path');
const dotenv = require('dotenv');
const open = require('open');
const { execSync } = require('child_process');
const os = require('os');

// 获取本机局域网 IPv4 地址
function getLanIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// 加载根目录的 .env 配置（必须在其他模块加载前执行）
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const notifyRoutes = require('./routes/notify');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 支持大体积请求（附件Base64）
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务 - 提供前端构建后的文件
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notify', notifyRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 所有非API请求返回前端页面（SPA路由支持）
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

// 自动构建前端
function buildFrontend() {
  const fs = require('fs');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  const indexFile = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.log('[DDS] 正在构建前端...');
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '../frontend'), stdio: 'inherit' });
      console.log('[DDS] 前端构建完成');
    } catch (err) {
      console.error('[DDS] 前端构建失败:', err.message);
    }
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  // 启动前先构建前端
  buildFrontend();
  
  const LAN_IP = getLanIP();
  const frontendUrl = `http://${LAN_IP}:${PORT}`;
  
  console.log(`[DDS 后端] 服务已启动`);
  console.log(`[DDS 后端] 局域网访问：${frontendUrl}`);
  console.log(`[DDS 后端] 运行环境：${process.env.NODE_ENV || 'development'}`);
  console.log(`[DDS 后端] 正在打开浏览器...`);
  
  try {
    await open(frontendUrl);
    console.log('[DDS 后端] 浏览器已打开');
  } catch (err) {
    console.log('[DDS 后端] 请手动访问:', frontendUrl);
  }
});
