import { useState } from 'react';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const result = response.data;

      setMessage(result.message);
      setMessageType(result.success ? 'success' : 'error');

      if (result.success) {
        setLoginSuccess(true);
        setUserData(result.data);
        // 暂时不执行跳转，待后续页面开发完成后再实现
      }
    } catch (error) {
      console.error('登录请求异常：', error);
      setMessage('网络请求失败，请检查服务器连接');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>DDS 视觉设计派单管理系统</h2>
        <p className="subtitle">Design Dispatch System</p>

        {!loginSuccess ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? '登录中...' : '登 录'}
            </button>
            {message && (
              <div className={`message ${messageType}`}>{message}</div>
            )}
          </form>
        ) : (
          <div className="success-panel">
            <div className="message success">{message}</div>
            <div className="user-info">
              <p>
                <strong>用户ID：</strong>
                {userData.userId}
              </p>
              <p>
                <strong>用户名：</strong>
                {userData.username}
              </p>
              <p>
                <strong>真实姓名：</strong>
                {userData.realName}
              </p>
              <p>
                <strong>角色权限：</strong>
              </p>
              <div className="role-tags">
                {userData.roles.map((role) => (
                  <span key={role.id} className="role-tag">
                    {role.role_name}
                  </span>
                ))}
              </div>
            </div>
            <p className="hint">
              角色对应的主页面开发中，跳转功能待后续实现...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
