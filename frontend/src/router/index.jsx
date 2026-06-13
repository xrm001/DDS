import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import OrdererLayout from '../pages/orderer/OrdererLayout';
import OrderManage from '../pages/orderer/OrderManage';
import Dashboard from '../pages/orderer/Dashboard';
import ReceiverLayout from '../pages/receiver/ReceiverLayout';
import ReceiverOrderManage from '../pages/receiver/ReceiverOrderManage';
import ReceiverDashboard from '../pages/receiver/ReceiverDashboard';
import ManagerLayout from '../pages/manager/ManagerLayout';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerOrderList from '../pages/manager/ManagerOrderList';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManage from '../pages/admin/UserManage';
import RoleManage from '../pages/admin/RoleManage';
import DepartmentManage from '../pages/admin/DepartmentManage';
import TaskTypeManage from '../pages/admin/TaskTypeManage';
import DispatchRuleManage from '../pages/admin/DispatchRuleManage';
import GlobalOrderMonitor from '../pages/admin/GlobalOrderMonitor';
import StatisticsReport from '../pages/admin/StatisticsReport';
import NotificationManage from '../pages/admin/NotificationManage';
import OperationLog from '../pages/admin/OperationLog';
import PersonnelSchedule from '../pages/admin/PersonnelSchedule';

// 登录守卫：未登录重定向到 /login
const RequireAuth = ({ children }) => {
  const user = localStorage.getItem('dds_user');
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// 路由配置
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Login /> },
  {
    path: '/orderer',
    element: (
      <RequireAuth>
        <OrdererLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OrderManage /> },
      { path: 'dashboard', element: <Dashboard /> },
    ],
  },
  {
    path: '/receiver',
    element: (
      <RequireAuth>
        <ReceiverLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ReceiverOrderManage /> },
      { path: 'dashboard', element: <ReceiverDashboard /> },
    ],
  },
  {
    path: '/manager',
    element: (
      <RequireAuth>
        <ManagerLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: 'orderer', element: <OrderManage /> },
      { path: 'receiver', element: <ReceiverOrderManage /> },
      { path: 'orders', element: <ManagerOrderList /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UserManage /> },
      { path: 'roles', element: <RoleManage /> },
      { path: 'departments', element: <DepartmentManage /> },
      { path: 'task-types', element: <TaskTypeManage /> },
      { path: 'dispatch-rules', element: <DispatchRuleManage /> },
      { path: 'orders', element: <GlobalOrderMonitor /> },
      { path: 'statistics', element: <StatisticsReport /> },
      { path: 'notifications', element: <NotificationManage /> },
      { path: 'schedule', element: <PersonnelSchedule /> },
      { path: 'logs', element: <OperationLog /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
