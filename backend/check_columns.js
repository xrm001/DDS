const mysql = require('mysql2/promise');

async function check() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01',
    charset: 'utf8mb4'
  });

  const [r] = await c.query('DESCRIBE orders');
  console.log('orders表结构:');
  r.forEach(col => {
    if (col.Field === 'customer_name' || col.Field === 'customer_region') {
      console.log(`${col.Field}:`);
      console.log(`  Type: ${col.Type}`);
      console.log(`  Null: ${col.Null}`);
      console.log(`  Default: ${col.Default}`);
      console.log();
    }
  });

  await c.end();
}

check();