require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../sql/10_redesign_roles.sql'), 'utf-8');
  
  // 先去掉所有注释行，再按分号分割
  const cleanSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const conn = await db.getConnection();
  try {
    for (const stmt of cleanSql) {
      if (!stmt) continue;
      
      console.log('[执行]', stmt.substring(0, 80).replace(/\n/g, ' '));
      await conn.query(stmt);
      console.log('[完成]');
    }
    
    // 验证结果
    const [rows] = await conn.execute('SELECT id, role_code, role_name, description FROM roles ORDER BY id');
    console.log('\n=== 新角色表（共' + rows.length + '条）===');
    rows.forEach(r => console.log(`  ${String(r.id).padStart(2)}. ${r.role_name.padEnd(16)} (${r.role_code})`));
    
    console.log('\n迁移成功！');
  } catch (err) {
    console.error('[迁移失败]', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
