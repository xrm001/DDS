require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');
(async () => {
  const conn = await db.getConnection();
  try {
    // Check if they already exist
    const [existing] = await conn.execute("SELECT type_name FROM task_types WHERE type_name IN ('海报设计', '短视频制作', '画册设计')");
    console.log('Existing:', existing.map(r => r.type_name));
    
    // Insert if not exist
    for (const name of ['海报设计', '短视频制作', '画册设计']) {
      const [r] = await conn.execute("SELECT id FROM task_types WHERE type_name = ?", [name]);
      if (r.length === 0) {
        const code = name === '海报设计' ? 'poster' : name === '短视频制作' ? 'video' : 'catalog';
        await conn.execute("INSERT INTO task_types (type_name, type_code) VALUES (?, ?)", [name, code]);
        console.log('Inserted:', name);
      } else {
        console.log('Already exists:', name);
      }
    }
    
    const [types] = await conn.execute('SELECT id, type_name, type_code FROM task_types ORDER BY id');
    console.log('\n=== All task types ===');
    types.forEach(x => console.log(x.id, x.type_name, x.type_code));
  } finally {
    conn.release();
    process.exit(0);
  }
})();