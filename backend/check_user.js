const mysql = require('mysql2/promise');

async function check() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01'
  });

  // 检查用户信息
  const [users] = await c.query('SELECT id, username, real_name, dept_id FROM person WHERE id = 2');
  console.log('用户信息 (id=2):');
  console.log(users);

  // 检查部门信息
  if (users[0]?.dept_id) {
    const [depts] = await c.query('SELECT id, name FROM department WHERE id = ?', [users[0].dept_id]);
    console.log('\n部门信息:');
    console.log(depts);
  }

  await c.end();
}

check();