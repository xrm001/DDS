// 用户映射表：用于订单视图按 id 展示人员姓名及所属角色
// role_name 仅用于展示/过滤，数据结构与后端 roles 表保持一致
export const MOCK_USERS = [
  { id: 1, username: 'admin', real_name: '系统管理员', role_name: '系统管理员' },
  { id: 2, username: 'zhangsan', real_name: '张三', role_name: '下单人' },
  { id: 3, username: 'lisi', real_name: '李四', role_name: '下单人' },
  { id: 4, username: 'liJianMo', real_name: '李建模', role_name: '接单人' },
  { id: 5, username: 'manager', real_name: '王主管', role_name: '负责人' },
  { id: 6, username: 'wangSheJi', real_name: '王设计', role_name: '接单人' },
  { id: 7, username: 'zhaoQuanAn', real_name: '赵全案', role_name: '接单人' },
  { id: 8, username: 'sunSheYing', real_name: '孙摄影', role_name: '接单人' },
  { id: 9, username: 'wangwu', real_name: '王五', role_name: '下单人' },
  { id: 10, username: 'zhaoliu', real_name: '赵六', role_name: '下单人' },
];

export const getUserName = (id) => {
  const u = MOCK_USERS.find((x) => x.id === id);
  return u?.real_name || '-';
};

export const getUserRole = (id) => {
  const u = MOCK_USERS.find((x) => x.id === id);
  return u?.role_name || '-';
};
