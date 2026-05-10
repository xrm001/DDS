import { useState, useEffect } from 'react';
import { Badge, Tag, Button, Space, Modal } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// 顶部标题栏组件
function TopBar({ user, unreadCount = 0 }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(dayjs());

  // 每秒刷新当前时间
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 退出登录
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '退出',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('dds_user');
        navigate('/login');
      },
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        height: 60,
        background: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 1px 4px rgba(0, 21, 41, 0.04)',
      }}
    >
      {/* 左：系统名称 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          DDS
        </div>
        <span style={{ fontSize: 17, fontWeight: 600, color: '#262626' }}>
          视觉设计派单管理系统
        </span>
      </div>

      {/* 右：时间 + 用户信息 + 消息 + 退出 */}
      <Space size={20} align="center">
        <span style={{ color: '#595959', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {now.format('YYYY-MM-DD HH:mm:ss')}
        </span>

        <Space size={8}>
          <UserOutlined style={{ color: '#667eea' }} />
          <span style={{ color: '#262626', fontWeight: 500 }}>
            {user?.realName || user?.username}
          </span>
          {user?.roles?.map((role) => (
            <Tag key={role.id} color="processing">
              {role.role_name}
            </Tag>
          ))}
        </Space>

        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 18, color: '#595959', cursor: 'pointer' }} />
        </Badge>

        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
          退出
        </Button>
      </Space>
    </div>
  );
}

export default TopBar;
