import { Menu } from 'antd';
import { InboxOutlined, DashboardOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

// 接单人左侧黑底侧边栏
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 根据当前路径计算选中菜单
  const selectedKey = location.pathname.endsWith('/dashboard') ? 'dashboard' : 'orders';

  const items = [
    { key: 'orders', icon: <InboxOutlined />, label: '接单管理' },
    { key: 'dashboard', icon: <DashboardOutlined />, label: '工作看板' },
  ];

  const handleClick = ({ key }) => {
    if (key === 'orders') navigate('/receiver');
    else if (key === 'dashboard') navigate('/receiver/dashboard');
  };

  return (
    <div style={{ height: '100%', background: '#1d1f23', paddingTop: 12 }}>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        onClick={handleClick}
        style={{ background: '#1d1f23', borderInlineEnd: 'none', fontSize: 14 }}
      />
    </div>
  );
}

export default Sidebar;
