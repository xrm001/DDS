require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');
(async () => {
  const conn = await db.getConnection();
  try {
    await conn.execute("INSERT INTO task_types (type_name, type_code) VALUES ('海报设计', 'poster')");
    await conn.execute("INSERT INTO task_types (type_name, type_code) VALUES ('短视频制作', 'video')");
    await conn.execute("INSERT INTO task_types (type_name, type_code) VALUES ('画册设计', 'catalog')");
    const [r] = await conn.execute('SELECT id, type_name, type_code FROM task_types ORDER BY id');
    r.forEach(x => console.log(x.id, x.type_name, x.type_code));
  } finally {
    conn.release();
    process.exit(0);
  }
})();