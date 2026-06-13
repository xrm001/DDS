const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// =============================================
// 数据总览看板
// =============================================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // 今日新增订单
    const [todayOrdersRows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM orders WHERE DATE(created_at) = ?`, [todayStr]
    );
    const todayOrders = todayOrdersRows[0]?.cnt || 0;

    // 待处理订单 (status 0/1/2)
    const [pendingRows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM orders WHERE status IN (0, 1, 2)`
    );
    const pendingOrders = pendingRows[0]?.cnt || 0;

    // 今日完成
    const [todayCompletedRows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM orders WHERE status = 4 AND DATE(completed_at) = ?`, [todayStr]
    );
    const todayCompleted = todayCompletedRows[0]?.cnt || 0;

    // 系统用户数
    const [userRows] = await db.execute(`SELECT COUNT(*) AS cnt FROM person`);
    const totalUsers = userRows[0]?.cnt || 0;

    // 订单状态分布
    const [statusRows] = await db.execute(`
      SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status
    `);
    const statusNames = { 0: '待派单', 1: '待接单', 2: '进行中', 3: '待验收', 4: '已完成', 5: '已拒绝', 6: '已取消' };
    const statusColors = { 0: '#d9d9d9', 1: '#faad14', 2: '#1890ff', 3: '#faad14', 4: '#52c41a', 5: '#ff4d4f', 6: '#8c8c8c' };
    const statusDistribution = statusRows.map(r => ({
      name: statusNames[r.status] || `状态${r.status}`,
      value: r.cnt,
      color: statusColors[r.status] || '#d9d9d9',
    }));

    // 任务类型分布
    const [typeRows] = await db.execute(`
      SELECT tt.type_name, COUNT(*) AS cnt
      FROM orders o JOIN task_types tt ON o.task_type_id = tt.id
      GROUP BY tt.type_name
    `);
    const taskTypeDistribution = typeRows.map(r => ({ name: r.type_name, value: r.cnt }));

    // 近30天趋势
    const dates = [];
    const ordered = [];
    const completed = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
      const ds = d.toISOString().slice(0, 10);
      const [o] = await db.execute(`SELECT COUNT(*) AS cnt FROM orders WHERE DATE(created_at) = ?`, [ds]);
      ordered.push(o[0]?.cnt || 0);
      const [c] = await db.execute(`SELECT COUNT(*) AS cnt FROM orders WHERE status = 4 AND DATE(completed_at) = ?`, [ds]);
      completed.push(c[0]?.cnt || 0);
    }

    // 接单人工作负载 (status IN 1,2,3)
    const [workloadRows] = await db.execute(`
      SELECT p.real_name AS name, COUNT(*) AS cnt
      FROM orders o JOIN person p ON o.receiver_id = p.id
      WHERE o.status IN (1, 2, 3)
      GROUP BY o.receiver_id, p.real_name
      ORDER BY cnt DESC
      LIMIT 15
    `);
    const receiverWorkload = workloadRows.map(r => ({ name: r.name, value: r.cnt }));

    res.json({
      success: true,
      data: {
        todayOrders, pendingOrders, todayCompleted, totalUsers,
        statusDistribution, taskTypeDistribution,
        dailyTrend: { dates, ordered, completed },
        receiverWorkload,
      }
    });
  } catch (error) {
    console.error('[dashboard-stats] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 人员管理 CRUD
// =============================================
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT p.id, p.username, p.real_name, p.dept_id, p.phone, p.email, p.status, p.class, p.job, p.super_id, p.created_at,
             d.name AS department_name,
             sp.real_name AS super_name
      FROM person p
      LEFT JOIN department d ON p.dept_id = d.id
      LEFT JOIN person sp ON p.super_id = sp.id
      ORDER BY p.id
    `);
    // 查询每个用户的角色
    const [allRoles] = await db.execute(`
      SELECT pr.person_id, r.id, r.role_code, r.role_name
      FROM person_roles pr JOIN roles r ON pr.role_id = r.id
    `);
    const roleMap = {};
    allRoles.forEach(r => {
      if (!roleMap[r.person_id]) roleMap[r.person_id] = [];
      roleMap[r.person_id].push({ id: r.id, role_code: r.role_code, role_name: r.role_name });
    });
    users.forEach(u => { u.roles = roleMap[u.id] || []; });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('[users] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users', async (req, res) => {
  const { username, password, real_name, dept_id, phone, email, status, role_ids, class: userClass, job, super_id } = req.body;
  if (!username || !real_name) {
    return res.status(400).json({ success: false, message: '用户名和姓名不能为空' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [exists] = await conn.query('SELECT id FROM person WHERE username = ?', [username]);
    if (exists.length > 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    const hashedPw = await bcrypt.hash(password || '123456', 10);
    const [result] = await conn.query(
      `INSERT INTO person (username, password, real_name, dept_id, phone, email, status, class, job, super_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPw, real_name, dept_id || null, phone || null, email || null, status ?? 1, userClass || null, job || null, super_id || null]
    );
    const userId = result.insertId;
    if (Array.isArray(role_ids) && role_ids.length > 0) {
      for (const rid of role_ids) {
        await conn.query('INSERT IGNORE INTO person_roles (person_id, role_id) VALUES (?, ?)', [userId, rid]);
      }
    }
    await conn.commit();
    res.json({ success: true, message: '新增成功', data: { id: userId } });
  } catch (error) {
    await conn.rollback();
    console.error('[users create] error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

router.put('/users/:id', async (req, res) => {
  const { real_name, dept_id, phone, email, status, role_ids, class: userClass, job, super_id } = req.body;
  const userId = req.params.id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE person SET real_name=?, dept_id=?, phone=?, email=?, status=?, class=?, job=?, super_id=? WHERE id=?`,
      [real_name, dept_id || null, phone || null, email || null, status ?? 1, userClass || null, job || null, super_id || null, userId]
    );
    if (Array.isArray(role_ids)) {
      await conn.query('DELETE FROM person_roles WHERE person_id = ?', [userId]);
      for (const rid of role_ids) {
        await conn.query('INSERT IGNORE INTO person_roles (person_id, role_id) VALUES (?, ?)', [userId, rid]);
      }
    }
    await conn.commit();
    res.json({ success: true, message: '修改成功' });
  } catch (error) {
    await conn.rollback();
    console.error('[users update] error:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    await db.execute('UPDATE person SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true, message: '操作成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const hashedPw = await bcrypt.hash('123456', 10);
    await db.execute('UPDATE person SET password = ? WHERE id = ?', [hashedPw, req.params.id]);
    res.json({ success: true, message: '密码已重置为 123456' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 角色管理 CRUD
// =============================================
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await db.execute(`
      SELECT r.*, (SELECT COUNT(*) FROM person_roles WHERE role_id = r.id) AS user_count
      FROM roles r ORDER BY r.id
    `);
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/roles', async (req, res) => {
  const { role_code, role_name, description } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO roles (role_code, role_name, description) VALUES (?, ?, ?)`,
      [role_code, role_name, description || null]
    );
    res.json({ success: true, message: '新增成功', data: { id: result.insertId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '角色编码已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  const { role_name, description } = req.body;
  try {
    await db.execute('UPDATE roles SET role_name=?, description=? WHERE id=?', [role_name, description || null, req.params.id]);
    res.json({ success: true, message: '修改成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/roles/:id', async (req, res) => {
  try {
    const [pr] = await db.execute('SELECT COUNT(*) AS cnt FROM person_roles WHERE role_id = ?', [req.params.id]);
    if (pr[0]?.cnt > 0) return res.status(400).json({ success: false, message: '该角色还有关联人员，无法删除' });
    await db.execute('DELETE FROM roles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 部门管理 CRUD
// =============================================
router.get('/departments', async (req, res) => {
  try {
    const [depts] = await db.execute(`
      SELECT d.*, (SELECT COUNT(*) FROM person WHERE dept_id = d.id) AS user_count
      FROM department d ORDER BY d.id
    `);
    res.json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/departments', async (req, res) => {
  const { name, level, parent_id } = req.body;
  if (!name) return res.status(400).json({ success: false, message: '部门名称不能为空' });
  try {
    const [result] = await db.execute(
      `INSERT INTO department (name, level, parent_id) VALUES (?, ?, ?)`,
      [name, level || null, parent_id || null]
    );
    res.json({ success: true, message: '新增成功', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  const { name, level, parent_id } = req.body;
  try {
    await db.execute('UPDATE department SET name=?, level=?, parent_id=? WHERE id=?',
      [name, level || null, parent_id || null, req.params.id]);
    res.json({ success: true, message: '修改成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    const [p] = await db.execute('SELECT COUNT(*) AS cnt FROM person WHERE dept_id = ?', [req.params.id]);
    if (p[0]?.cnt > 0) return res.status(400).json({ success: false, message: '该部门还有关联人员，无法删除' });
    await db.execute('DELETE FROM department WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 任务类型管理
// =============================================
router.get('/task-types', async (req, res) => {
  try {
    const [types] = await db.execute(`
      SELECT tt.*, (SELECT COUNT(*) FROM orders WHERE task_type_id = tt.id) AS order_count
      FROM task_types tt ORDER BY tt.id
    `);
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/task-types', async (req, res) => {
  const { type_name, type_code } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO task_types (type_name, type_code) VALUES (?, ?)`,
      [type_name, type_code]
    );
    res.json({ success: true, message: '新增成功', data: { id: result.insertId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '类型编码或名称已存在' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/task-types/:id', async (req, res) => {
  const { type_name, type_code } = req.body;
  try {
    const sets = [];
    const vals = [];
    if (type_name !== undefined) { sets.push('type_name=?'); vals.push(type_name); }
    if (type_code !== undefined) { sets.push('type_code=?'); vals.push(type_code); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: '没有可更新的字段' });
    vals.push(req.params.id);
    await db.execute(`UPDATE task_types SET ${sets.join(',')} WHERE id=?`, vals);
    res.json({ success: true, message: '修改成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 派单规则管理（基于 task_types 表的 dispatch 字段）
// =============================================
router.get('/dispatch-rules', async (req, res) => {
  try {
    const [rules] = await db.execute(`
      SELECT id, type_name, type_code,
        COALESCE(dispatch_roles, '') AS dispatch_roles,
        COALESCE(dispatch_mode, 'group') AS dispatch_mode,
        COALESCE(status_range, '2,3') AS status_range
      FROM task_types ORDER BY id
    `);
    res.json({ success: true, data: rules });
  } catch (error) {
    // 如果字段不存在，尝试返回基础数据
    try {
      const [rules] = await db.execute('SELECT id, type_name, type_code FROM task_types ORDER BY id');
      rules.forEach(r => {
        r.dispatch_roles = '';
        r.dispatch_mode = 'group';
        r.status_range = '2,3';
      });
      res.json({ success: true, data: rules });
    } catch (e2) {
      res.status(500).json({ success: false, message: e2.message });
    }
  }
});

router.put('/dispatch-rules/:id', async (req, res) => {
  const { dispatch_roles, dispatch_mode, status_range } = req.body;
  try {
    await db.execute(
      `UPDATE task_types SET dispatch_roles=?, dispatch_mode=?, status_range=? WHERE id=?`,
      [dispatch_roles || null, dispatch_mode || 'group', status_range || '2,3', req.params.id]
    );
    res.json({ success: true, message: '修改成功' });
  } catch (error) {
    // 字段可能不存在，尝试 alter
    try {
      await db.execute(`
        ALTER TABLE task_types
        ADD COLUMN dispatch_roles VARCHAR(200) DEFAULT NULL,
        ADD COLUMN dispatch_mode VARCHAR(20) DEFAULT 'group',
        ADD COLUMN status_range VARCHAR(20) DEFAULT '2,3'
      `);
      await db.execute(
        `UPDATE task_types SET dispatch_roles=?, dispatch_mode=?, status_range=? WHERE id=?`,
        [dispatch_roles || null, dispatch_mode || 'group', status_range || '2,3', req.params.id]
      );
      res.json({ success: true, message: '修改成功（已新增字段）' });
    } catch (e2) {
      res.status(500).json({ success: false, message: e2.message });
    }
  }
});

// =============================================
// 全局订单监控
// =============================================
router.get('/orders', async (req, res) => {
  const { page = 1, pageSize = 20, keyword, status, order_type, start_date, end_date } = req.query;
  const limit = Math.max(1, parseInt(pageSize) || 20);
  const offset = Math.max(0, (parseInt(page) - 1) * limit);
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(o.order_no LIKE ? OR o.task_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status !== undefined && status !== '' && status !== null) {
    conditions.push('o.status = ?');
    params.push(parseInt(status));
  }
  if (order_type !== undefined && order_type !== '' && order_type !== null) {
    conditions.push('o.order_type = ?');
    params.push(parseInt(order_type));
  }
  if (start_date) {
    conditions.push('o.created_at >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('o.created_at <= ?');
    params.push(end_date + ' 23:59:59');
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const [totalRows] = await db.execute(`SELECT COUNT(*) AS cnt FROM orders o ${where}`, params);
    const total = totalRows[0]?.cnt || 0;

    const sql = `
      SELECT o.*, tt.type_name AS task_type_name,
        pc.real_name AS creator_name, pr.real_name AS receiver_name
      FROM orders o
      LEFT JOIN task_types tt ON o.task_type_id = tt.id
      LEFT JOIN person pc ON o.creator_id = pc.id
      LEFT JOIN person pr ON o.receiver_id = pr.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [orders] = await db.execute(sql);

    res.json({ success: true, data: orders, total });
  } catch (error) {
    console.error('[admin orders] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/orders/export', async (req, res) => {
  // 简单 CSV 导出
  try {
    const [orders] = await db.execute(`
      SELECT o.order_no, o.task_name, tt.type_name AS task_type_name,
        o.customer_name, o.customer_region,
        pc.real_name AS creator_name, pr.real_name AS receiver_name,
        o.status, o.created_at, o.completed_at
      FROM orders o
      LEFT JOIN task_types tt ON o.task_type_id = tt.id
      LEFT JOIN person pc ON o.creator_id = pc.id
      LEFT JOIN person pr ON o.receiver_id = pr.id
      ORDER BY o.created_at DESC
      LIMIT 5000
    `);
    const statusNames = { 0: '待派单', 1: '待接单', 2: '进行中', 3: '待验收', 4: '已完成', 5: '已拒绝', 6: '已取消' };
    const BOM = '\ufeff';
    let csv = BOM + '订单编号,任务名称,任务类型,客户,客户地区,下单人,接单人,状态,下单时间,完成时间\n';
    orders.forEach(o => {
      csv += [
        o.order_no, o.task_name, o.task_type_name, o.customer_name, o.customer_region,
        o.creator_name, o.receiver_name || '待派单',
        statusNames[o.status] || o.status,
        o.created_at, o.completed_at || ''
      ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().slice(0,10)}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 数据统计
// =============================================
router.get('/statistics', async (req, res) => {
  const { start_date, end_date } = req.query;
  const dateCond = start_date && end_date
    ? 'AND o.created_at BETWEEN ? AND ?'
    : '';
  const dateParams = start_date && end_date ? [start_date, end_date + ' 23:59:59'] : [];

  try {
    // 下单人统计
    const [ordererStats] = await db.execute(`
      SELECT p.real_name AS name,
        COUNT(*) AS total,
        SUM(CASE WHEN o.status = 4 THEN 1 ELSE 0 END) AS completed
      FROM orders o JOIN person p ON o.creator_id = p.id
      WHERE 1=1 ${dateCond}
      GROUP BY o.creator_id, p.real_name ORDER BY total DESC
    `, dateParams);

    // 接单人统计
    const [receiverStats] = await db.execute(`
      SELECT p.real_name AS name,
        COUNT(*) AS total,
        SUM(CASE WHEN o.status = 4 THEN 1 ELSE 0 END) AS completed,
        ROUND(AVG(CASE WHEN o.status = 4 AND o.completed_at IS NOT NULL
          THEN DATEDIFF(o.completed_at, o.created_at) ELSE NULL END), 1) AS avg_days
      FROM orders o JOIN person p ON o.receiver_id = p.id
      WHERE 1=1 ${dateCond}
      GROUP BY o.receiver_id, p.real_name ORDER BY total DESC
    `, dateParams);

    // 任务类型统计
    const [typeStats] = await db.execute(`
      SELECT tt.type_name AS name, COUNT(*) AS value
      FROM orders o JOIN task_types tt ON o.task_type_id = tt.id
      WHERE 1=1 ${dateCond}
      GROUP BY tt.type_name
    `, dateParams);
    const taskTypeStats = typeStats.map(r => ({ name: r.name, value: r.value }));

    // 部门统计
    const [deptStats] = await db.execute(`
      SELECT COALESCE(d.name, '未分配') AS name, COUNT(*) AS total,
        SUM(CASE WHEN o.status = 4 THEN 1 ELSE 0 END) AS completed
      FROM orders o
      JOIN person p ON o.creator_id = p.id
      LEFT JOIN department d ON p.dept_id = d.id
      WHERE 1=1 ${dateCond}
      GROUP BY d.id, d.name ORDER BY total DESC
    `, dateParams);
    const departmentStats = deptStats.map(r => ({ name: r.name, total: r.total, completed: r.completed }));

    // 成交统计
    let dealStats = { total: 0, success: 0, amount: 0 };
    try {
      const [dealRows] = await db.execute(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN deal_status = 1 THEN 1 ELSE 0 END) AS success,
          COALESCE(SUM(deal_amount), 0) AS amount
        FROM orders WHERE 1=1 ${dateCond.replace('o.', '')}
      `, dateParams);
      dealStats = dealRows[0] || dealStats;
    } catch (e) {
      // deal_status/deal_amount 字段可能不存在
    }

    // 每日趋势（批量查询优化）
    const dates = [];
    const ordered = [];
    const completed = [];
    const startD = start_date || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endD = end_date || new Date().toISOString().slice(0, 10);

    // 生成日期数组
    const cursor = new Date(startD + 'T00:00:00');
    const endDT = new Date(endD + 'T00:00:00');
    const dateKeys = [];
    while (cursor <= endDT) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      dateKeys.push(`${y}-${m}-${d}`);
      dates.push(`${cursor.getMonth() + 1}/${cursor.getDate()}`);
      cursor.setDate(cursor.getDate() + 1);
    }

    // 批量查询下单量和完成量
    const orderMap = {};
    const completeMap = {};
    try {
      const [trendOrders] = await db.execute(
        `SELECT DATE(created_at) AS d, COUNT(*) AS cnt FROM orders WHERE DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at)`,
        [startD, endD]
      );
      trendOrders.forEach(r => { orderMap[String(r.d).slice(0, 10)] = Number(r.cnt) || 0; });
    } catch (e) { /* ignore */ }
    try {
      const [trendCompleted] = await db.execute(
        `SELECT DATE(completed_at) AS d, COUNT(*) AS cnt FROM orders WHERE status = 4 AND DATE(completed_at) BETWEEN ? AND ? GROUP BY DATE(completed_at)`,
        [startD, endD]
      );
      trendCompleted.forEach(r => { completeMap[String(r.d).slice(0, 10)] = Number(r.cnt) || 0; });
    } catch (e) { /* ignore */ }

    dateKeys.forEach(dk => {
      ordered.push(orderMap[dk] || 0);
      completed.push(completeMap[dk] || 0);
    });

    res.json({
      success: true,
      data: { ordererStats, receiverStats, taskTypeStats, departmentStats, dealStats, dailyTrend: { dates, ordered, completed } }
    });
  } catch (error) {
    console.error('[statistics] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 通知管理
// =============================================
router.get('/notifications', async (req, res) => {
  try {
    let rows = [];
    try {
      [rows] = await db.execute('SELECT * FROM notifications ORDER BY created_at DESC');
    } catch (e) {
      // 表不存在，创建
      await db.execute(`
        CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(200) NOT NULL COMMENT '通知标题',
          user_id INT NOT NULL DEFAULT 0 COMMENT '创建人ID',
          content VARCHAR(500) NOT NULL DEFAULT '' COMMENT '通知内容',
          target_roles VARCHAR(500) DEFAULT NULL COMMENT '目标角色（逗号分隔，NULL=全部）',
          status TINYINT NOT NULL DEFAULT 0 COMMENT '0=草稿,1=已发送,2=已撤回',
          is_read TINYINT NOT NULL DEFAULT 0 COMMENT '0=未读,1=已读',
          related_order_id INT DEFAULT NULL COMMENT '关联订单ID',
          related_user_id INT DEFAULT NULL COMMENT '关联用户ID',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP NULL DEFAULT NULL COMMENT '已读时间'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      rows = [];
    }
    // 确保 title 字段存在（兼容旧表）
    try {
      const [cols] = await db.execute("SHOW COLUMNS FROM notifications LIKE 'title'");
      if (cols.length === 0) {
        await db.execute("ALTER TABLE notifications ADD COLUMN title VARCHAR(200) NOT NULL DEFAULT '' AFTER id");
      }
    } catch (e2) { /* ignore */ }
    // 移除 type 字段（如果存在）
    try {
      const [cols] = await db.execute("SHOW COLUMNS FROM notifications LIKE 'type'");
      if (cols.length > 0) {
        await db.execute("ALTER TABLE notifications DROP COLUMN type");
      }
    } catch (e3) { /* ignore */ }
    // 确保 target_roles 字段存在（兼容旧表）
    try {
      const [cols] = await db.execute("SHOW COLUMNS FROM notifications LIKE 'target_roles'");
      if (cols.length === 0) {
        await db.execute("ALTER TABLE notifications ADD COLUMN target_roles VARCHAR(500) DEFAULT NULL AFTER content");
      }
    } catch (e4) { /* ignore */ }
    // 确保 status 字段存在（0=草稿, 1=已发送, 2=已撤回）
    try {
      const [cols] = await db.execute("SHOW COLUMNS FROM notifications LIKE 'status'");
      if (cols.length === 0) {
        await db.execute("ALTER TABLE notifications ADD COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '0=草稿,1=已发送,2=已撤回' AFTER target_roles");
      }
    } catch (e5) { /* ignore */ }
    // 移除 fk_notif_user 外键约束（如果存在）
    try {
      const [fk] = await db.execute("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notifications' AND CONSTRAINT_NAME='fk_notif_user'");
      if (fk.length > 0) {
        await db.execute("ALTER TABLE notifications DROP FOREIGN KEY fk_notif_user");
      }
    } catch (e6) { /* ignore */ }
    // 重新查询（确保包含最新字段）
    [rows] = await db.execute('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/notifications', async (req, res) => {
  const { title, content, target_roles, status } = req.body;
  try {
    const user = JSON.parse(req.headers['x-user'] || '{}');
    const [result] = await db.execute(
      `INSERT INTO notifications (title, user_id, content, target_roles, status) VALUES (?, ?, ?, ?, ?)`,
      [title || '', user.id || 0, content || '', target_roles || null, status ?? 0]
    );
    res.json({ success: true, message: status === 1 ? '发送成功' : '已存为草稿', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/notifications/:id', async (req, res) => {
  const { title, content, target_roles, status } = req.body;
  try {
    await db.execute(
      'UPDATE notifications SET title=?, content=?, target_roles=?, status=? WHERE id=?',
      [title, content, target_roles || null, status ?? 0, req.params.id]
    );
    res.json({ success: true, message: status === 1 ? '发送成功' : '修改成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 发送通知（status 0/2 → 1）
router.put('/notifications/:id/send', async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET status = 1, is_read = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '发送成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 撤回通知（status 1 → 2）
router.put('/notifications/:id/recall', async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET status = 2 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '撤回成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 人员排班
// =============================================
async function ensureScheduleTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS person_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        person_id INT NOT NULL,
        schedule_date DATE NOT NULL,
        shift_type VARCHAR(20) NOT NULL COMMENT 'morning/afternoon/night/off',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_person_date (person_id, schedule_date),
        KEY idx_date (schedule_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (e) { /* table exists */ }
}

router.get('/schedules', async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    await ensureScheduleTable();
    const [rows] = await db.execute(
      'SELECT person_id, schedule_date, shift_type FROM person_schedules WHERE schedule_date BETWEEN ? AND ? ORDER BY schedule_date',
      [start_date, end_date]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[schedules get] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/schedules', async (req, res) => {
  const { week_start, week_end, items } = req.body;
  try {
    await ensureScheduleTable();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // 删除该周所有排班数据
      await conn.execute(
        'DELETE FROM person_schedules WHERE schedule_date BETWEEN ? AND ?',
        [week_start, week_end]
      );
      // 批量插入新排班
      if (Array.isArray(items) && items.length > 0) {
        const values = items.map(i => [i.person_id, i.schedule_date, i.shift_type]);
        for (const v of values) {
          await conn.execute(
            'INSERT INTO person_schedules (person_id, schedule_date, shift_type) VALUES (?, ?, ?)',
            v
          );
        }
      }
      await conn.commit();
      res.json({ success: true, message: '排班保存成功' });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[schedules save] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 操作日志（基于 order_status_history）
// =============================================
router.get('/logs', async (req, res) => {
  const { page = 1, pageSize = 20, order_no, to_status, operator_name, start_date, end_date } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const conditions = [];
  const params = [];

  if (order_no) {
    conditions.push('o.order_no LIKE ?');
    params.push(`%${order_no}%`);
  }
  if (to_status !== undefined && to_status !== '') {
    conditions.push('h.to_status = ?');
    params.push(parseInt(to_status));
  }
  if (operator_name) {
    conditions.push('p.real_name LIKE ?');
    params.push(`%${operator_name}%`);
  }
  if (start_date) {
    conditions.push('h.created_at >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('h.created_at <= ?');
    params.push(end_date + ' 23:59:59');
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const [totalRows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM order_status_history h LEFT JOIN orders o ON h.order_id = o.id LEFT JOIN person p ON h.operator_id = p.id ${where}`,
      params
    );
    const total = totalRows[0]?.cnt || 0;

    const [logs] = await db.execute(`
      SELECT h.*, o.order_no, o.task_name, p.real_name AS operator_name
      FROM order_status_history h
      LEFT JOIN orders o ON h.order_id = o.id
      LEFT JOIN person p ON h.operator_id = p.id
      ${where}
      ORDER BY h.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), offset]);

    res.json({ success: true, data: logs, total });
  } catch (error) {
    console.error('[logs] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================
// 初始化角色（保留旧接口）
// =============================================
router.post('/init-roles', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`
      ALTER TABLE \`roles\`
      MODIFY COLUMN \`role_name\` enum(
        '业务下单人','运营下单人','新媒体运营下单人',
        '3D接单人','平面接单人','品牌接单人','摄影接单人',
        '业务总负责人','外贸一部负责人','外贸一部下单人',
        '设计部负责人','负责人','系统管理员'
      ) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称'
    `);
    await connection.query(`
      DELETE FROM \`roles\` WHERE \`role_name\` NOT IN (
        '业务下单人','运营下单人','新媒体运营下单人','3D接单人',
        '平面接单人','品牌接单人','摄影接单人','业务总负责人',
        '外贸一部负责人','外贸一部下单人','设计部负责人','负责人','系统管理员'
      )
    `);
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
    await connection.commit();
    const [rows] = await connection.query('SELECT id, role_code, role_name, description FROM roles ORDER BY id');
    res.json({ success: true, message: 'roles 表初始化成功', data: rows });
  } catch (error) {
    await connection.rollback();
    console.error('[初始化角色] 错误：', error);
    res.status(500).json({ success: false, message: '初始化失败：' + error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
