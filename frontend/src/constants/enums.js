// 任务类型枚举（与 SQL task_types ENUM 对齐）
export const TASK_TYPES = [
  { value: 1, label: '平面设计', code: 'graphic_design' },
  { value: 2, label: '全案设计', code: 'full_case_design' },
  { value: 3, label: '3D设计', code: '3d_design' },
  { value: 4, label: '摄影任务', code: 'photography' },
  { value: 5, label: '护肤新品', code: 'skincare' },
  { value: 6, label: '香水新品', code: 'perfume' },
  { value: 7, label: 'banner', code: 'banner' },
  { value: 8, label: '医药新品', code: 'pharmaceutical' },
];

// 运营下单人专用任务类型（去掉了平面设计、3D设计、摄影任务）
export const OPERATION_TASK_TYPES = [
  { value: 2, label: '全案设计', code: 'full_case_design' },
  { value: 5, label: '护肤新品', code: 'skincare' },
  { value: 6, label: '香水新品', code: 'perfume' },
  { value: 7, label: 'banner', code: 'banner' },
  { value: 8, label: '医药新品', code: 'pharmaceutical' },
];

// 订单类型
export const ORDER_TYPES = {
  1: { label: '原始订单', color: 'blue' },
  2: { label: '修改单', color: 'red' },
};

// 优先级
export const PRIORITIES = [
  { value: 1, label: '低', color: 'default' },
  { value: 2, label: '普通', color: 'blue' },
  { value: 3, label: '紧急', color: 'red' },
];

// 订单状态
export const ORDER_STATUS = {
  0: { label: '待派单', color: 'default' },
  1: { label: '待接单', color: 'orange' },
  2: { label: '进行中', color: 'processing' },
  3: { label: '待验收', color: 'gold' },
  4: { label: '已完成', color: 'success' },
  5: { label: '已拒绝', color: 'error' },
  6: { label: '已取消', color: 'default' },
};

// 评价维度（下单人视角）
export const EVAL_DIMENSIONS = [
  { key: 'score_completion', label: '完成度' },
  { key: 'score_communication', label: '沟通' },
  { key: 'score_understanding', label: '任务理解' },
  { key: 'score_technical', label: '技术' },
  { key: 'score_design', label: '设计' },
];

// 评价维度（接单人视角 - 对下单人/订单的评价）
export const RECEIVER_EVAL_DIMENSIONS = [
  { key: 'score_requirement_clarity', label: '需求描述' },
  { key: 'score_attachment_quality', label: '附件提供' },
  { key: 'score_communication', label: '沟通' },
  { key: 'score_confirmation_timeliness', label: '确认及时性' },
];
