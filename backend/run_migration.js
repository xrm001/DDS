const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01',
    charset: 'utf8mb4',
    multipleStatements: true
  });

  try {
    console.log('开始执行数据库迁移...\n');

    // 读取SQL文件
    const sqlFile = path.join(__dirname, '../sql/09_reviews_and_deal_fields.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // 分割成单个语句，并清理注释
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // 过滤空行和纯注释行
        if (!s) return false;
        const lines = s.split('\n').map(l => l.trim()).filter(l => l);
        return lines.length > 0 && !lines.every(l => l.startsWith('--'));
      });
    
    console.log(`找到 ${statements.length} 个SQL语句\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`执行 ${i + 1}/${statements.length}: ${stmt.substring(0, 60)}...`);
      await c.query(stmt);
      console.log('  ✅ 成功\n');
    }

    console.log('==========================================');
    console.log('数据库迁移完成！');
    console.log('==========================================\n');

    // 验证创建结果
    console.log('验证结果:');
    
    // 1. 检查order_reviews表
    const [tables1] = await c.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'db-01' AND table_name = 'order_reviews'
    `);
    console.log(`  order_reviews表: ${tables1.length > 0 ? '✅ 已创建' : '❌ 创建失败'}`);
    
    if (tables1.length > 0) {
      const [cols] = await c.query('DESCRIBE order_reviews');
      console.log(`    字段数: ${cols.length}`);
    }

    // 2. 检查orders表新增字段
    const [cols2] = await c.query('DESCRIBE orders');
    const dealFields = cols2.filter(col => 
      col.Field === 'deal_status' || 
      col.Field === 'deal_amount' || 
      col.Field === 'currency'
    );
    
    console.log(`  orders表新增字段:`);
    dealFields.forEach(col => {
      console.log(`    ✅ ${col.Field}: ${col.Type}`);
    });

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await c.end();
  }
}

runMigration();