require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');
(async () => {
  try {
    const [c] = await db.execute("SHOW COLUMNS FROM task_types WHERE Field='type_name'");
    console.log('type_name:', c[0].Type, '| Null:', c[0].Null);
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();