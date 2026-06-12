require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');
(async () => {
  try {
    const [c] = await db.execute("SHOW COLUMNS FROM task_types WHERE Field='type_name'");
    console.log('type_name column:', c[0]);
    
    // Alter to allow longer names
    await db.execute("ALTER TABLE task_types MODIFY COLUMN type_name VARCHAR(100) NOT NULL COMMENT '任务类型名称'");
    console.log('Column altered successfully');
    
    // Now insert
    const names = [['海报设计','poster'], ['短视频制作','video'], ['画册设计','catalog']];
    for (const [name, code] of names) {
      const [exist] = await db.execute('SELECT id FROM task_types WHERE type_name = ?', [name]);
      if (exist.length === 0) {
        await db.execute('INSERT INTO task_types (type_name, type_code) VALUES (?, ?)', [name, code]);
        console.log('Added:', name);
      } else {
        console.log('Exists:', name);
      }
    }
    
    const [r] = await db.execute('SELECT id, type_name FROM task_types ORDER BY id');
    console.log('\nFinal types:');
    r.forEach(x => console.log(' ', x.id, x.type_name));
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();