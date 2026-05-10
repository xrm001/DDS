const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: false, // 阿里云RDS MySQL 需禁用SSL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log('[DB] RDS 数据库连接成功:', process.env.DB_DATABASE);
    conn.release();
  })
  .catch(err => {
    console.error('[DB] RDS 数据库连接失败:', err.message);
    console.error('[DB] 错误详情:', err);
    console.error('[DB] 当前配置:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_DATABASE
    });
  });

module.exports = pool;
