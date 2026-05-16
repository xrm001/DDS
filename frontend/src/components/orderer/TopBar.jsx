import { useState, useEffect } from 'react';
import { Badge, Tag, Button, Space, Modal, Popover, List, Avatar } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { SYSTEM_NOTIFICATIONS } from '../../mock/messages';

// 顶部标题栏组件
function TopBar({ user, unreadCount = 0 }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(dayjs());
  const [notifications, setNotifications] = useState(SYSTEM_NOTIFICATIONS);
  const [open, setOpen] = useState(false);

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

  // 处理消息弹框显示
  const handleVisibleChange = (visible) => {
    setOpen(visible);
  };

  // 标记所有消息为已读
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  // 获取通知类型图标
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'progress':
        return <SyncOutlined spin style={{ color: '#1677ff' }} />;
      default:
        return <BellOutlined style={{ color: '#667eea' }} />;
    }
  };

  // 消息弹框内容
  const notificationContent = (
    <div style={{ width: 400 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>通知中心</span>
        <Button type="link" size="small" onClick={() => setOpen(false)}>
          关闭
        </Button>
      </div>
      <List
        dataSource={notifications}
        locale={{ emptyText: '暂无通知' }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '12px 8px',
              background: item.is_read ? '#fff' : '#f6f8ff',
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar style={{ backgroundColor: '#f0f2f5' }}>
                  {getNotificationIcon(item.type)}
                </Avatar>
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: item.is_read ? 400 : 600, fontSize: 13 }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {dayjs(item.created_at).format('HH:mm:ss')}
                  </span>
                </div>
              }
              description={
                <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
                  {item.content}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

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

        <Popover
          content={notificationContent}
          title={null}
          trigger="hover"
          open={open}
          onOpenChange={handleVisibleChange}
          placement="bottomRight"
          overlayStyle={{ width: 420 }}
        >
          <Badge count={notifications.filter(n => !n.is_read).length} size="small" offset={[-2, 2]}>
            <BellOutlined 
              style={{ 
                fontSize: 18, 
                color: notifications.some(n => !n.is_read) ? '#1677ff' : '#595959',
                cursor: 'pointer' 
              }} 
            />
          </Badge>
        </Popover>

        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
          退出
        </Button>
      </Space>
    </div>
  );
}

export default TopBar;
