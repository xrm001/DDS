import { Modal, Descriptions, Tag, Image, Empty } from 'antd';
import { TASK_TYPES, PRIORITIES, ORDER_STATUS, ORDER_TYPES } from '../../../constants/enums';

// 订单详情弹框（只读展示所有字段）
function DetailModal({ open, order, onCancel }) {
  if (!order) return null;

  const taskType = TASK_TYPES.find((t) => t.value === order.task_type_id);
  const priority = PRIORITIES.find((p) => p.value === order.priority);
  const status = ORDER_STATUS[order.status];
  const orderType = ORDER_TYPES[order.order_type];

  // 模拟附件展示（仅演示，实际附件在后端）
  const mockAttachments = order.order_no
    ? [
        { id: 1, name: `参考图-${order.order_no}.jpg`, url: `https://picsum.photos/seed/${order.id}a/200/150` },
        { id: 2, name: `设计稿-${order.order_no}.png`, url: `https://picsum.photos/seed/${order.id}b/200/150` },
      ]
    : [];

  return (
    <Modal
      title={`订单详情 - ${order.order_no}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={760}
    >
      <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
        <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
        <Descriptions.Item label="订单类型">
          <Tag color={orderType.color}>{orderType.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="任务名称">{order.task_name}</Descriptions.Item>
        <Descriptions.Item label="任务类型">{taskType?.label || '-'}</Descriptions.Item>
        <Descriptions.Item label="客户名称">{order.customer_name}</Descriptions.Item>
        <Descriptions.Item label="客户地区">{order.customer_region || '-'}</Descriptions.Item>
        <Descriptions.Item label="优先级">
          {priority ? <Tag color={priority.color}>{priority.label}</Tag> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="订单状态">
          <Tag color={status.color}>{status.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="下单时间">{order.created_at}</Descriptions.Item>
        <Descriptions.Item label="截止日期">{order.deadline || '-'}</Descriptions.Item>
        <Descriptions.Item label="结束时间">{order.completed_at || '-'}</Descriptions.Item>
        <Descriptions.Item label="接单人">{order.receiver_name || '待派单'}</Descriptions.Item>
        {order.original_order_id && (
          <Descriptions.Item label="关联原单" span={2}>
            订单 ID：{order.original_order_id}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="需求描述" span={2}>
          {order.requirement_desc || '-'}
        </Descriptions.Item>
        {order.status === 5 && order.reject_reason && (
          <Descriptions.Item label="拒绝理由" span={2}>
            <span style={{ color: '#ff4d4f' }}>{order.reject_reason}</span>
            {order.rejected_at && (
              <span style={{ color: '#8c8c8c', marginLeft: 12, fontSize: 12 }}>
                ({order.rejected_at})
              </span>
            )}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="附件" span={2}>
          {mockAttachments.length > 0 ? (
            <Image.PreviewGroup>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {mockAttachments.map((a) => (
                  <div key={a.id} style={{ textAlign: 'center' }}>
                    <Image width={120} height={80} src={a.url} style={{ borderRadius: 4, objectFit: 'cover' }} />
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, maxWidth: 120 }}>
                      {a.name}
                    </div>
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          ) : (
            <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default DetailModal;
