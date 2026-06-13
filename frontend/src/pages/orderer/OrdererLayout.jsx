import { useMemo, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from '../../components/orderer/TopBar';
import Sidebar from '../../components/orderer/Sidebar';

const { Header, Sider, Content } = Layout;

// 下单人主布局：顶部 + 左侧边栏 + 右侧主内容
function OrdererLayout() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('dds_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const location = useLocation();

  // 路由变化时检查 localStorage 中的待处理动作（从通知中心跳转过来）
  useEffect(() => {
    const raw = localStorage.getItem('dds_pending_action');
    if (!raw) return;
    localStorage.removeItem('dds_pending_action');

    try {
      const action = JSON.parse(raw);
      // 延迟执行，确保 Outlet 子组件已渲染
      setTimeout(() => {
        if (action.type === 'chat' && action.orderId) {
          window.dispatchEvent(new CustomEvent('dds-open-chat', { detail: action }));
          window.dispatchEvent(new CustomEvent('dds-scroll-to-order', { detail: action }));
        } else if (action.type === 'scroll' && action.orderId) {
          window.dispatchEvent(new CustomEvent('dds-scroll-to-order', { detail: action }));
        }
      }, 500);
    } catch { /* ignore */ }
  }, [location.pathname]);

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
        <TopBar user={user} />
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
