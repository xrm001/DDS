const mysql = require('mysql2/promise');

async function checkAttachments() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01',
    charset: 'utf8mb4'
  });

  const [r] = await c.query('DESCRIBE attachments');
  console.log('attachments 表结构:');
  r.forEach(col => console.log(`  ${col.Field}: ${col.Type} | Null: ${col.Null} | Default: ${col.Default}`));

  await c.end();
}

checkAttachments();