import { useState, useEffect, useMemo } from 'react';
import { Modal, Rate, Input, Form, Row, Col, Statistic } from 'antd';
import { EVAL_DIMENSIONS } from '../../../constants/enums';

const { TextArea } = Input;

// 评价弹框：5 个维度 + 文字评价 + 综合得分自动计算
function EvaluationModal({ open, order, onCancel, onOk }) {
  const [scores, setScores] = useState({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setScores({});
      setComment('');
    }
  }, [open]);

  // 计算综合得分（5 项平均）
  const overallScore = useMemo(() => {
    const values = EVAL_DIMENSIONS.map((d) => scores[d.key] || 0).filter((v) => v > 0);
    if (values.length === 0) return 0;
    return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
  }, [scores]);

  const handleOk = () => {
    // 至少评分一项
    const hasScore = Object.values(scores).some((v) => v > 0);
    if (!hasScore) {
      Modal.warning({ content: '请至少对一项进行评分' });
      return;
    }
    onOk({
      orderId: order.id,
      ...scores,
      overall_score: overallScore,
      comment: comment.trim() || null,
    });
  };

  return (
    <Modal
      title={`评价订单 - ${order?.order_no || ''}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="提交评价"
      cancelText="取消"
      width={560}
      destroyOnClose
    >
      <Form layout="vertical" style={{ marginTop: 12 }}>
        {EVAL_DIMENSIONS.map((dim) => (
          <Form.Item key={dim.key} label={dim.label} style={{ marginBottom: 8 }}>
            <Rate
              value={scores[dim.key] || 0}
              onChange={(v) => setScores((prev) => ({ ...prev, [dim.key]: v }))}
            />
          </Form.Item>
        ))}

        <Form.Item label="文字评价" style={{ marginBottom: 8 }}>
          <TextArea
            rows={3}
            placeholder="请输入评价内容（可选）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Row justify="center" style={{ marginTop: 16, padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
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

export default EvaluationModal;
