require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');
(async () => {
  const [r] = await db.execute('SELECT id, type_name, type_code FROM task_types ORDER BY id');
  r.forEach(x => console.log(x.id, x.type_name, x.type_code));
  process.exit(0);
})();