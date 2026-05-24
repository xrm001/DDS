import { useMemo, useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import TopBar from '../../components/orderer/TopBar';
import Sidebar from '../../components/orderer/Sidebar';
import ChatModal from '../../components/orderer/modals/ChatModal';
import { MOCK_ORDERS } from '../../mock/orders';
import { MOCK_NOTIFICATIONS } from '../../mock/messages';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;

// 下单人主布局：顶部 + 左侧边栏 + 右侧主内容
function OrdererLayout() {
  // 从 localStorage 读取用户信息
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('dds_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  // 通知列表
  const [notifications, setNotifications] = useState(
    MOCK_NOTIFICATIONS.filter(n => n.user_id === (user.id || 2))
  );

  // 聊天弹框状态
  const [chatOpen, setChatOpen] = useState(false);
  const [chatOrder, setChatOrder] = useState(null);

  // 全局未读消息数（订单所有未读消息之和）
  const unreadCount = useMemo(
    () => MOCK_ORDERS.reduce((sum, o) => sum + (o.unread_messages || 0), 0),
    []
  );

  // 点击通知
  const handleNotificationClick = (notification) => {
    // 找到对应的订单，打开聊天弹框
    if (notification.related_order_id) {
      const order = MOCK_ORDERS.find(o => o.id === notification.related_order_id);
      if (order) {
        setChatOrder(order);
        setChatOpen(true);
      }
    }
  };

  // 标记单条已读
  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, is_read: 1 }
          : n
      )
    );
    // TODO: 调用后端API更新 notifications.is_read = 1
  };

  // 标记全部已读
  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: 1 }))
    );
    // TODO: 调用后端API更新所有 notifications.is_read = 1
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header
        style={{
          padding: 0,
          height: 60,
          lineHeight: 'normal',
          background: '#fff',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <TopBar
          user={user}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </Header>
      <Layout style={{ height: 'calc(100vh - 60px)' }}>
        <Sider
          width={200}
          style={{
            background: '#1d1f23',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Sidebar />
        </Sider>
        <Content
          style={{
            padding: 20,
            background: '#f5f7fa',
            height: '100%',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* 聊天弹框 */}
      <ChatModal
        open={chatOpen}
        order={chatOrder}
        currentUser={user}
        onCancel={() => {
          setChatOpen(false);
          setChatOrder(null);
        }}
      />
    </Layout>
  );
}

export default OrdererLayout;
