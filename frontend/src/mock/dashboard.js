// 工作看板模拟数据
export const DASHBOARD_DATA = {
  // 当前统计
  current: {
    stats: {
      pending_dispatch: 2, // 待派单
      in_progress: 3, // 进行中
      pending_acceptance: 1, // 待验收
      completed: 3, // 已完成
    },
    // 任务类型分布
    taskTypeDist: [
      { name: '平面设计', value: 5 },
      { name: '全案设计', value: 2 },
      { name: '3D设计', value: 3 },
      { name: '摄影任务', value: 2 },
    ],
  },
  // 月度统计
  monthly: {
    // 近6个月下单趋势
    trend: {
      months: ['2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'],
      values: [8, 12, 10, 15, 18, 12],
    },
    // 本月订单状态分布
    statusDist: {
      labels: ['待派单', '待接单', '进行中', '待验收', '已完成', '已拒绝', '已取消'],
      values: [2, 1, 3, 1, 3, 1, 1],
    },
  },
  // 历史统计
  historical: {
    // 按年汇总
    yearly: {
      years: ['2021', '2022', '2023', '2024', '2025'],
      values: [85, 132, 186, 210, 72],
    },
    // 累计完成率
    completeRate: 82.5,
  },
};
