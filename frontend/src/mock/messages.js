// 按订单ID分组的聊天消息模拟数据
export const MOCK_MESSAGES = {
  2: [
    { id: 1, sender_id: 2, sender_name: '张三', content: '3D模型文件已上传，请参考', attachment_url: null, created_at: '2025-05-09 10:20:00' },
    { id: 2, sender_id: 4, sender_name: '李建模', content: '收到，预计明天完成初版', attachment_url: null, created_at: '2025-05-09 10:35:00' },
    { id: 3, sender_id: 4, sender_name: '李建模', content: '初版渲染完成，请查看', attachment_url: 'https://picsum.photos/seed/dds2/300/200', created_at: '2025-05-10 14:10:00' },
    { id: 4, sender_id: 2, sender_name: '张三', content: '整体不错，细节还需加强', attachment_url: null, created_at: '2025-05-10 16:00:00' },
  ],
  3: [
    { id: 1, sender_id: 2, sender_name: '张三', content: '品牌全案需求比较紧急，请优先处理', attachment_url: null, created_at: '2025-05-09 11:05:00' },
    { id: 2, sender_id: 7, sender_name: '赵全案', content: '明白，VI主视觉已完成', attachment_url: 'https://picsum.photos/seed/dds3/300/200', created_at: '2025-05-12 10:20:00' },
  ],
  5: [
    { id: 1, sender_id: 2, sender_name: '张三', content: '这是原订单的修改版，调整色调为冷色系', attachment_url: null, created_at: '2025-05-10 09:35:00' },
    { id: 2, sender_id: 6, sender_name: '王设计', content: '好的，今天下午给你初稿', attachment_url: null, created_at: '2025-05-10 09:50:00' },
  ],
  8: [
    { id: 1, sender_id: 2, sender_name: '张三', content: '时装周宣传册32P排版需要一些创意', attachment_url: null, created_at: '2025-05-10 15:30:00' },
    { id: 2, sender_id: 7, sender_name: '赵全案', content: '参考样张已发，请确认', attachment_url: 'https://picsum.photos/seed/dds8/300/200', created_at: '2025-05-11 09:00:00' },
  ],
  10: [
    { id: 1, sender_id: 6, sender_name: '王设计', content: '设计师已离职，此单拒绝', attachment_url: null, created_at: '2025-05-11 10:00:00' },
  ],
};

// 系统通知数据（订单状态动态）
export const SYSTEM_NOTIFICATIONS = [
  {
    id: 1,
    type: 'completed',
    title: '订单已完成',
    content: '张三的订单 DDS20250509001（新品宣传海报设计）已由王设计完成',
    created_at: '2025-05-18 16:20:00',
    is_read: false,
  },
  {
    id: 2,
    type: 'progress',
    title: '订单进行中',
    content: '李建模已开始制作 DDS20250509002（产品3D渲染图）',
    created_at: '2025-05-10 14:10:00',
    is_read: false,
  },
  {
    id: 3,
    type: 'pending',
    title: '待验收通知',
    content: '赵全案提交的 DDS20250509003（品牌全案设计）待您验收',
    created_at: '2025-05-16 09:30:00',
    is_read: false,
  },
  {
    id: 4,
    type: 'pending',
    title: '新订单待接单',
    content: '系统已分配订单 DDS20250509004（产品摄影）给孙摄影，等待接单',
    created_at: '2025-05-09 14:00:00',
    is_read: true,
  },
  {
    id: 5,
    type: 'completed',
    title: '订单已完成',
    content: '李建模已完成 DDS20250510002（汽车模型3D建模）',
    created_at: '2025-05-08 18:00:00',
    is_read: true,
  },
];

// 通知中心数据（与 notifications 表结构对齐）
export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    user_id: 2,
    notify: '您有一笔插队申请待处理：订单 DDS20250510010 申请插队到 DDS20250509002',
    is_read: 0,
    type: 1,
    related_order_id: 2,
    related_user_id: 3,
    created_at: '2025-05-23 10:00:00',
  },
  {
    id: 2,
    user_id: 2,
    notify: '李建模已响应您的插队申请：同意插队到订单 DDS20250509003',
    is_read: 0,
    type: 2,
    related_order_id: 3,
    related_user_id: 4,
    created_at: '2025-05-23 09:30:00',
  },
  {
    id: 3,
    user_id: 2,
    notify: '订单 DDS20250509003（品牌全案设计）已提交验收，请及时审核',
    is_read: 0,
    type: 4,
    related_order_id: 3,
    related_user_id: 7,
    created_at: '2025-05-23 08:00:00',
  },
  {
    id: 4,
    user_id: 2,
    notify: '接单人王设计已拒绝您的订单 DDS20250511002',
    is_read: 1,
    type: 3,
    related_order_id: 10,
    related_user_id: 6,
    created_at: '2025-05-22 17:00:00',
  },
];

