require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4'
});
(async () => {
  const conn = await pool.getConnection();
  const [r] = await conn.execute('SELECT id, type_name FROM task_types ORDER BY id');
  console.log('Current types:');
  r.forEach(x => console.log(x.id, x.type_name));
  
  const names = [['海报设计','poster'], ['短视频制作','video'], ['画册设计','catalog']];
  for (const [name, code] of names) {
    const [exist] = await conn.execute('SELECT id FROM task_types WHERE type_name = ?', [name]);
    if (exist.length === 0) {
      await conn.execute('INSERT INTO task_types (type_name, type_code) VALUES (?, ?)', [name, code]);
      console.log('Added:', name);
    } else {
      console.log('Exists:', name);
    }
  }
  
  const [r2] = await conn.execute('SELECT id, type_name FROM task_types ORDER BY id');
  console.log('\nFinal types:');
  r2.forEach(x => console.log(x.id, x.type_name));
  conn.release();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });