const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createTable() {
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'db-01'
    });

    console.log('已连接到数据库 db-01');

    // 读取 SQL 文件
    const sqlFile = path.join(__dirname, '..', 'sql', '07_cut_in_line_requests.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('正在执行 SQL...');

    // 直接执行完整 SQL 语句
    await connection.query(sql);

    console.log('✅ 插队表创建成功！');
    console.log('表名: cut_in_line_requests');

    // 验证表是否存在
    const [tables] = await connection.query('SHOW TABLES LIKE "cut_in_line_requests"');
    if (tables.length > 0) {
      console.log('✅ 表验证成功！');
    }

    await connection.end();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    process.exit(1);
  }
}

createTable();
