import { useMemo } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import TopBar from '../../components/orderer/TopBar';
import Sidebar from '../../components/orderer/Sidebar';
import { MOCK_ORDERS } from '../../mock/orders';

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

  // 全局未读消息数（订单所有未读消息之和）
  const unreadCount = useMemo(
    () => MOCK_ORDERS.reduce((sum, o) => sum + (o.unread_messages || 0), 0),
    []
  );

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

export default OrdererLayout;
