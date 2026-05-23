const mysql = require('mysql2/promise');

async function checkTable() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01'
  });

  const [columns] = await conn.query('DESCRIBE cut_in_line_requests');
  
  console.log('✅ 表 cut_in_line_requests 结构：\n');
  console.log('字段名'.padEnd(25) + '类型'.padEnd(15) + '空'.padEnd(6) + '键'.padEnd(8) + '说明');
  console.log('─'.repeat(80));
  
  columns.forEach(col => {
    console.log(
      col.Field.padEnd(25) +
      col.Type.padEnd(15) +
      col.Null.padEnd(6) +
      (col.Key || '-').padEnd(8) +
      (col.Comment || '-')
    );
  });

  await conn.end();
}

checkTable();
