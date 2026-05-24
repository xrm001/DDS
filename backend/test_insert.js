const mysql = require('mysql2/promise');

async function testInsert() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01',
    charset: 'utf8mb4'
  });

  console.log('测试插入订单（不包含附件）...\n');

  const sql = `INSERT INTO orders (
    order_no, order_type, original_order_id, task_name, customer_name,
    customer_region, task_type_id, deadline, requirement_desc,
    creator_id, receiver_id, status, is_evaluated_by_creator,
    is_evaluated_by_receiver, reject_reason, cancel_reason,
    created_at, updated_at, completed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    '010002202505241',  // order_no
    1,                  // order_type
    null,               // original_order_id
    'JARSKING香水宣传图',  // task_name
    'JARSKING',         // customer_name
    '中国',             // customer_region
    1,                  // task_type_id
    '2025-06-01 18:00:00',  // deadline
    '设计需求',         // requirement_desc
    2,                  // creator_id
    null,               // receiver_id
    0,                  // status
    0,                  // is_evaluated_by_creator
    0,                  // is_evaluated_by_receiver
    null,               // reject_reason
    null,               // cancel_reason
    new Date(),         // created_at
    null,               // updated_at
    null                // completed_at
  ];

  console.log('SQL参数:');
  console.log('order_no:', values[0]);
  console.log('task_name:', values[3]);
  console.log('customer_name:', values[4]);
  console.log('customer_region:', values[5]);
  console.log();

  try {
    const [result] = await c.execute(sql, values);
    console.log('✅ 插入成功! InsertId:', result.insertId);
  } catch (error) {
    console.error('❌ 插入失败:');
    console.error('错误码:', error.code);
    console.error('错误号:', error.errno);
    console.error('错误信息:', error.sqlMessage);
    console.error('SQL状态:', error.sqlState);
  }

  await c.end();
}

testInsert();