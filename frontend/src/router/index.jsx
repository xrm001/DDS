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
      // index 直达工作看板
      { index: true, element: <ManagerDashboard /> },
      // 复用下单人页面
      { path: 'orderer', element: <OrderManage /> },
      // 复用接单人页面
      { path: 'receiver', element: <ReceiverOrderManage /> },
      // 全公司订单列表
      { path: 'orders', element: <ManagerOrderList /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
