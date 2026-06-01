const mysql = require('mysql2/promise');

async function fixOrderReviewsTable() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'db-01',
    charset: 'utf8mb4'
  });

  try {
    console.log('开始修复 order_reviews 表...\n');

    // 1. 删除旧表
    console.log('步骤1: 删除旧表 order_reviews');
    await c.query('DROP TABLE IF EXISTS order_reviews');
    console.log('  ✅ 删除成功\n');

    // 2. 重新创建（新结构）
    console.log('步骤2: 重新创建 order_reviews（新结构）');
    await c.query(`
      CREATE TABLE order_reviews (
        id int NOT NULL AUTO_INCREMENT COMMENT '审核记录ID',
        order_id int NOT NULL COMMENT '订单ID',
        review_round int NOT NULL DEFAULT '1' COMMENT '审核轮次（驳回重新提交+1）',
        review_type tinyint NOT NULL DEFAULT '1' COMMENT '1=验收审核',
        review_status enum('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
        review_remark text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '审核意见/驳回原因',
        submitted_at datetime NOT NULL COMMENT '接单人提交成果时间',
        reviewed_at datetime DEFAULT NULL COMMENT '下单人审核时间',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
        PRIMARY KEY (id),
        KEY idx_review_order_id (order_id),
        KEY idx_review_status (review_status),
        CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单审核表'
    `);
    console.log('  ✅ 创建成功\n');

    // 3. 验证新结构
    console.log('步骤3: 验证新表结构');
    const [cols] = await c.query('DESCRIBE order_reviews');
    console.log(`  字段数: ${cols.length}`);
    cols.forEach(col => console.log(`    ${col.Field}: ${col.Type}`));
    
    console.log('\n==========================================');
    console.log('修复完成！已移除冗余字段:');
    console.log('  - reviewer_id (通过 orders.creator_id 获取)');
    console.log('  - submitter_id (通过 orders.receiver_id 获取)');
    console.log('==========================================');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
  } finally {
    await c.end();
  }
}

fixOrderReviewsTable();