import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import 'dayjs/locale/zh-cn';
import App from './App';
import './index.css';

// AntD 主题定制：沿用登录页渐变紫 #667eea
const theme = {
  token: {
    colorPrimary: '#667eea',
    borderRadius: 6,
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
