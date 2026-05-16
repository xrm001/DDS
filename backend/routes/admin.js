const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * POST /api/admin/init-roles
 * 初始化/更新 roles 表中的角色
 */
router.post('/init-roles', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. 先 ALTER 修改 enum 字段（添加新角色）
    await connection.query(`
      ALTER TABLE \`roles\` 
      MODIFY COLUMN \`role_name\` enum(
        '业务下单人',
        '运营下单人',
        '新媒体运营下单人',
        '3D接单人',
        '平面接单人',
        '品牌接单人',
        '摄影接单人',
        '业务总负责人',
        '外贸一部负责人',
        '外贸一部下单人',
        '设计部负责人',
        '负责人',
        '系统管理员'
      ) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称'
    `);
    console.log('✓ 已 ALTER roles 表');

    // 2. 删除旧的非标准角色（如果存在）
    await connection.query(`
      DELETE FROM \`roles\` WHERE \`role_name\` NOT IN (
        '业务下单人', '运营下单人', '新媒体运营下单人', '3D接单人',
        '平面接单人', '品牌接单人', '摄影接单人', '业务总负责人',
        '外贸一部负责人', '外贸一部下单人', '设计部负责人', '负责人', '系统管理员'
      )
    `);

    // 3. 插入/更新新角色
    const roles = [
      ['business_orderer', '业务下单人', '业务部门的订单创建人员'],
      ['operation_orderer', '运营下单人', '运营部门的订单创建人员'],
      ['newmedia_operation_orderer', '新媒体运营下单人', '新媒体运营部门的订单创建人员'],
      ['receiver_3d', '3D接单人', '负责3D设计任务执行'],
      ['receiver_graphic', '平面接单人', '负责平面设计任务执行'],
      ['receiver_brand', '品牌接单人', '负责全案设计和品牌设计任务执行'],
      ['receiver_photo', '摄影接单人', '负责摄影任务执行'],
      ['business_general_manager', '业务总负责人', '业务部门总负责人'],
      ['foreign_trade_dept1_manager', '外贸一部负责人', '外贸一部负责人'],
      ['foreign_trade_dept1_orderer', '外贸一部下单人', '外贸一部的订单创建人员'],
      ['design_dept_manager', '设计部负责人', '设计部负责人'],
      ['manager', '负责人', '拥有全部订单管理权限'],
      ['admin', '系统管理员', '系统配置和管理权限'],
    ];

    for (const role of roles) {
      await connection.query(
        `INSERT INTO \`roles\` (\`role_code\`, \`role_name\`, \`description\`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE \`role_name\` = VALUES(\`role_name\`), \`description\` = VALUES(\`description\`)`,
        role
      );
    }
    console.log('✓ 已插入/更新所有角色');

    await connection.commit();

    // 查询验证
    const [rows] = await connection.query('SELECT id, role_code, role_name, description FROM roles ORDER BY id');
    
    res.json({
      success: true,
      message: 'roles 表初始化成功',
      data: rows
    });

  } catch (error) {
    await connection.rollback();
    console.error('[初始化角色] 错误：', error);
    res.status(500).json({
      success: false,
      message: '初始化失败：' + error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;