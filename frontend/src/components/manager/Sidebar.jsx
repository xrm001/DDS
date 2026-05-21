import { Menu } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  InboxOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

// 负责人左侧黑底侧边栏：工作看板 / 下单管理 / 接单管理 / 订单列表
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 根据当前路径计算选中菜单
  const path = location.pathname;
  let selectedKey = 'dashboard';
  if (path.endsWith('/orderer')) selectedKey = 'orderer';
  else if (path.endsWith('/receiver')) selectedKey = 'receiver';
  else if (path.endsWith('/orders')) selectedKey = 'orders';

  const items = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据看板' },
    { key: 'orderer', icon: <FileTextOutlined />, label: '下单管理' },
    { key: 'receiver', icon: <InboxOutlined />, label: '接单管理' },
    { key: 'orders', icon: <UnorderedListOutlined />, label: '订单列表' },
  ];

  const handleClick = ({ key }) => {
    if (key === 'dashboard') navigate('/manager');
    else navigate(`/manager/${key}`);
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
