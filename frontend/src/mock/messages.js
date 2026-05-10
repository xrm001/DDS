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
