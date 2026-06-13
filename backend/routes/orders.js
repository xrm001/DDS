const express = require('express');
const db = require('../db');
const { uploadFileToOSS } = require('../utils/oss');
const router = express.Router();

/**
 * 订单自动派发函数
 * 根据task_type_id匹配接单人角色，结合负载均衡派发
 * 规则：
 *   - 平面设计 → 平面接单人
 *   - 全案设计 → 全案接单人
 *   - 3D设计/护肤新品/医药新品/香水新品/banner → 3D接单人
 *   - 摄影任务 → 摄影接单人
 * 负载均衡：派给当前"status=2(进行中)"订单数最少的接单人，相同则随机
 * 
 * @param {Object} connection - 数据库连接（事务内）
 * @param {number} orderId - 订单ID
 * @param {number} taskTypeId - 任务类型ID
 * @returns {number|null} 派发给的接单人ID，无可用接单人时返回null
 */
async function autoDispatchOrder(connection, orderId, taskTypeId, creatorId) {
  // 1. 根据task_type_id查找任务类型名称
  const [typeRows] = await connection.execute(
    'SELECT type_name FROM task_types WHERE id = ?',
    [taskTypeId]
  );
  if (typeRows.length === 0) return null;
  const typeName = typeRows[0].type_name;

  // 判断下单人是否为运营角色
  const [creatorRoleRows] = await connection.execute(
    `SELECT r.role_name FROM person_roles pr
     JOIN roles r ON pr.role_id = r.id
     WHERE pr.person_id = ?`,
    [creatorId]
  );
  const creatorRoles = creatorRoleRows.map(r => r.role_name);
  const isOperationOrderer = creatorRoles.some(r =>
    ['运营下单人', '运营主管下单人', '新媒体运营主管下单人', '新媒体运营下单人', '市场运营部门经理'].includes(r)
  );

  // 2. 任务类型 → 接单人角色映射（支持单角色和多角色）
  // dispatchMode: 'group' = 按组负载均衡, 'person' = 按个人负载均衡
  const DISPATCH_CONFIG = {
    // 业务类（所有下单人共用）
    '平面设计':   { roles: ['平面接单人'], mode: 'group' },
    '3D设计':     { roles: ['3D接单人'], mode: 'group' },
    '摄影':       { roles: ['摄影接单人'], mode: 'group' },
    '护肤新品':   { roles: ['3D接单人'], mode: 'group' },
    '医药新品':   { roles: ['3D接单人'], mode: 'group' },
    '香水新品':   { roles: ['3D接单人'], mode: 'group' },
    'banner':     { roles: ['3D接单人'], mode: 'group' },
    // 运营类
    '海报设计':   { roles: ['接单组长'], mode: 'group' },
    '店铺设计':   { roles: ['店铺设计接单人'], mode: 'group' },
    '包装盒设计': { roles: ['包装盒设计接单人'], mode: 'group' },
    '画册设计':   { roles: ['接单组长'], mode: 'group' },
    '短视频制作': { roles: ['摄影接单人'], mode: 'group' },
    '新品开发':   { roles: ['接单组长'], mode: 'group' },
  };

  // 全案设计：运营角色 → 多角色候选池 + 按个人负载均衡
  if (typeName === '全案设计' && isOperationOrderer) {
    DISPATCH_CONFIG['全案设计'] = { roles: ['接单组长', '全案设计接单人'], mode: 'person' };
  } else {
    DISPATCH_CONFIG['全案设计'] = { roles: ['全案设计接单人'], mode: 'group' };
  }

  const config = DISPATCH_CONFIG[typeName];
  if (!config) {
    console.log(`[订单派发] 未找到任务类型"${typeName}"对应的派发配置`);
    return null;
  }

  // 3. 查找具有对应角色的所有接单人（含组别信息）
  const rolePlaceholders = config.roles.map(() => '?').join(',');
  const [receivers] = await connection.execute(
    `SELECT DISTINCT p.id, p.real_name, pr.group_id
     FROM person p
     JOIN person_roles pr ON p.id = pr.person_id
     JOIN roles r ON pr.role_id = r.id
     WHERE r.role_name IN (${rolePlaceholders}) AND p.status = 1`,
    config.roles
  );

  if (receivers.length === 0) {
    console.log(`[订单派发] 角色"${config.roles.join(',')}"无可用接单人`);
    return null;
  }

  if (config.mode === 'person') {
    // ===== 按个人负载均衡 =====
    const receiverIds = receivers.map(r => r.id);
    const idPlaceholders = receiverIds.map(() => '?').join(',');
    const [loadRows] = await connection.execute(
      `SELECT receiver_id, COUNT(*) as cnt
       FROM orders
       WHERE receiver_id IN (${idPlaceholders}) AND status IN (2, 3)
       GROUP BY receiver_id`,
      receiverIds
    );
    const loadMap = {};
    loadRows.forEach(r => { loadMap[r.receiver_id] = r.cnt; });

    let minLoad = Infinity;
    receivers.forEach(r => {
      const load = loadMap[r.id] || 0;
      if (load < minLoad) minLoad = load;
    });
    const candidates = receivers.filter(r => (loadMap[r.id] || 0) === minLoad);
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    console.log(`[订单派发] 任务类型"${typeName}" → 角色"${config.roles.join('+')}" → 个人模式 → 派给"${selected.real_name}"(ID:${selected.id}), 当前负载:${minLoad}`);
    return selected.id;

  } else {
    // ===== 按组负载均衡 =====
    const groupIds = [...new Set(receivers.map(r => r.group_id))];
    const groupPlaceholders = groupIds.map(() => '?').join(',');
    const [groupLoadRows] = await connection.execute(
      `SELECT pr.group_id, COUNT(o.id) as total_orders
       FROM orders o
       JOIN person p ON o.receiver_id = p.id
       JOIN person_roles pr ON p.id = pr.person_id
       WHERE pr.group_id IN (${groupPlaceholders}) AND o.status IN (2, 3)
       GROUP BY pr.group_id`,
      groupIds
    );

    const groupLoadMap = {};
    groupLoadRows.forEach(r => { groupLoadMap[r.group_id] = r.total_orders; });

    let minGroupLoad = Infinity;
    groupIds.forEach(gid => {
      const load = groupLoadMap[gid] || 0;
      if (load < minGroupLoad) minGroupLoad = load;
    });
    const minLoadGroups = groupIds.filter(gid => (groupLoadMap[gid] || 0) === minGroupLoad);
    const selectedGroup = minLoadGroups[Math.floor(Math.random() * minLoadGroups.length)];
    const groupMembers = receivers.filter(r => r.group_id === selectedGroup);
    const selected = groupMembers[Math.floor(Math.random() * groupMembers.length)];

    console.log(`[订单派发] 任务类型"${typeName}" → 角色"${config.roles.join('+')}" → 组别${selectedGroup}(订单数:${minGroupLoad}) → 派给"${selected.real_name}"(ID:${selected.id})`);
    return selected.id;
  }
}

/**
 * POST /api/orders/submit
 * 提交订单
 * 1. 在orders表中插入记录
 * 2. 在attachments表中插入附件记录
 */
router.post('/submit', async (req, res) => {
  const {
    task_name,
    customer_name,
    customer_region,
    task_type_id,
    deadline,
    requirement_desc,
    creator_id,
    assignee, // 分配人员（运营相关角色可选）
    order_type = 1, // 1=原始订单, 2=修改单
    original_order_id = null, // 修改单时关联原单ID
    is_special_order = 0, // 是否特殊订单：0=否，1=是
    order_level = 0, // 订单级别：0=主订单，1=子订单
    // receiver_id 不从前端传入，由系统自动派发
    attachments // [{ file_name, mime_type, file_type }]
  } = req.body;

  // 参数校验
  // 运营下单人时 customer_name 和 customer_region 可以为 null
  if (!task_name || !task_type_id || !deadline) {
    console.error('[订单提交] 缺少必要参数:', {
      task_name, customer_name, customer_region, task_type_id, deadline
    });
    return res.status(400).json({
      success: false,
      message: '缺少必要参数（task_name/task_type_id/deadline）'
    });
  }

  if (!creator_id) {
    console.error('[订单提交] creator_id 为空');
    return res.status(400).json({
      success: false,
      message: '下单人ID不能为空'
    });
  }

  console.log('[订单提交] 收到请求:', {
    task_name, customer_name, customer_region, task_type_id, deadline, creator_id
  });

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. 查询下单人信息（用于生成订单号）
    console.log('[订单提交] 查询下单人:', creator_id);
    const [users] = await connection.execute(
      'SELECT id, dept_id, real_name FROM person WHERE id = ?',
      [creator_id]
    );

    if (users.length === 0) {
      await connection.rollback();
      console.error('[订单提交] 下单人不存在:', creator_id);
      return res.status(404).json({
        success: false,
        message: '下单人不存在'
      });
    }

    const user = users[0];
    console.log('[订单提交] 下单人信息:', user);

    // 2. 查询部门信息
    console.log('[订单提交] 查询部门:', user.dept_id);
    const [depts] = await connection.execute(
      'SELECT id, name FROM department WHERE id = ?',
      [user.dept_id]
    );

    const dept = depts[0] || { id: user.dept_id, name: '未知部门' };
    console.log('[订单提交] 部门信息:', dept);

    // 3. 生成订单号
    // order_no = dept_id(2位) + person_id(4位) + 年月日(8位) + 顺序数
    const deptIdStr = String(user.dept_id || 0).padStart(2, '0');
    const personIdStr = String(creator_id).padStart(4, '0');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const todayPrefix = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    
    console.log('[订单提交] 生成订单号参数:', { deptIdStr, personIdStr, dateStr });
    
    // 查询今天该用户订单号中的最大序号（使用 MAX 替代 COUNT，避免回滚导致序号问题）
    const orderNoPattern = `${deptIdStr}${personIdStr}${dateStr}%`;
    const [maxRows] = await connection.execute(
      'SELECT MAX(CAST(SUBSTRING(order_no, ?) AS UNSIGNED)) as max_seq FROM orders WHERE order_no LIKE ? AND created_at >= ?',
      [15, orderNoPattern, `${todayPrefix} 00:00:00`] // 前缀长度 = 2+4+8 = 14位，序号从第15位开始
    );
    const sequenceNumber = (maxRows[0]?.max_seq || 0) + 1;
    const orderNo = `${deptIdStr}${personIdStr}${dateStr}${sequenceNumber}`;
    
    console.log('[订单提交] 生成订单号:', orderNo, '序号:', sequenceNumber);
    
    if (!user.dept_id) {
      await connection.rollback();
      console.error('[订单提交] 下单人没有部门ID');
      return res.status(400).json({
        success: false,
        message: '下单人没有分配部门'
      });
    }

    // 4. 插入orders表（带重试机制处理唯一键冲突）
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('[订单提交] 准备插入订单:', {
      orderNo, task_name, customer_name, customer_region, task_type_id, deadline, creator_id
    });

    // 下单人不能指定接单人，系统根据任务类型自动派发
    let orderResult;
    let finalOrderNo = orderNo;
    let currentSeq = sequenceNumber;
    const maxRetries = 5;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        [orderResult] = await connection.execute(
          `INSERT INTO orders (
            order_no, order_type, original_order_id, task_name, customer_name,
            customer_region, task_type_id, deadline, requirement_desc,
            creator_id, assignee, receiver_id, status, is_evaluated_by_creator,
            is_evaluated_by_receiver, reject_reason, cancel_reason,
            is_special_order, order_level, created_at, updated_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            finalOrderNo,
            order_type, // 1=原始订单, 2=修改单
            original_order_id, // 修改单关联原单ID
            task_name,
            customer_name,
            customer_region,
            task_type_id,
            deadline,
            requirement_desc || null,
            creator_id,
            assignee || null, // 分配人员
            null, // receiver_id 为空，等待系统派发
            0, // status 先为待派单，派发后更新为1
            0, // is_evaluated_by_creator
            0, // is_evaluated_by_receiver
            null, // reject_reason
            null, // cancel_reason
            is_special_order || 0, // 特殊订单
            order_level || 0, // 订单级别：0=主订单，1=子订单
            now, // created_at
            null, // updated_at
            null // completed_at
          ]
        );
        break; // 插入成功，退出重试
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' && attempt < maxRetries) {
          console.warn(`[订单提交] 订单号冲突，重试 ${attempt}/${maxRetries}:`, finalOrderNo);
          currentSeq += 1;
          finalOrderNo = `${deptIdStr}${personIdStr}${dateStr}${currentSeq}`;
        } else {
          throw err; // 其他错误或重试次数用尽，抛出异常
        }
      }
    }

    const orderId = orderResult.insertId;
    console.log('[订单提交] 订单插入成功, ID:', orderId, '订单号:', finalOrderNo);

    // ===== 自动派发逻辑 =====
    // 下单人提交后，系统立即根据任务类型匹配接单人角色并派发
    let dispatchFailed = false;
    let dispatchErrorMsg = '';
    try {
      const assignedReceiverId = await autoDispatchOrder(connection, orderId, task_type_id, creator_id);
      if (assignedReceiverId) {
        // 计算排队序号：该接单人 status IN (1,2) 的订单数量（当前订单尚未写入，无需排除）
        const [queueRows] = await connection.execute(
          'SELECT COUNT(*) as cnt FROM orders WHERE receiver_id = ? AND status IN (1, 2)',
          [assignedReceiverId]
        );
        const queueNumber = queueRows[0].cnt;

        await connection.execute(
          'UPDATE orders SET receiver_id = ?, status = 0, queue_number = ? WHERE id = ?',
          [assignedReceiverId, queueNumber, orderId]
        );
        console.log(`[订单派发] 自动派发成功, 接单人ID: ${assignedReceiverId}, 排队序号: ${queueNumber}, status=0(待接单)`);
      }
    } catch (dispatchError) {
      // 派发异常：记录失败原因，订单不进行派发（保持status=0）
      dispatchFailed = true;
      dispatchErrorMsg = dispatchError.message;
      console.error('[订单派发] 自动派发异常:', dispatchError.message);
      console.error('[订单派发] 异常堆栈:', dispatchError.stack);
    }

    // 5. 上传所有附件到OSS，URL逗号拼接后写入一条attachments记录
    if (attachments && attachments.length > 0) {
      console.log(`[订单提交] 开始处理 ${attachments.length} 个附件`);

      const ossUrls = [];
      const fileNames = [];
      let fileType = 1;
      let mimeType = 'application/octet-stream';

      for (const attachment of attachments) {
        const { file_name, mime_type, file_type = 1, file_buffer } = attachment;
        fileType = file_type;
        mimeType = mime_type || mimeType;
        fileNames.push(file_name);

        // 生成oss_key: department.name/person.real_name/file_name
        const ossKey = `${dept.name}/${user.real_name}/${file_name}`;

        if (file_buffer) {
          try {
            const ossUrl = await uploadFileToOSS(file_buffer, ossKey, file_type);
            ossUrls.push(ossUrl);
            console.log(`[订单提交] 附件上传成功: ${file_name} -> ${ossUrl}`);
          } catch (uploadError) {
            console.error(`[订单提交] 附件上传失败: ${file_name}`, uploadError);
          }
        } else {
          console.log(`[订单提交] 附件 ${file_name} 没有提供文件buffer`);
        }
      }

      // 所有URL逗号拼接，写入一条记录
      const combinedUrl = ossUrls.join(',') || null;
      const combinedFileName = fileNames.join(',');
      const combinedOssKey = `${dept.name}/${user.real_name}/${fileNames[0]}`;

      await connection.execute(
        `INSERT INTO attachments (
          order_id, uploader_id, file_name, file_url, oss_key, file_type, mime_type, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          creator_id,
          combinedFileName,
          combinedUrl,
          combinedOssKey,
          fileType,
          mimeType,
          0
        ]
      );

      console.log(`[订单提交] 附件记录已插入，共 ${ossUrls.length} 个URL`);
    }

    await connection.commit();

    // 6. 返回结果（包含派发状态）
    res.json({
      success: true,
      message: dispatchFailed ? '下单异常' : '订单提交成功',
      data: {
        order_id: orderId,
        order_no: finalOrderNo,
        dispatch_failed: dispatchFailed,
        dispatch_error: dispatchErrorMsg,
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('[提交订单] 服务异常：', error);
    console.error('[提交订单] 错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message,
      error: error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/orders/list
 * 获取下单人的订单列表
 * 查询: orders + task_types + person(receiver) + cut_in_line_requests
 */
router.get('/list', async (req, res) => {
  const { creator_id } = req.query;

  if (!creator_id) {
    return res.status(400).json({ success: false, message: 'creator_id不能为空' });
  }

  try {
    // 查询订单列表（包含任务类型名称、接单人名称）
    const [orders] = await db.execute(`
      SELECT 
        o.id,
        o.order_no,
        o.order_type,
        o.original_order_id,
        o.task_name,
        o.customer_name,
        o.customer_region,
        o.task_type_id,
        tt.type_name AS task_type_name,
        o.priority,
        o.deadline,
        o.requirement_desc,
        o.creator_id,
        pc.real_name AS creator_name,
        o.assignee,
        o.receiver_id,
        pr.real_name AS receiver_name,
        o.status,
        o.is_evaluated_by_creator,
        o.is_evaluated_by_receiver,
        o.reject_reason,
        o.cancel_reason,
        o.created_at,
        o.updated_at,
        o.completed_at,
        o.deal_status,
        o.deal_amount,
        o.currency
      FROM orders o
      LEFT JOIN task_types tt ON o.task_type_id = tt.id
      LEFT JOIN person pc ON o.creator_id = pc.id
      LEFT JOIN person pr ON o.receiver_id = pr.id
      WHERE o.creator_id = ?
      ORDER BY o.created_at DESC
    `, [creator_id]);

    // 查询每个订单的未读消息数
    const orderIds = orders.map(o => o.id);
    let unreadMap = {};
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [unreadRows] = await db.execute(
        `SELECT order_id, COUNT(*) as count FROM messages 
         WHERE order_id IN (${placeholders}) AND receiver_id = ? AND is_read = 0
         GROUP BY order_id`,
        [...orderIds, creator_id]
      );
      unreadRows.forEach(r => { unreadMap[r.order_id] = r.count; });
    }

    // 查询插队申请状态（与当前用户订单相关的）
    let cutInLineMap = {};
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [cutRows] = await db.execute(
        `SELECT c.*, 
                p.real_name AS creator_name,
                o1.order_no AS order_no_ref,
                o2.order_no AS target_order_no_ref
         FROM cut_in_line_requests c
         LEFT JOIN person p ON c.creator_id = p.id
         LEFT JOIN orders o1 ON c.order_id = o1.id
         LEFT JOIN orders o2 ON c.target_order_id = o2.id
         WHERE c.target_order_id IN (${placeholders}) OR c.order_id IN (${placeholders})`,
        [...orderIds, ...orderIds]
      );
      cutRows.forEach(r => {
        // 以target_order_id为主键存储
        const targetId = r.target_order_id;
        if (!cutInLineMap[targetId]) {
          cutInLineMap[targetId] = {
            id: r.id,
            creator_id: r.creator_id,
            creator_name: r.creator_name,
            order_id: r.order_id,
            order_no: r.order_no_ref,
            target_order_id: r.target_order_id,
            target_order_no: r.target_order_no_ref,
            receiver_id: r.receiver_id,
            status: r.status,
            reason: r.reason,
            response_reason: r.response_reason,
            refuse_content: r.response_reason,
            created_at: r.created_at,
            responded_at: r.responded_at,
          };
        }
      });
    }

    // 查询审核记录（最新一条）
    let reviewMap = {};
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [reviewRows] = await db.execute(
        `SELECT * FROM order_reviews 
         WHERE order_id IN (${placeholders})
         ORDER BY review_round DESC`,
        orderIds
      );
      // 按order_id分组
      reviewRows.forEach(r => {
        if (!reviewMap[r.order_id]) {
          reviewMap[r.order_id] = [];
        }
        reviewMap[r.order_id].push(r);
      });
    }

    // 查询评价信息（下单人评接单人的评价）
    let evalMap = {};
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [evalRows] = await db.execute(
        `SELECT * FROM evaluations 
         WHERE order_id IN (${placeholders}) AND eval_type = 1`,
        orderIds
      );
      evalRows.forEach(r => { evalMap[r.order_id] = r; });
    }

    // 查询附件信息
    let attachmentMap = {};
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [attachRows] = await db.execute(
        `SELECT order_id, file_url, file_name FROM attachments 
         WHERE order_id IN (${placeholders}) AND is_deleted = 0`,
        orderIds
      );
      attachRows.forEach(r => {
        if (!attachmentMap[r.order_id]) {
          attachmentMap[r.order_id] = [];
        }
        attachmentMap[r.order_id].push({ file_url: r.file_url, file_name: r.file_name });
      });
    }

    // 组装返回数据
    const result = orders.map(order => {
      const reviews = reviewMap[order.id] || [];
      // 转换为acceptance_history格式（前端兼容）
      const acceptance_history = reviews.map(r => ({
        id: r.id,
        round: r.review_round,
        submitted_at: r.submitted_at,
        review_result: r.review_status,
        review_remark: r.review_remark,
        reviewed_at: r.reviewed_at,
      }));

      return {
        ...order,
        unread_messages: unreadMap[order.id] || 0,
        cut_in_line_request: cutInLineMap[order.id] || null,
        acceptance_history,
        attachments: attachmentMap[order.id] || [],
        evaluation: evalMap[order.id] ? {
          overall_score: evalMap[order.id].overall_score,
          comment: evalMap[order.id].comment,
          score_completion: evalMap[order.id].score_completion,
          score_communication: evalMap[order.id].score_communication_creator,
          score_understanding: evalMap[order.id].score_understanding,
          score_technical: evalMap[order.id].score_technical,
          score_design: evalMap[order.id].score_design,
        } : null,
      };
    });

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('[订单列表] 查询异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message });
  }
});

/**
 * GET /api/orders/receiver-list
 * 获取接单人的订单列表
 * 查询: orders + task_types + person(creator) + person(receiver)
 */
router.get('/receiver-list', async (req, res) => {
  const { receiver_id } = req.query;

  if (!receiver_id) {
    return res.status(400).json({ success: false, message: 'receiver_id不能为空' });
  }

  try {
    // 查询分配给该接单人的所有订单
    const [orders] = await db.execute(`
      SELECT 
        o.id,
        o.order_no,
        o.order_type,
        o.original_order_id,
        o.task_name,
        o.customer_name,
        o.customer_region,
        o.task_type_id,
        tt.type_name AS task_type_name,
        o.priority,
        o.deadline,
        o.requirement_desc,
        o.creator_id,
        pc.real_name AS creator_name,
        o.assignee,
        o.receiver_id,
        pr.real_name AS receiver_name,
        o.status,
        o.is_evaluated_by_creator,
        o.is_evaluated_by_receiver,
        o.reject_reason,
        o.cancel_reason,
        o.created_at,
        o.updated_at,
        o.completed_at,
        o.deal_status,
        o.deal_amount,
        o.currency
      FROM orders o
      LEFT JOIN task_types tt ON o.task_type_id = tt.id
      LEFT JOIN person pc ON o.creator_id = pc.id
      LEFT JOIN person pr ON o.receiver_id = pr.id
      WHERE o.receiver_id = ?
      ORDER BY o.created_at DESC
    `, [receiver_id]);

    // 查询每个订单的未读消息数（发给当前接单人的）
    const orderIds = orders.map(o => o.id);
    let unreadMap = {};
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [unreadRows] = await db.execute(
        `SELECT order_id, COUNT(*) as count FROM messages 
         WHERE order_id IN (${placeholders}) AND receiver_id = ? AND is_read = 0
         GROUP BY order_id`,
        [...orderIds, receiver_id]
      );
      unreadRows.forEach(r => { unreadMap[r.order_id] = r.count; });
    }

    // 查询评价信息
    let evalMap = {};
    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const [evalRows] = await db.execute(
        `SELECT * FROM evaluations WHERE order_id IN (${placeholders})`,
        orderIds
      );
      evalRows.forEach(e => {
        evalMap[e.order_id] = e;
      });
    }

    // 组装返回数据
    const result = orders.map(order => {
      return {
        ...order,
        unread_messages: unreadMap[order.id] || 0,
        acceptance_history: [],
        evaluation: evalMap[order.id] ? {
          overall_score: evalMap[order.id].overall_score,
          comment: evalMap[order.id].comment,
        } : null,
      };
    });

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('[接单人订单列表] 查询异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message });
  }
});

/**
 * GET /api/orders/:id/messages
 * 获取订单沟通消息
 */
router.get('/:id/messages', async (req, res) => {
  const { id } = req.params;

  try {
    const [messages] = await db.execute(`
      SELECT 
        m.id,
        m.order_id,
        m.sender_id,
        ps.real_name AS sender_name,
        m.receiver_id,
        pr.real_name AS receiver_name,
        m.content,
        m.attachment_id,
        a.file_url AS attachment_url,
        a.file_name AS attachment_name,
        m.is_read,
        m.created_at
      FROM messages m
      LEFT JOIN person ps ON m.sender_id = ps.id
      LEFT JOIN person pr ON m.receiver_id = pr.id
      LEFT JOIN attachments a ON m.attachment_id = a.id
      WHERE m.order_id = ?
      ORDER BY m.created_at ASC
    `, [id]);

    res.json({ success: true, data: messages });

  } catch (error) {
    console.error('[消息查询] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/orders/:id/messages
 * 发送沟通消息
 */
router.post('/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { sender_id, receiver_id, content, attachment_id } = req.body;

  if (!sender_id || !content) {
    return res.status(400).json({ success: false, message: '发送人和内容不能为空' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO messages (order_id, sender_id, receiver_id, content, attachment_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [id, sender_id, receiver_id || null, content, attachment_id || null]
    );

    res.json({ success: true, data: { id: result.insertId } });

  } catch (error) {
    console.error('[发送消息] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/orders/:id/messages/read
 * 标记订单消息为已读
 */
router.put('/:id/messages/read', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    await db.execute(
      'UPDATE messages SET is_read = 1 WHERE order_id = ? AND receiver_id = ? AND is_read = 0',
      [id, user_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('[标记已读] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/orders/:id/evaluations
 * 获取订单评价
 */
router.get('/:id/evaluations', async (req, res) => {
  const { id } = req.params;

  try {
    const [evaluations] = await db.execute(`
      SELECT 
        e.*,
        p1.real_name AS evaluator_name,
        p2.real_name AS evaluatee_name
      FROM evaluations e
      LEFT JOIN person p1 ON e.evaluator_id = p1.id
      LEFT JOIN person p2 ON e.evaluatee_id = p2.id
      WHERE e.order_id = ?
      ORDER BY e.created_at DESC
    `, [id]);

    res.json({ success: true, data: evaluations });

  } catch (error) {
    console.error('[评价查询] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * POST /api/orders/:id/evaluate
 * 提交评价
 */
router.post('/:id/evaluate', async (req, res) => {
  const { id } = req.params;
  const {
    evaluator_id,
    evaluatee_id,
    eval_type,
    score_completion,
    score_communication_creator,
    score_understanding,
    score_technical,
    score_design,
    score_requirement,
    score_attachment,
    score_communication_receiver,
    score_timeliness,
    overall_score,
    comment
  } = req.body;

  if (!evaluator_id || !evaluatee_id || !eval_type || !overall_score) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  try {
    // 计算是否可见（订单完成后可见）
    const [orderRows] = await db.execute('SELECT status FROM orders WHERE id = ?', [id]);
    const isVisible = orderRows[0]?.status === 4 ? 1 : 0;

    const [result] = await db.execute(
      `INSERT INTO evaluations (
        order_id, evaluator_id, evaluatee_id, eval_type,
        score_completion, score_communication_creator, score_understanding,
        score_technical, score_design,
        score_requirement, score_attachment, score_communication_receiver, score_timeliness,
        overall_score, comment, is_visible_to_evaluatee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, evaluator_id, evaluatee_id, eval_type,
        score_completion || null, score_communication_creator || null, score_understanding || null,
        score_technical || null, score_design || null,
        score_requirement || null, score_attachment || null, score_communication_receiver || null, score_timeliness || null,
        overall_score, comment || null, isVisible
      ]
    );

    // 更新orders表的评价状态
    if (eval_type === 1) {
      await db.execute('UPDATE orders SET is_evaluated_by_creator = 1 WHERE id = ?', [id]);
    } else {
      await db.execute('UPDATE orders SET is_evaluated_by_receiver = 1 WHERE id = ?', [id]);
    }

    res.json({ success: true, data: { id: result.insertId } });

  } catch (error) {
    console.error('[提交评价] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/orders/:id/deal-status
 * 更新成交状态
 */
router.put('/:id/deal-status', async (req, res) => {
  const { id } = req.params;
  const { deal_status, deal_amount, currency } = req.body;

  if (!deal_status) {
    return res.status(400).json({ success: false, message: '成交状态不能为空' });
  }

  // deal_status=9(已成交)时必须有金额
  if (deal_status === 9 && (!deal_amount || deal_amount <= 0)) {
    return res.status(400).json({ success: false, message: '已成交状态必须填写成交金额' });
  }

  try {
    await db.execute(
      'UPDATE orders SET deal_status = ?, deal_amount = ?, currency = ? WHERE id = ?',
      [deal_status, deal_amount || null, currency || 'CNY', id]
    );

    res.json({ success: true, message: '成交状态更新成功' });

  } catch (error) {
    console.error('[成交状态] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/orders/:id/accept
 * 接单人接单
 */
router.put('/:id/accept', async (req, res) => {
  const { id } = req.params;

  try {
    const [orderRows] = await db.execute('SELECT status, queue_number FROM orders WHERE id = ?', [id]);
    if (!orderRows[0]) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const { status: currentStatus, queue_number: queueNumber } = orderRows[0];
    if (currentStatus !== 0) {
      return res.status(400).json({ success: false, message: '订单状态不允许接单' });
    }

    // 接单时判断排队序号：queue_number > 0 则 status=2（排队中），否则 status=1（已接单）
    const newStatus = queueNumber > 0 ? 2 : 1;

    await db.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({ success: true, message: '接单成功', new_status: newStatus });

  } catch (error) {
    console.error('[接单] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/orders/:id/submit-acceptance
 * 接单人提交验收
 */
router.put('/:id/submit-acceptance', async (req, res) => {
  const { id } = req.params;

  try {
    const [orderRows] = await db.execute('SELECT status FROM orders WHERE id = ?', [id]);
    if (!orderRows[0]) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const currentStatus = orderRows[0].status;
    // 只有 status=1 或 status=2 的订单可以提交验收
    if (currentStatus !== 1 && currentStatus !== 2) {
      return res.status(400).json({ success: false, message: '订单状态不允许提交验收' });
    }

    await db.execute(
      'UPDATE orders SET status = 3 WHERE id = ?',
      [id]
    );

    // 创建待审核记录
    await db.execute(
      'INSERT INTO order_reviews (order_id, review_status, created_at) VALUES (?, ?, ?)',
      [id, 'pending', new Date().toISOString().slice(0, 19).replace('T', ' ')]
    );

    res.json({ success: true, message: '已提交验收' });

  } catch (error) {
    console.error('[提交验收] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/orders/:id/recall
 * 撤回订单
 */
router.put('/:id/recall', async (req, res) => {
  const { id } = req.params;
  const { cancel_reason } = req.body;

  try {
    const [orderRows] = await db.execute('SELECT status FROM orders WHERE id = ?', [id]);
    if (!orderRows[0]) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const currentStatus = orderRows[0].status;
    // 只有 status=0~3 的订单可以撤回
    if (currentStatus >= 4) {
      return res.status(400).json({ success: false, message: '订单已完成/已撤回，无法再次撤回' });
    }

    await db.execute(
      'UPDATE orders SET status = 5, cancel_reason = ? WHERE id = ?',
      [cancel_reason || '用户撤回', id]
    );

    res.json({ success: true, message: '订单已撤回' });

  } catch (error) {
    console.error('[撤回订单] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/orders/:id
 * 修改订单信息（含附件上传）
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { task_name, customer_name, customer_region, task_type_id, requirement_desc, attachments } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 检查订单状态
    const [orderRows] = await connection.execute(
      'SELECT o.status, o.creator_id, p.real_name, p.dept_id FROM orders o JOIN person p ON o.creator_id = p.id WHERE o.id = ?',
      [id]
    );
    if (!orderRows[0]) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    if (orderRows[0].status >= 4) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: '订单已完成/已拒绝/已取消，无法修改' });
    }

    const { creator_id, real_name, dept_id } = orderRows[0];

    // 2. 更新 orders 表字段
    await connection.execute(
      `UPDATE orders SET 
        task_name = COALESCE(?, task_name),
        customer_name = COALESCE(?, customer_name),
        customer_region = COALESCE(?, customer_region),
        task_type_id = COALESCE(?, task_type_id),
        requirement_desc = COALESCE(?, requirement_desc)
       WHERE id = ?`,
      [task_name || null, customer_name || null, customer_region || null, task_type_id || null, requirement_desc || null, id]
    );

    console.log(`[修改订单] 订单 ${id} 基本信息已更新`);

    // 3. 处理附件上传（如果有），多个URL逗号拼接写入一条记录
    if (attachments && attachments.length > 0) {
      // 查询部门名称用于生成 OSS Key
      const [depts] = await connection.execute('SELECT name FROM department WHERE id = ?', [dept_id]);
      const deptName = depts[0]?.name || '未知部门';

      console.log(`[修改订单] 开始处理 ${attachments.length} 个附件`);

      const ossUrls = [];
      const fileNames = [];
      let fileType = 1;
      let mimeType = 'application/octet-stream';

      for (const attachment of attachments) {
        const { file_name, mime_type, file_type = 1, file_buffer } = attachment;
        fileType = file_type;
        mimeType = mime_type || mimeType;
        fileNames.push(file_name);

        // 生成 oss_key: 部门名/姓名/文件名
        const ossKey = `${deptName}/${real_name}/${file_name}`;

        if (file_buffer) {
          try {
            const ossUrl = await uploadFileToOSS(file_buffer, ossKey, file_type);
            ossUrls.push(ossUrl);
            console.log(`[修改订单] 附件上传成功: ${file_name} -> ${ossUrl}`);
          } catch (uploadError) {
            console.error(`[修改订单] 附件上传失败: ${file_name}`, uploadError.message);
          }
        }
      }

      // 所有URL逗号拼接，写入一条记录
      const combinedUrl = ossUrls.join(',') || null;
      const combinedFileName = fileNames.join(',');
      const combinedOssKey = `${deptName}/${real_name}/${fileNames[0]}`;

      await connection.execute(
        `INSERT INTO attachments (
          order_id, uploader_id, file_name, file_url, oss_key, file_type, mime_type, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, creator_id, combinedFileName, combinedUrl, combinedOssKey, fileType, mimeType]
      );

      console.log(`[修改订单] 附件记录已插入，共 ${ossUrls.length} 个URL`);
    }

    await connection.commit();
    res.json({ success: true, message: '订单修改成功' });

  } catch (error) {
    await connection.rollback();
    console.error('[修改订单] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误: ' + error.message });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/orders/:id/review
 * 下单人审核（通过/驳回）
 */
router.post('/:id/review', async (req, res) => {
  const { id } = req.params;
  const { review_result, review_remark } = req.body;

  if (!review_result || !['approved', 'rejected'].includes(review_result)) {
    return res.status(400).json({ success: false, message: '审核结果无效' });
  }

  try {
    // 更新最新的pending审核记录
    const [pendingRows] = await db.execute(
      'SELECT id FROM order_reviews WHERE order_id = ? AND review_status = ? ORDER BY review_round DESC LIMIT 1',
      [id, 'pending']
    );

    if (pendingRows.length === 0) {
      return res.status(400).json({ success: false, message: '没有待审核的记录' });
    }

    const reviewId = pendingRows[0].id;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 更新审核记录
    await db.execute(
      'UPDATE order_reviews SET review_status = ?, review_remark = ?, reviewed_at = ? WHERE id = ?',
      [review_result, review_remark || null, now, reviewId]
    );

    // 更新订单状态
    if (review_result === 'approved') {
      await db.execute(
        'UPDATE orders SET status = 4, completed_at = ? WHERE id = ?',
        [now, id]
      );
      // 订单完成后，评价变为可见（is_visible_to_evaluatee=1）
      await db.execute(
        'UPDATE evaluations SET is_visible_to_evaluatee = 1 WHERE order_id = ?',
        [id]
      );
    } else {
      // 驳回: 订单回退为进行中
      await db.execute(
        'UPDATE orders SET status = 2 WHERE id = ?',
        [id]
      );
    }

    res.json({ success: true, message: review_result === 'approved' ? '审核通过，订单已完结' : '已驳回，订单回退为进行中' });

  } catch (error) {
    console.error('[订单审核] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/orders/group-members?leader_id=X
 * 获取组长所在组的组员及其当前订单数（status=1和status=2）
 */
router.get('/group-members', async (req, res) => {
  const { leader_id } = req.query;

  if (!leader_id) {
    return res.status(400).json({ success: false, message: 'leader_id不能为空' });
  }

  try {
    // 获取组长所在的组
    const [leaderRows] = await db.execute(
      `SELECT pr.group_id, r.role_name
       FROM person_roles pr
       JOIN roles r ON pr.role_id = r.id
       WHERE pr.person_id = ? AND r.role_name = '接单组长'`,
      [leader_id]
    );

    if (leaderRows.length === 0) {
      return res.status(400).json({ success: false, message: '该用户不是接单组长' });
    }

    const groupId = leaderRows[0].group_id;

    // 获取同组所有接单人（包括组长）
    const [members] = await db.execute(
      `SELECT DISTINCT p.id, p.real_name, r.role_name
       FROM person p
       JOIN person_roles pr ON p.id = pr.person_id
       JOIN roles r ON pr.role_id = r.id
       WHERE pr.group_id = ? AND p.status = 1`,
      [groupId]
    );

    // 统计每个人的订单数（status=1和status=2）
    const memberIds = members.map(m => m.id);
    let orderCountMap = {};
    if (memberIds.length > 0) {
      const placeholders = memberIds.map(() => '?').join(',');
      const [countRows] = await db.execute(
        `SELECT receiver_id, COUNT(*) as cnt
         FROM orders
         WHERE receiver_id IN (${placeholders}) AND status IN (1, 2)
         GROUP BY receiver_id`,
        memberIds
      );
      countRows.forEach(r => { orderCountMap[r.receiver_id] = r.cnt; });
    }

    const result = members.map(m => ({
      id: m.id,
      real_name: m.real_name,
      role_name: m.role_name,
      current_orders: orderCountMap[m.id] || 0
    }));

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('[获取组员] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * PUT /api/orders/:id/assign
 * 组长分配订单给指定接单人
 */
router.put('/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { receiver_id, leader_id } = req.body;

  if (!receiver_id || !leader_id) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }

  try {
    // 验证组长身份
    const [leaderRows] = await db.execute(
      `SELECT pr.group_id FROM person_roles pr
       JOIN roles r ON pr.role_id = r.id
       WHERE pr.person_id = ? AND r.role_name = '接单组长'`,
      [leader_id]
    );

    if (leaderRows.length === 0) {
      return res.status(403).json({ success: false, message: '无权限执行分配' });
    }

    const groupId = leaderRows[0].group_id;

    // 验证目标接单人在同组
    const [receiverRows] = await db.execute(
      `SELECT pr.group_id FROM person_roles pr
       WHERE pr.person_id = ?`,
      [receiver_id]
    );

    if (receiverRows.length === 0 || receiverRows[0].group_id !== groupId) {
      return res.status(400).json({ success: false, message: '目标接单人与组长不在同一组' });
    }

    // 更新订单的接单人
    await db.execute(
      'UPDATE orders SET receiver_id = ?, status = 1 WHERE id = ? AND status = 0',
      [receiver_id, id]
    );

    res.json({ success: true, message: '分配成功' });

  } catch (error) {
    console.error('[订单分配] 异常:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;