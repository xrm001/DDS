const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

/**
 * POST /api/auth/login
 * 登录验证流程：
 * 1. 查询 person 表 username 是否存在
 * 2. 查询 person_roles 表确认该用户是否有角色
 * 3. 比对 password 字段（bcrypt）
 * 4. 返回对应提示
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_PARAMS',
      message: '用户名和密码不能为空'
    });
  }

  try {
    // Step 1: 查询 person 表
    const [users] = await db.execute(
      'SELECT `id`, `username`, `password`, `real_name` FROM `person` WHERE `username` = ? LIMIT 1',
      [username]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误'
      });
    }

    const user = users[0];

    // Step 2: 查询 person_roles 表，确认用户是否有角色
    const [roles] = await db.execute(
      `SELECT r.id, r.role_code, r.role_name
       FROM roles r
       INNER JOIN person_roles pr ON r.id = pr.role_id
       WHERE pr.person_id = ?`,
      [user.id]
    );

    if (roles.length === 0) {
      return res.json({
        success: false,
        code: 'NO_ROLE',
        message: '你无权使用该系统'
      });
    }

    // Step 3: 比对 password（支持 bcrypt 和明文兼容）
    let isMatch = false;
    if (user.password.startsWith('$2')) {
      // bcrypt 哈希格式
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // 明文密码（兼容旧数据）
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '用户名或密码错误'
      });
    }

    // Step 4: 登录成功
    res.json({
      success: true,
      code: 'LOGIN_SUCCESS',
      message: '登陆成功',
      data: {
        userId: user.id,
        username: user.username,
        realName: user.real_name,
        roles: roles
      }
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: '服务器内部错误，请联系管理员'
    });
  }
});

module.exports = router;
