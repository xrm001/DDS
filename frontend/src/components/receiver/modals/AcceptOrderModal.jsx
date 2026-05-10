import { Modal, Descriptions, Tag, Button, Space, Input, Alert, message } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { TASK_TYPES, PRIORITIES, ORDER_TYPES } from '../../../constants/enums';

const { TextArea } = Input;

// 接单处理弹框（接单人视角）
// 展示任务详情，提供"接受"和"拒绝"两个选项；拒绝时必须填写理由
// props:
//   open, order, onCancel
//   onAccept(order)             - 确认接单 -> status=2
//   onReject(order, reason)     - 确认拒绝 -> status=5，reason 必填
function AcceptOrderModal({ open, order, onCancel, onAccept, onReject }) {
  // 交互模式：'choose'=选择 | 'rejecting'=正在填拒绝理由
  const [mode, setMode] = useState('choose');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setMode('choose');
      setReason('');
    }
  }, [open]);

  if (!order) return null;

  const taskType = TASK_TYPES.find((t) => t.value === order.task_type_id);
  const priority = PRIORITIES.find((p) => p.value === order.priority);
  const orderType = ORDER_TYPES[order.order_type];

  const handleAccept = () => {
    onAccept(order);
  };

  const handleRejectClick = () => {
    // 第一次点击：切换到"填写拒绝理由"模式
    setMode('rejecting');
  };

  const handleConfirmReject = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      message.warning('请填写拒绝理由');
      return;
    }
    onReject(order, trimmed);
  };

  const handleBackToChoose = () => {
    setMode('choose');
    setReason('');
  };

  // 根据模式渲染底部按钮
  const footer =
    mode === 'choose' ? (
      <Space>
        <Button onClick={onCancel}>关闭</Button>
        <Button danger icon={<CloseCircleFilled />} onClick={handleRejectClick}>
          拒绝
        </Button>
        <Button type="primary" icon={<CheckCircleFilled />} onClick={handleAccept}>
          接受
        </Button>
      </Space>
    ) : (
      <Space>
        <Button onClick={handleBackToChoose}>返回</Button>
        <Button danger type="primary" icon={<CloseCircleFilled />} onClick={handleConfirmReject}>
          确认拒绝
        </Button>
      </Space>
    );

  return (
    <Modal
      title={
        <Space>
          <span>接单处理</span>
          <Tag color="orange">待接单</Tag>
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>{order.order_no}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={680}
      destroyOnClose
      footer={footer}
    >
      {/* 任务详情 */}
      <Descriptions bordered size="small" column={2} style={{ marginBottom: 12 }}>
        <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
        <Descriptions.Item label="订单类型">
          <Tag color={orderType.color}>{orderType.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="任务名称">{order.task_name}</Descriptions.Item>
        <Descriptions.Item label="任务类型">{taskType?.label || '-'}</Descriptions.Item>
        <Descriptions.Item label="客户名称">{order.customer_name}</Descriptions.Item>
        <Descriptions.Item label="客户国籍">{order.customer_region || '-'}</Descriptions.Item>
        <Descriptions.Item label="优先级">
          {priority ? <Tag color={priority.color}>{priority.label}</Tag> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="截止时间">{order.deadline || '-'}</Descriptions.Item>
        <Descriptions.Item label="下单时间">{order.created_at}</Descriptions.Item>
        <Descriptions.Item label="派单接单人">{order.receiver_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="需求描述" span={2}>
          {order.requirement_desc || '-'}
        </Descriptions.Item>
      </Descriptions>

      {/* 拒绝理由填写区 */}
      {mode === 'rejecting' && (
        <>
          <Alert
            type="warning"
            showIcon
            message="拒绝接单需要填写理由"
            description="一旦确认拒绝，订单将标记为已拒绝，无法恢复。请填写具体的拒绝理由以便下单人知悉。"
            style={{ marginBottom: 12 }}
          />
          <div style={{ marginBottom: 6, color: '#262626', fontWeight: 500 }}>
            拒绝理由 <span style={{ color: '#ff4d4f' }}>*</span>
          </div>
          <TextArea
            rows={4}
            placeholder="例如：当前排期已满，无法按时交付 / 任务类型不匹配 / 其他原因"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            showCount
            autoFocus
          />
        </>
      )}
    </Modal>
  );
}

export default AcceptOrderModal;
