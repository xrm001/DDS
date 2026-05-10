import { Modal, Descriptions, Image, Space, Tag, Divider, Timeline, Empty, Button } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useMemo } from 'react';

// 审核结果对应的 UI 属性
const REVIEW_RESULT_META = {
  pending: { color: 'gold', label: '待审核', dotColor: '#faad14' },
  approved: { color: 'green', label: '已通过', dotColor: '#52c41a' },
  rejected: { color: 'red', label: '已驳回', dotColor: '#ff4d4f' },
};

// 渲染成果文件缩略图列表
function FileGallery({ files }) {
  if (!files || files.length === 0) return <span style={{ color: '#bfbfbf' }}>无</span>;
  return (
    <Image.PreviewGroup>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {files.map((f) => (
          <div key={f.id} style={{ textAlign: 'center' }}>
            <Image width={110} height={72} src={f.url} style={{ borderRadius: 4, objectFit: 'cover' }} />
            <div style={{ fontSize: 12, color: '#595959', marginTop: 2, maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {f.name}
            </div>
          </div>
        ))}
      </div>
    </Image.PreviewGroup>
  );
}

// 审核历史弹框（接单人视角，只读）
// 上半：若有 pending 项，展示当前等待客户审核的内容（只读）
// 下半：历史审核时间线
function ReviewHistoryModal({ open, order, onCancel }) {
  const history = useMemo(() => order?.acceptance_history || [], [order]);

  const pendingItem = useMemo(
    () => history.find((h) => h.review_result === 'pending') || null,
    [history]
  );

  const pastItems = useMemo(
    () =>
      history
        .filter((h) => h.review_result !== 'pending')
        .slice()
        .sort((a, b) => (b.reviewed_at || '').localeCompare(a.reviewed_at || '')),
    [history]
  );

  if (!order) return null;

  return (
    <Modal
      title={
        <Space>
          <span>审核历史</span>
          {pendingItem ? <Tag color="gold">等待客户审核</Tag> : <Tag color="default">仅查看历史</Tag>}
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>{order.order_no}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={760}
      destroyOnClose
      footer={<Button onClick={onCancel}>关闭</Button>}
    >
      {/* 当前待审核内容 */}
      {pendingItem && (
        <>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <Space>
              <ClockCircleOutlined style={{ color: '#faad14' }} />
              当前等待审核的内容
            </Space>
          </Divider>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
            <Descriptions.Item label="任务名称">{order.task_name}</Descriptions.Item>
            <Descriptions.Item label="提交人">{pendingItem.submitter}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{pendingItem.submitted_at}</Descriptions.Item>
            <Descriptions.Item label="提交说明" span={2}>
              {pendingItem.description}
            </Descriptions.Item>
            <Descriptions.Item label="提交的成果文件" span={2}>
              <FileGallery files={pendingItem.files} />
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      {/* 历史审核记录 */}
      <Divider orientation="left" style={{ marginTop: 24 }}>
        <Space>
          <ClockCircleOutlined />
          历史审核记录
          <Tag>{pastItems.length} 次</Tag>
        </Space>
      </Divider>

      {pastItems.length === 0 ? (
        <Empty description="暂无历史审核记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline
          mode="left"
          items={pastItems.map((item) => {
            const meta = REVIEW_RESULT_META[item.review_result];
            return {
              color: meta.dotColor,
              label: item.reviewed_at,
              children: (
                <div
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: 12,
                    background: '#fafafa',
                  }}
                >
                  <Space style={{ marginBottom: 6 }}>
                    <Tag color={meta.color}>{meta.label}</Tag>
                    <span style={{ color: '#595959', fontSize: 12 }}>
                      提交人：{item.submitter}
                    </span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      提交于 {item.submitted_at}
                    </span>
                  </Space>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#8c8c8c' }}>提交说明：</span>
                    {item.description}
                  </div>
                  {item.review_remark && (
                    <div style={{ fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: '#8c8c8c' }}>审核意见：</span>
                      <span style={{ color: item.review_result === 'rejected' ? '#ff4d4f' : '#52c41a' }}>
                        {item.review_remark}
                      </span>
                    </div>
                  )}
                  <FileGallery files={item.files} />
                </div>
              ),
            };
          })}
        />
      )}
    </Modal>
  );
}

export default ReviewHistoryModal;
