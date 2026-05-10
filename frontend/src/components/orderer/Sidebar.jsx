import { Menu } from 'antd';
import { FileAddOutlined, DashboardOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

// 左侧黑底侧边栏
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 根据当前路径计算选中菜单
  const selectedKey = location.pathname.endsWith('/dashboard') ? 'dashboard' : 'orders';

  const items = [
    { key: 'orders', icon: <FileAddOutlined />, label: '下单管理' },
    { key: 'dashboard', icon: <DashboardOutlined />, label: '工作看板' },
  ];

  const handleClick = ({ key }) => {
    if (key === 'orders') navigate('/orderer');
    else if (key === 'dashboard') navigate('/orderer/dashboard');
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
