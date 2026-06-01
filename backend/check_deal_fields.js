const mysql = require('mysql2/promise');

async function checkDealFields() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01',
    charset: 'utf8mb4'
  });

  // 检查orders表是否有成交相关字段
  const [cols] = await c.query('DESCRIBE orders');
  const dealFields = cols.filter(col => 
    col.Field.includes('deal') || 
    col.Field.includes('currency') || 
    col.Field.includes('amount')
  );
  
  console.log('orders表 - 成交相关字段:');
  if (dealFields.length === 0) {
    console.log('  ❌ 无成交状态/成交金额字段');
  } else {
    dealFields.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} | Null: ${col.Null}`);
    });
  }

  // 检查messages表是否存在
  const [tables] = await c.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'db-01' AND table_name = 'messages'
  `);
  
  console.log('\nmessages表:');
  if (tables.length > 0) {
    console.log('  ✅ messages表已存在');
    const [msgCols] = await c.query('DESCRIBE messages');
    console.log('  字段列表:');
    msgCols.forEach(col => console.log(`    ${col.Field}: ${col.Type}`));
  } else {
    console.log('  ❌ messages表不存在');
  }

  // 检查evaluations表是否存在
  const [evalTables] = await c.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'db-01' AND table_name = 'evaluations'
  `);
  
  console.log('\nevaluations表:');
  if (evalTables.length > 0) {
    console.log('  ✅ evaluations表已存在');
  } else {
    console.log('  ❌ evaluations表不存在');
  }

  await c.end();
}

checkDealFields();