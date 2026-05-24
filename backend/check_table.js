const mysql = require('mysql2/promise');

async function check() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01'
  });

  const [r] = await c.query('DESCRIBE orders');
  console.log('orders表结构:');
  r.forEach(col => {
    if (col.Field === 'customer_region' || col.Field === 'customer_name') {
      console.log(`${col.Field}: ${col.Type}`);
    }
  });

  await c.end();
}

check();