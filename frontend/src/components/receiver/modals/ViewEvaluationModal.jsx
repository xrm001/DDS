import { Modal, Row, Col, Rate, Statistic, Empty, Descriptions } from 'antd';
import { EVAL_DIMENSIONS } from '../../../constants/enums';

// 查看评价弹框（接单人视角，只读）
function ViewEvaluationModal({ open, order, onCancel }) {
  if (!order) return null;
  const ev = order.evaluation;

  return (
    <Modal
      title={`客户评价 - ${order.order_no}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={560}
      destroyOnClose
    >
      {!ev ? (
        <Empty description="该订单暂无评价" />
      ) : (
        <>
          <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
            {EVAL_DIMENSIONS.map((dim) => (
              <Descriptions.Item key={dim.key} label={dim.label}>
                <Rate disabled value={ev[dim.key] || 0} />
                <span style={{ marginLeft: 12, color: '#faad14' }}>
                  {ev[dim.key] || 0} 分
                </span>
              </Descriptions.Item>
            ))}
            <Descriptions.Item label="文字评价">
              {ev.comment || <span style={{ color: '#bfbfbf' }}>（无）</span>}
            </Descriptions.Item>
          </Descriptions>

          <Row justify="center" style={{ padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
            <Col>
              <Statistic
                title="综合得分"
                value={ev.overall_score}
                precision={2}
                valueStyle={{ color: '#667eea', fontSize: 28 }}
                suffix="/ 5.00"
              />
            </Col>
          </Row>
        </>
      )}
    </Modal>
  );
}

export default ViewEvaluationModal;
