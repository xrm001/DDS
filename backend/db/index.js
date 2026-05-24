const mysql = require('mysql2/promise');

// 创建 MySQL 连接池（支持阿里云 RDS 和本地 MySQL）
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4', // 解决中文字符编码问题
  ssl: process.env.DB_HOST.includes('aliyuncs.com') ? false : undefined, // 阿里云 RDS MySQL 禁用 SSL，本地 MySQL 使用默认设置
  waitForConnections: true,
  connectionLimit: 10, // 最大连接数
  queueLimit: 0,
  enableKeepAlive: true, // 启用长连接保活
  keepAliveInitialDelay: 0
});

// 启动时测试数据库连接
pool.getConnection()
  .then(conn => {
    console.log('[数据库] RDS 连接成功，当前库：', process.env.DB_DATABASE);
    conn.release();
  })
  .catch(err => {
    console.error('[数据库] RDS 连接失败：', err.message);
    console.error('[数据库] 错误详情：', err);
    console.error('[数据库] 当前配置：', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_DATABASE
    });
  });

module.exports = pool;
