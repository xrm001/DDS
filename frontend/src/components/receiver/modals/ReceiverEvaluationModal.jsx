import { useState, useEffect, useMemo } from 'react';
import { Modal, Rate, Input, Form, Row, Col, Statistic, Descriptions, Tag, message } from 'antd';
import { RECEIVER_EVAL_DIMENSIONS, ORDER_TYPES, TASK_TYPES } from '../../../constants/enums';

const { TextArea } = Input;

// 接单人评价弹框：4 个维度 + 文字评价 + 综合得分自动计算
// 维度：需求描述 / 附件提供 / 沟通 / 确认及时性
// props:
//   open, order, onCancel
//   onOk(payload) payload: { orderId, scores..., overall_score, comment }
function ReceiverEvaluationModal({ open, order, onCancel, onOk }) {
  // 仅"已提交评价"时为 true，用于控制只读展示模式
  const existing = order?.is_evaluated_by_receiver && order?.evaluation_by_receiver;
  const readonly = !!existing;

  const [scores, setScores] = useState({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      if (existing) {
        // 已有评价：回显只读
        const s = {};
        RECEIVER_EVAL_DIMENSIONS.forEach((d) => {
          s[d.key] = order.evaluation_by_receiver[d.key] || 0;
        });
        setScores(s);
        setComment(order.evaluation_by_receiver.comment || '');
      } else {
        setScores({});
        setComment('');
      }
    }
  }, [open, existing, order]);

  // 计算综合得分（4 项平均）
  const overallScore = useMemo(() => {
    const values = RECEIVER_EVAL_DIMENSIONS.map((d) => scores[d.key] || 0).filter((v) => v > 0);
    if (values.length === 0) return 0;
    return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
  }, [scores]);

  if (!order) return null;

  const taskType = TASK_TYPES.find((t) => t.value === order.task_type_id);
  const orderType = ORDER_TYPES[order.order_type];

  const handleOk = () => {
    if (readonly) {
      onCancel();
      return;
    }
    // 4 项必须全部评分
    const missing = RECEIVER_EVAL_DIMENSIONS.filter((d) => !scores[d.key]);
    if (missing.length > 0) {
      message.warning(`请对「${missing.map((d) => d.label).join(' / ')}」评分`);
      return;
    }
    const payload = {
      orderId: order.id,
      ...RECEIVER_EVAL_DIMENSIONS.reduce((acc, d) => {
        acc[d.key] = scores[d.key] || 0;
        return acc;
      }, {}),
      overall_score: overallScore,
      comment: comment.trim() || null,
    };
    onOk(payload);
  };

  return (
    <Modal
      title={
        <span>
          {readonly ? '查看我的评价' : '评价订单'} - {order.order_no}
        </span>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={readonly ? '关闭' : '提交评价'}
      cancelText="取消"
      cancelButtonProps={{ style: { display: readonly ? 'none' : undefined } }}
      width={600}
      destroyOnClose
    >
      {/* 订单摘要 */}
      <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
        <Descriptions.Item label="订单类型">
          <Tag color={orderType.color}>{orderType.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="任务名称">{order.task_name}</Descriptions.Item>
        <Descriptions.Item label="任务类型">{taskType?.label || '-'}</Descriptions.Item>
        <Descriptions.Item label="客户">{order.customer_name}</Descriptions.Item>
        <Descriptions.Item label="完成时间">{order.completed_at || '-'}</Descriptions.Item>
      </Descriptions>

      <Form layout="vertical" style={{ marginTop: 4 }}>
        {RECEIVER_EVAL_DIMENSIONS.map((dim) => (
          <Form.Item
            key={dim.key}
            label={dim.label}
            style={{ marginBottom: 8 }}
            required={!readonly}
          >
            <Rate
              disabled={readonly}
              value={scores[dim.key] || 0}
              onChange={(v) => setScores((prev) => ({ ...prev, [dim.key]: v }))}
            />
            <span style={{ marginLeft: 12, color: '#faad14' }}>
              {scores[dim.key] || 0} 分
            </span>
          </Form.Item>
        ))}

        <Form.Item label="文字评价" style={{ marginBottom: 8 }}>
          <TextArea
            rows={3}
            placeholder={readonly ? '' : '请输入评价内容（可选）'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            showCount={!readonly}
            disabled={readonly}
          />
        </Form.Item>

        <Row
          justify="center"
          style={{ marginTop: 12, padding: 12, background: '#f5f7fa', borderRadius: 6 }}
        >
          <Col>
            <Statistic
              title="综合得分"
              value={overallScore}
              precision={2}
              valueStyle={{ color: '#667eea', fontSize: 28 }}
              suffix="/ 5.00"
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default ReceiverEvaluationModal;
