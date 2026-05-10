import { useMemo } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import TopBar from '../../components/orderer/TopBar';
import Sidebar from '../../components/receiver/Sidebar';
import { MOCK_ORDERS } from '../../mock/orders';

const { Header, Sider, Content } = Layout;

// 接单人主布局：顶部 + 左侧边栏 + 右侧主内容
function ReceiverLayout() {
  // 从 localStorage 读取用户信息
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('dds_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  // 接单人视角的未读消息数：仅统计分派给当前用户的订单
  const unreadCount = useMemo(() => {
    const myId = user?.userId;
    if (!myId) return 0;
    return MOCK_ORDERS
      .filter((o) => o.receiver_id === myId)
      .reduce((sum, o) => sum + (o.unread_messages || 0), 0);
  }, [user]);

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
        <TopBar user={user} unreadCount={unreadCount} />
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
    </Layout>
  );
}

export default ReceiverLayout;
