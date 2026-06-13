import { Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  TagsOutlined,
  SettingOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  BellOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

// 系统管理员侧边栏导航
function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;
  const selectedKey = path.replace('/admin/', '').replace('/admin', 'dashboard');

  const items = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: '数据总览' },
    { 
      key: 'system', 
      icon: <SettingOutlined />, 
      label: '系统配置',
      children: [
        { key: 'users', icon: <UserOutlined />, label: '人员管理' },
        { key: 'roles', icon: <TeamOutlined />, label: '角色管理' },
        { key: 'departments', icon: <ApartmentOutlined />, label: '部门管理' },
        { key: 'task-types', icon: <TagsOutlined />, label: '任务类型' },
        { key: 'dispatch-rules', icon: <SettingOutlined />, label: '派单规则' },
      ]
    },
    { key: 'orders', icon: <FileSearchOutlined />, label: '订单监控' },
    { key: 'schedule', icon: <CalendarOutlined />, label: '人员排班' },
    { key: 'statistics', icon: <BarChartOutlined />, label: '数据统计' },
    { key: 'notifications', icon: <BellOutlined />, label: '通知管理' },
    { key: 'logs', icon: <FileTextOutlined />, label: '操作日志' },
  ];

  const handleClick = ({ key }) => {
    if (key === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${key}`);
    }
  };

  return (
    <div style={{ height: '100%', background: '#1d1f23', paddingTop: 12 }}>
      <div style={{ 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: 600, 
        padding: '8px 16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 12
      }}>
        系统管理
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={['system']}
        items={items}
        onClick={handleClick}
        style={{ background: '#1d1f23', borderInlineEnd: 'none', fontSize: 14 }}
      />
    </div>
  );
}

export default AdminSidebar;
