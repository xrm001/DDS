// 任务类型枚举（与数据库 task_types 表 ID 对齐）
// 业务下单人/业务主管/业务部门经理/销售中心经理可选
export const BUSINESS_TASK_TYPES = [
  { value: 1, label: '平面设计', code: 'graphic' },
  { value: 2, label: '全案设计', code: 'brand' },
  { value: 3, label: '3D设计', code: '3d' },
];

// 运营下单人/运营主管/新媒体运营主管/新媒体运营下单人/市场运营部门经理可选
// 新品开发对应 护肤新品(6)+医药新品(7)+香水新品(8) 三个子类型
export const OPERATION_TASK_TYPES = [
  { value: 12, label: '新品开发', code: 'new_product', subTypes: [6, 7, 8] },
  { value: 9, label: '海报设计', code: 'poster' },
  { value: 14, label: '店铺设计', code: 'shop' },
  { value: 13, label: '包装盒设计', code: 'package' },
  { value: 11, label: '画册设计', code: 'catalog' },
  { value: 4, label: '摄影', code: 'photo' },
  { value: 10, label: '短视频制作', code: 'video' },
];

// 兼容旧名称
export const TASK_TYPES = BUSINESS_TASK_TYPES;

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
  // 成交状态（订单完成后3天内需更新）
  7: { label: '待确认', color: 'default' },  // 默认状态
  8: { label: '谈单中', color: 'processing' },
  9: { label: '已成交', color: 'success' },
  10: { label: '未成交', color: 'error' },
};

// 成交状态
export const DEAL_STATUS = {
  7: { label: '待确认', color: 'default' },
  8: { label: '谈单中', color: 'processing' },
  9: { label: '已成交', color: 'success' },
  10: { label: '未成交', color: 'error' },
};

// 分配人员选项（运营相关角色可见）
export const ASSIGNEE_OPTIONS = [
  {
    value: 'ding_sihua',
    label: '丁思华',
    group: 'A',
    members: ['符晓冰', '林创杰', '张梓杰', '刘金豪'],
  },
  {
    value: 'cai_xiaoping',
    label: '蔡晓萍',
    group: 'B',
    members: ['曾苑婷', '马凯特', '盘小楚', '陈宇嫣'],
  },
];

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

// 插队申请状态
export const CUT_IN_LINE_STATUS = {
  0: { label: '插队已申请', color: 'default' },
  1: { label: '插队已同意', color: 'success' },
  2: { label: '插队已拒绝', color: 'error' },
  3: { label: '插队待处理', color: 'processing' },
  4: { label: '被插队已同意', color: 'success' },
  5: { label: '被插队已拒绝', color: 'error' },
};
