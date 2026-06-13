const express = require('express');
const db = require('../db');
const router = express.Router();

// 确保 user_reads 表存在
async function ensureUserReadsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_reads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL COMMENT '用户ID',
      source_type VARCHAR(20) NOT NULL COMMENT 'notification/message/order',
      source_id INT NOT NULL COMMENT '来源ID',
      is_read TINYINT NOT NULL DEFAULT 0 COMMENT '0=未读,1=已读',
      read_at TIMESTAMP NULL COMMENT '已读时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_source (user_id, source_type, source_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

// 辅助：UPSERT 单条 user_reads 记录
async function upsertRead(connection, user_id, source_type, source_id) {
  await connection.execute(
    `INSERT INTO user_reads (user_id, source_type, source_id, is_read, read_at)
     VALUES (?, ?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()`,
    [user_id, source_type, source_id]
  );
}

/**
 * GET /api/notify/unread-count
 * 获取当前用户的未读总数（notifications + messages + orders）
 */
router.get('/unread-count', async (req, res) => {
  try {
    const user_id = parseInt(req.headers['x-user-id']);
    if (!user_id) return res.json({ success: true, data: { total: 0, notifications: 0, messages: 0, orders: 0 } });

    await ensureUserReadsTable();

    // 获取用户角色名称列表
    const [roles] = await db.execute(
      `SELECT r.role_name FROM person_roles pr JOIN roles r ON pr.role_id = r.id WHERE pr.person_id = ?`,
      [user_id]
    );
    const roleNames = roles.map(r => r.role_name);

    // 1. 未读系统通知（匹配角色 + status=1已发送）
    let nCount = 0;
    if (roleNames.length > 0) {
      const roleConds = roleNames.map(r => `FIND_IN_SET(?, n.target_roles)`).join(' OR ');
      const [nRows] = await db.execute(
        `SELECT COUNT(*) as cnt FROM notifications n
         WHERE n.status = 1
           AND (${roleConds} OR n.target_roles IS NULL)
           AND NOT EXISTS (
             SELECT 1 FROM user_reads ur
             WHERE ur.user_id = ? AND ur.source_type = 'notification' AND ur.source_id = n.id AND ur.is_read = 1
           )`,
        [...roleNames, user_id]
      );
      nCount = nRows[0].cnt;
    } else {
      // 无角色，只查 target_roles IS NULL 的通知
      const [nRows] = await db.execute(
        `SELECT COUNT(*) as cnt FROM notifications n
         WHERE n.status = 1 AND n.target_roles IS NULL
           AND NOT EXISTS (
             SELECT 1 FROM user_reads ur
             WHERE ur.user_id = ? AND ur.source_type = 'notification' AND ur.source_id = n.id AND ur.is_read = 1
           )`,
        [user_id]
      );
      nCount = nRows[0].cnt;
    }

    // 2. 未读聊天消息
    const [mRows] = await db.execute(
      `SELECT COUNT(*) as cnt FROM messages m
       WHERE m.receiver_id = ? AND m.is_read = 0
         AND NOT EXISTS (
           SELECT 1 FROM user_reads ur
           WHERE ur.user_id = ? AND ur.source_type = 'message' AND ur.source_id = m.id AND ur.is_read = 1
         )`,
      [user_id, user_id]
    );
    const mCount = mRows[0].cnt;

    // 3. 未读订单状态变更
    const [oRows] = await db.execute(
      `SELECT COUNT(*) as cnt FROM orders o
       WHERE (o.creator_id = ? OR o.receiver_id = ?)
         AND o.is_read = 0
         AND NOT EXISTS (
           SELECT 1 FROM user_reads ur
           WHERE ur.user_id = ? AND ur.source_type = 'order' AND ur.source_id = o.id AND ur.is_read = 1
         )`,
      [user_id, user_id, user_id]
    );
    const oCount = oRows[0].cnt;

    res.json({
      success: true,
      data: {
        notifications: nCount,
        messages: mCount,
        orders: oCount,
        total: nCount + mCount + oCount
      }
    });
  } catch (error) {
    console.error('[通知中心] 未读计数查询失败:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/notify/list
 * 获取当前用户的通知列表（未读+最近已读，最多50条）
 */
router.get('/list', async (req, res) => {
  try {
    const user_id = parseInt(req.headers['x-user-id']);
    if (!user_id) return res.json({ success: true, data: [] });

    await ensureUserReadsTable();

    // 获取用户角色
    const [roles] = await db.execute(
      `SELECT r.role_name FROM person_roles pr JOIN roles r ON pr.role_id = r.id WHERE pr.person_id = ?`,
      [user_id]
    );
    const roleNames = roles.map(r => r.role_name);

    const items = [];

    // 1. 系统通知
    let notifQuery, notifParams;
    if (roleNames.length > 0) {
      const roleConds = roleNames.map(() => `FIND_IN_SET(?, n.target_roles)`).join(' OR ');
      notifQuery = `
        SELECT n.id, n.title, n.content, n.created_at, n.user_id,
               p.real_name as sender_name,
               IFNULL(ur.is_read, 0) as is_read
        FROM notifications n
        LEFT JOIN person p ON n.user_id = p.id
        LEFT JOIN user_reads ur ON ur.user_id = ? AND ur.source_type = 'notification' AND ur.source_id = n.id
        WHERE n.status = 1
          AND (${roleConds} OR n.target_roles IS NULL)
        ORDER BY n.created_at DESC LIMIT 20
      `;
      notifParams = [user_id, ...roleNames];
    } else {
      notifQuery = `
        SELECT n.id, n.title, n.content, n.created_at, n.user_id,
               p.real_name as sender_name,
               IFNULL(ur.is_read, 0) as is_read
        FROM notifications n
        LEFT JOIN person p ON n.user_id = p.id
        LEFT JOIN user_reads ur ON ur.user_id = ? AND ur.source_type = 'notification' AND ur.source_id = n.id
        WHERE n.status = 1 AND n.target_roles IS NULL
        ORDER BY n.created_at DESC LIMIT 20
      `;
      notifParams = [user_id];
    }
    const [notifs] = await db.execute(notifQuery, notifParams);
    notifs.forEach(n => {
      items.push({
        id: `notification_${n.id}`,
        source_type: 'notification',
        source_id: n.id,
        title: n.title,
        sender_name: n.sender_name || '系统管理员',
        content: n.content,
        created_at: n.created_at,
        is_read: n.is_read,
      });
    });

    // 2. 未读聊天消息
    const [msgs] = await db.execute(
      `SELECT m.id, m.order_id, m.created_at, m.sender_id,
              p.real_name as sender_name,
              o.order_no, o.task_name
       FROM messages m
       LEFT JOIN person p ON m.sender_id = p.id
       LEFT JOIN orders o ON m.order_id = o.id
       WHERE m.receiver_id = ? AND m.is_read = 0
         AND NOT EXISTS (
           SELECT 1 FROM user_reads ur
           WHERE ur.user_id = ? AND ur.source_type = 'message' AND ur.source_id = m.id AND ur.is_read = 1
         )
       ORDER BY m.created_at DESC LIMIT 20`,
      [user_id, user_id]
    );
    msgs.forEach(m => {
      items.push({
        id: `message_${m.id}`,
        source_type: 'message',
        source_id: m.id,
        title: '你有一条新聊天信息',
        sender_name: m.sender_name || '未知',
        order_id: m.order_id,
        order_no: m.order_no,
        task_name: m.task_name,
        created_at: m.created_at,
        is_read: 0,
      });
    });

    // 3. 未读订单状态变更
    const STATUS_MAP = { 0: '待接单', 1: '负责人审核中', 2: '进行中', 3: '待验收', 4: '已完成', 5: '已撤回' };
    const [ords] = await db.execute(
      `SELECT o.id, o.order_no, o.task_name, o.status, o.updated_at,
              p.real_name as receiver_name
       FROM orders o
       LEFT JOIN person p ON o.receiver_id = p.id
       WHERE (o.creator_id = ? OR o.receiver_id = ?)
         AND o.is_read = 0
         AND NOT EXISTS (
           SELECT 1 FROM user_reads ur
           WHERE ur.user_id = ? AND ur.source_type = 'order' AND ur.source_id = o.id AND ur.is_read = 1
         )
       ORDER BY o.updated_at DESC LIMIT 20`,
      [user_id, user_id, user_id]
    );
    ords.forEach(o => {
      items.push({
        id: `order_${o.id}`,
        source_type: 'order',
        source_id: o.id,
        title: `订单 ${o.order_no || o.task_name || '#' + o.id}`,
        status_text: STATUS_MAP[o.status] || '未知',
        receiver_name: o.receiver_name,
        order_id: o.id,
        created_at: o.updated_at,
        is_read: 0,
      });
    });

    // 合并后按时间降序排列，最多50条
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ success: true, data: items.slice(0, 50) });
  } catch (error) {
    console.error('[通知中心] 列表查询失败:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/notify/read
 * 标记单条为已读
 * body: { source_type, source_id }
 */
router.put('/read', async (req, res) => {
  try {
    const user_id = parseInt(req.headers['x-user-id']);
    if (!user_id) return res.status(401).json({ success: false, message: '未登录' });

    const { source_type, source_id } = req.body;
    if (!source_type || !source_id) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    await ensureUserReadsTable();
    await upsertRead(db, user_id, source_type, source_id);

    // 如果是消息类型，同时更新 messages.is_read
    if (source_type === 'message') {
      await db.execute(
        'UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?',
        [source_id, user_id]
      );
    }
    // 如果是订单类型，同时更新 orders.is_read
    if (source_type === 'order') {
      await db.execute(
        'UPDATE orders SET is_read = 1 WHERE id = ? AND (creator_id = ? OR receiver_id = ?)',
        [source_id, user_id, user_id]
      );
    }

    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('[通知中心] 标记已读失败:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/notify/read-all
 * 标记所有未读为已读
 */
router.put('/read-all', async (req, res) => {
  try {
    const user_id = parseInt(req.headers['x-user-id']);
    if (!user_id) return res.status(401).json({ success: false, message: '未登录' });

    await ensureUserReadsTable();

    // 获取用户角色
    const [roles] = await db.execute(
      `SELECT r.role_name FROM person_roles pr JOIN roles r ON pr.role_id = r.id WHERE pr.person_id = ?`,
      [user_id]
    );
    const roleNames = roles.map(r => r.role_name);

    // 1. 标记未读通知
    let notifQuery, notifParams;
    if (roleNames.length > 0) {
      const roleConds = roleNames.map(() => `FIND_IN_SET(?, n.target_roles)`).join(' OR ');
      notifQuery = `
        SELECT n.id FROM notifications n
        WHERE n.status = 1
          AND (${roleConds} OR n.target_roles IS NULL)
          AND NOT EXISTS (
            SELECT 1 FROM user_reads ur
            WHERE ur.user_id = ? AND ur.source_type = 'notification' AND ur.source_id = n.id AND ur.is_read = 1
          )
      `;
      notifParams = [...roleNames, user_id];
    } else {
      notifQuery = `
        SELECT n.id FROM notifications n
        WHERE n.status = 1 AND n.target_roles IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM user_reads ur
            WHERE ur.user_id = ? AND ur.source_type = 'notification' AND ur.source_id = n.id AND ur.is_read = 1
          )
      `;
      notifParams = [user_id];
    }
    const [unreadNotifs] = await db.execute(notifQuery, notifParams);
    for (const n of unreadNotifs) {
      await upsertRead(db, user_id, 'notification', n.id);
    }

    // 2. 标记未读消息
    const [unreadMsgs] = await db.execute(
      `SELECT m.id FROM messages m
       WHERE m.receiver_id = ? AND m.is_read = 0
         AND NOT EXISTS (
           SELECT 1 FROM user_reads ur
           WHERE ur.user_id = ? AND ur.source_type = 'message' AND ur.source_id = m.id AND ur.is_read = 1
         )`,
      [user_id, user_id]
    );
    for (const m of unreadMsgs) {
      await upsertRead(db, user_id, 'message', m.id);
    }
    // 同时更新 messages.is_read
    await db.execute(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND is_read = 0',
      [user_id]
    );

    // 3. 标记未读订单
    const [unreadOrds] = await db.execute(
      `SELECT o.id FROM orders o
       WHERE (o.creator_id = ? OR o.receiver_id = ?) AND o.is_read = 0
         AND NOT EXISTS (
           SELECT 1 FROM user_reads ur
           WHERE ur.user_id = ? AND ur.source_type = 'order' AND ur.source_id = o.id AND ur.is_read = 1
         )`,
      [user_id, user_id, user_id]
    );
    for (const o of unreadOrds) {
      await upsertRead(db, user_id, 'order', o.id);
    }
    // 同时更新 orders.is_read
    await db.execute(
      'UPDATE orders SET is_read = 1 WHERE (creator_id = ? OR receiver_id = ?) AND is_read = 0',
      [user_id, user_id]
    );

    res.json({ success: true, message: '全部已标记为已读' });
  } catch (error) {
    console.error('[通知中心] 全部已读失败:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
