// 接单人工作看板模拟数据
export const RECEIVER_DASHBOARD_DATA = {
  // 当前
  current: {
    stats: {
      pending_accept: 2, // 待接单
      in_progress: 4, // 进行中
      pending_review: 1, // 待验收
      completed_this_month: 6, // 本月已完成
    },
    // 任务类型分布
    taskTypeDist: [
      { name: '平面设计', value: 4 },
      { name: '全案设计', value: 2 },
      { name: '3D设计', value: 3 },
      { name: '摄影任务', value: 1 },
    ],
    // 优先级分布（额外一维）
    priorityDist: [
      { name: '低', value: 2 },
      { name: '普通', value: 5 },
      { name: '紧急', value: 3 },
    ],
  },
  // 月度
  monthly: {
    // 近6个月接单量趋势
    trend: {
      months: ['2024-12', '2025-01', '2025-02', '2025-03', '2025-04', '2025-05'],
      values: [5, 8, 7, 10, 12, 9],
    },
    // 本月订单状态分布
    statusDist: {
      labels: ['待接单', '进行中', '待验收', '已完成', '已拒绝'],
      values: [2, 4, 1, 6, 1],
    },
  },
  // 历史
  historical: {
    // 按年汇总接单量
    yearly: {
      years: ['2021', '2022', '2023', '2024', '2025'],
      values: [52, 86, 125, 168, 41],
    },
    // 累计准时交付率
    onTimeRate: 88.6,
  },
};
