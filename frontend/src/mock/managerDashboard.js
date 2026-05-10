// 负责人工作看板模拟数据：覆盖全公司所有下单人 & 接单人
export const MANAGER_DASHBOARD_DATA = {
  // 当前维度
  current: {
    stats: {
      pending_dispatch: 3, // 待派单
      in_progress: 6, // 进行中
      pending_acceptance: 2, // 待验收
      completed_this_month: 8, // 本月已完成
      total_ordered: 26, // 累计下单
      total_received: 24, // 累计接单
    },
    // 任务类型分布（全公司）
    taskTypeDist: [
      { name: '平面设计', value: 9 },
      { name: '全案设计', value: 5 },
      { name: '3D设计', value: 7 },
      { name: '摄影任务', value: 5 },
    ],
    // 下单人排行（下单量）
    ordererRank: [
      { name: '张三', value: 10 },
      { name: '李四', value: 7 },
      { name: '王五', value: 5 },
      { name: '赵六', value: 4 },
    ],
    // 接单人排行（接单量）
    receiverRank: [
      { name: '王设计', value: 9 },
      { name: '李建模', value: 6 },
      { name: '赵全案', value: 5 },
      { name: '孙摄影', value: 4 },
    ],
  },
  // 月度维度
  monthly: {
    // 近6个月下单量 vs 接单量
    trend: {
      months: ['2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'],
      ordered: [12, 18, 15, 22, 26, 19],
      received: [10, 16, 14, 20, 24, 18],
    },
    // 本月各状态分布
    statusDist: {
      labels: ['待派单', '待接单', '进行中', '待验收', '已完成', '已拒绝', '已取消'],
      values: [3, 2, 6, 2, 8, 1, 1],
    },
  },
  // 历史维度
  historical: {
    // 按年汇总下单总量
    yearly: {
      years: ['2021', '2022', '2023', '2024', '2025'],
      values: [120, 185, 260, 318, 96],
    },
    // 全公司累计完成率
    completeRate: 86.3,
  },
};
