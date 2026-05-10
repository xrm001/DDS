import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import OrdererLayout from '../pages/orderer/OrdererLayout';
import OrderManage from '../pages/orderer/OrderManage';
import Dashboard from '../pages/orderer/Dashboard';

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
  { path: '*', element: <Navigate to="/login" replace /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
