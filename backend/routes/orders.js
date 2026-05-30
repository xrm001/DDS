const express = require('express');
const db = require('../db');
const { uploadFileToOSS } = require('../utils/oss');
const router = express.Router();

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
    receiver_id,
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
    
    console.log('[订单提交] 生成订单号参数:', { deptIdStr, personIdStr, dateStr });
    
    // 查询今天该用户的订单数量
    const [todayOrders] = await connection.execute(
      'SELECT COUNT(*) as count FROM orders WHERE creator_id = ? AND created_at >= ?',
      [creator_id, `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)} 00:00:00`]
    );

    const sequenceNumber = todayOrders[0].count + 1;
    const orderNo = `${deptIdStr}${personIdStr}${dateStr}${sequenceNumber}`;
    
    console.log('[订单提交] 生成订单号:', orderNo);
    
    if (!user.dept_id) {
      await connection.rollback();
      console.error('[订单提交] 下单人没有部门ID');
      return res.status(400).json({
        success: false,
        message: '下单人没有分配部门'
      });
    }

    // 4. 插入orders表
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('[订单提交] 准备插入订单:', {
      orderNo, task_name, customer_name, customer_region, task_type_id, deadline, creator_id
    });
    
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        order_no, order_type, original_order_id, task_name, customer_name,
        customer_region, task_type_id, deadline, requirement_desc,
        creator_id, receiver_id, status, is_evaluated_by_creator,
        is_evaluated_by_receiver, reject_reason, cancel_reason,
        created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        1, // order_type 默认1
        null, // original_order_id
        task_name,
        customer_name,
        customer_region,
        task_type_id,
        deadline,
        requirement_desc || null,
        creator_id,
        receiver_id || null,
        0, // status 待派单
        0, // is_evaluated_by_creator
        0, // is_evaluated_by_receiver
        null, // reject_reason
        null, // cancel_reason
        now, // created_at
        null, // updated_at
        null // completed_at
      ]
    );

    const orderId = orderResult.insertId;
    console.log('[订单提交] 订单插入成功, ID:', orderId);

    // 5. 插入attachments表并上传文件到OSS（如果有附件）
    if (attachments && attachments.length > 0) {
      console.log(`[订单提交] 开始处理 ${attachments.length} 个附件`);
      
      for (const attachment of attachments) {
        const { file_name, mime_type, file_type = 1, file_buffer } = attachment;

        // 生成oss_key: department.name/person.real_name/file_name
        const ossKey = `${dept.name}/${user.real_name}/${file_name}`;

        // 如果提供了文件buffer，上传到OSS
        let ossUrl = null;
        if (file_buffer) {
          try {
            ossUrl = await uploadFileToOSS(file_buffer, ossKey, file_type);
            console.log(`[订单提交] 附件上传成功: ${file_name} -> ${ossUrl}`);
          } catch (uploadError) {
            console.error(`[订单提交] 附件上传失败: ${file_name}`, uploadError);
            // 上传失败不影响订单创建，继续处理
          }
        } else {
          console.log(`[订单提交] 附件 ${file_name} 没有提供文件buffer，仅记录到数据库`);
        }

        await connection.execute(
          `INSERT INTO attachments (
            order_id, uploader_id, file_name, file_url, oss_key, file_type, mime_type, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId, // 关联订单ID
            creator_id,
            file_name,
            ossUrl, // OSS返回的文件URL（上传失败时为null）
            ossKey,
            file_type,
            mime_type,
            0 // is_deleted 默认0
          ]
        );

        console.log(`[订单提交] 附件记录已插入: ${file_name}`);
      }
    }

    await connection.commit();

    // 6. 返回成功
    res.json({
      success: true,
      message: '订单提交成功',
      data: {
        order_id: orderId,
        order_no: orderNo
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

module.exports = router;