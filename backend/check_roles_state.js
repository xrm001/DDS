require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');
(async () => {
  const [c] = await db.execute("SHOW COLUMNS FROM roles WHERE Field='role_name'");
  console.log('role_name type:', c[0].Type);
  const [r] = await db.execute('SELECT COUNT(*) as cnt FROM roles');
  console.log('roles count:', r[0].cnt);
  const [pr] = await db.execute('SELECT COUNT(*) as cnt FROM person_roles');
  console.log('person_roles count:', pr[0].cnt);
  process.exit(0);
})();
