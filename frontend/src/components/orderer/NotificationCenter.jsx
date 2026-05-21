import { useState, useEffect } from 'react';
import { Badge, Tag, Button, Space, Modal, Popover, List, Avatar, message } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// 通知组件（支持成交通知）
// 特点：
// 1. 仅在订单状态为"已成交"时触发通知
// 2. 通知内容简短，只显示关键信息
// 3. 红色脚标提醒未读通知数量
// 4. 查看后关闭弹窗，不再显示脚标
function NotificationCenter({ user, orders = [] }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  // 生成成交通知
  useEffect(() => {
    const dealNotifications = orders
      .filter(order => order.deal_status === 9) // 已成交
      .map(order => ({
        id: `deal_${order.id}`,
        type: 'deal',
        title: '订单已成交',
        content: `订单 ${order.order_no} 已成交，成交金额 ${order.currency === 'USD' ? '$' : '¥'}${order.deal_amount?.toFixed(2) || '0.00'}`,
        order_id: order.id,
        order_no: order.order_no,
        created_at: order.deal_updated_at || order.completed_at || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        is_read: order.deal_notified || false,
      }));

    // 合并其他通知
    const allNotifications = [
      ...dealNotifications,
      // 这里可以添加其他类型的通知
    ].sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf());

    setNotifications(allNotifications);
  }, [orders]);

  // 计算未读数量
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // 标记通知为已读
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  // 标记所有通知为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    message.success('所有通知已标记为已读');
  };

  // 关闭弹窗时标记所有通知为已读
  const handleOpenChange = (visible) => {
    if (!visible && unreadCount > 0) {
      markAllAsRead();
    }
    setOpen(visible);
  };

  // 点击通知项
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    // 可以在这里跳转到订单详情页
    // navigate(`/orders/${notification.order_id}`);
  };

  // 获取通知类型图标
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'deal':
        return <DollarOutlined style={{ color: '#52c41a' }} />;
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
        <Space>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={markAllAsRead}>
              全部已读
            </Button>
          )}
          <Button type="link" size="small" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </Space>
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
              cursor: 'pointer',
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
                  <span style={{ fontWeight: item.is_read ? 400 : 600, fontSize: 13 }}>
                    {!item.is_read && <Badge dot style={{ marginRight: 4 }} />}
                    {item.title}
                  </span>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                    {dayjs(item.created_at).format('MM-DD HH:mm')}
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
    <Popover
      content={notificationContent}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      overlayStyle={{ width: 420 }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined 
          style={{ 
            fontSize: 18, 
            color: unreadCount > 0 ? '#ff4d4f' : '#595959',
            cursor: 'pointer' 
          }} 
        />
      </Badge>
    </Popover>
  );
}

export default NotificationCenter;
