import { useState, useEffect } from 'react';
import { Badge, Tag, Button, Space, Modal, Popover, List, Avatar, Empty } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// 顶部标题栏组件
// props:
//   user: 当前用户信息
//   notifications: 通知列表 [{ id, user_id, notify, is_read, type, related_order_id, related_user_id, created_at }]
//   onNotificationClick: 点击通知回调 (notification) -> void
//   onMarkAsRead: 标记已读回调 (notificationId) -> void
//   onMarkAllAsRead: 标记全部已读回调 () -> void
function TopBar({ user, notifications = [], onNotificationClick, onMarkAsRead, onMarkAllAsRead }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(dayjs());
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

  // 处理弹框显示
  const handleVisibleChange = (visible) => {
    setOpen(visible);
  };

  // 点击通知
  const handleNotificationClick = (notification) => {
    // 标记为已读
    onMarkAsRead?.(notification.id);
    // 关闭弹框
    setOpen(false);
    // 调用父组件处理
    onNotificationClick?.(notification);
  };

  // 标记所有已读
  const handleMarkAllAsRead = () => {
    onMarkAllAsRead?.();
  };

  // 获取通知类型图标
  const getNotificationIcon = (type) => {
    switch(type) {
      case 1:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 2:
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 3:
        return <SyncOutlined spin style={{ color: '#1677ff' }} />;
      default:
        return <BellOutlined style={{ color: '#667eea' }} />;
    }
  };

  // 获取通知类型名称
  const getNotificationTypeName = (type) => {
    switch(type) {
      case 1: return '插队申请';
      case 2: return '插队响应';
      case 3: return '订单状态变更';
      case 4: return '验收通知';
      default: return '系统通知';
    }
  };

  // 未读通知列表（is_read = 0）
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCountDisplay = unreadNotifications.length;

  // 通知列表内容
  const notificationContent = (
    <div style={{ width: 420, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          通知中心 {unreadCountDisplay > 0 && `(${unreadCountDisplay}条未读)`}
        </span>
        {unreadCountDisplay > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            全部已读
          </Button>
        )}
      </div>
      {unreadNotifications.length > 0 ? (
        <List
          dataSource={unreadNotifications}
          locale={{ emptyText: '暂无未读通知' }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{
                padding: '12px 8px',
                background: '#f6f8ff',
                borderRadius: 4,
                marginBottom: 8,
                cursor: 'pointer',
                border: '1px solid #e8edff',
              }}
              onClick={() => handleNotificationClick(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: '#f0f2f5' }}>
                    {getNotificationIcon(item.type)}
                  </Avatar>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>
                      {item.notify}
                    </span>
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<MessageOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(item);
                      }}
                    >
                      查看
                    </Button>
                  </div>
                }
                description={
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
                    {getNotificationTypeName(item.type)}
                    {item.related_order_id && ` | 订单: ${item.related_order_id}`}
                    <span style={{ marginLeft: 8, color: '#8c8c8c' }}>
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无未读通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
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
          overlayStyle={{ width: 440 }}
        >
          <Badge count={unreadCountDisplay} size="small" offset={[-2, 2]} showZero>
            <BellOutlined 
              style={{ 
                fontSize: 18, 
                color: unreadCountDisplay > 0 ? '#1677ff' : '#595959',
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