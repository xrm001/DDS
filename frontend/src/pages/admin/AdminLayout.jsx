import { useMemo } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import TopBar from '../../components/orderer/TopBar';
import AdminSidebar from '../../components/admin/AdminSidebar';

const { Header, Sider, Content } = Layout;

// 系统管理员主布局
function AdminLayout() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('dds_user') || '{}');
    } catch {
      return {};
    }
  }, []);

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
          width={220}
          style={{ background: '#1d1f23', height: '100%', overflow: 'hidden' }}
        >
          <AdminSidebar />
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

export default AdminLayout;
