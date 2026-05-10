import { Modal, Descriptions, Image, Button, Space, Input, Tag, Divider, Timeline, Empty, message } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ClockCircleOutlined } from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';

const { TextArea } = Input;

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

// 审核弹框：
// 1. 如果订单有 pending 审核项（status === 3） → 上半部分展示当前待验收内容+驳回/通过操作
// 2. 下半部分展示所有历史记录（时间线）
// props:
//   open, order, onCancel
//   onReject(order, remark) 驳回 -> 订单状态置为 进行中(2)
//   onApprove(order, remark) 通过 -> 订单状态置为 已完成(4)
function AcceptanceModal({ open, order, onCancel, onReject, onApprove }) {
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (open) setRemark('');
  }, [open]);

  const history = useMemo(() => order?.acceptance_history || [], [order]);

  // 当前待审核项（pending 状态最新的一条）
  const pendingItem = useMemo(
    () => history.find((h) => h.review_result === 'pending') || null,
    [history]
  );

  // 已结束的历史审核记录（按时间倒序）
  const pastItems = useMemo(
    () =>
      history
        .filter((h) => h.review_result !== 'pending')
        .slice()
        .sort((a, b) => (b.reviewed_at || '').localeCompare(a.reviewed_at || '')),
    [history]
  );

  if (!order) return null;

  const handleReject = () => {
    if (!remark.trim()) {
      message.warning('驳回时请填写驳回意见');
      return;
    }
    onReject(order, remark.trim());
  };

  const handleApprove = () => {
    onApprove(order, remark.trim());
  };

  // 仅在有待审核项时显示操作按钮
  const footer = pendingItem ? (
    <Space>
      <Button onClick={onCancel}>取消</Button>
      <Button danger icon={<CloseCircleFilled />} onClick={handleReject}>
        驳回（退回进行中）
      </Button>
      <Button type="primary" icon={<CheckCircleFilled />} onClick={handleApprove}>
        通过（订单完结）
      </Button>
    </Space>
  ) : (
    <Button onClick={onCancel}>关闭</Button>
  );

  return (
    <Modal
      title={
        <Space>
          <span>订单审核</span>
          {pendingItem ? <Tag color="gold">有待审核</Tag> : <Tag color="default">仅查看历史</Tag>}
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>{order.order_no}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      width={760}
      destroyOnClose
      footer={footer}
    >
      {/* 当前待验收内容 */}
      {pendingItem && (
        <>
          <Divider orientation="left" style={{ marginTop: 0 }}>
            <Space>
              <ClockCircleOutlined style={{ color: '#faad14' }} />
              当前待验收内容
            </Space>
          </Divider>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
            <Descriptions.Item label="任务名称">{order.task_name}</Descriptions.Item>
            <Descriptions.Item label="接单人">{pendingItem.submitter}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{pendingItem.submitted_at}</Descriptions.Item>
            <Descriptions.Item label="接单人说明" span={2}>
              {pendingItem.description}
            </Descriptions.Item>
            <Descriptions.Item label="提交的成果文件" span={2}>
              <FileGallery files={pendingItem.files} />
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 12, marginBottom: 6, color: '#595959', fontSize: 13 }}>
            验收意见 <span style={{ color: '#ff4d4f' }}>（驳回时必填）</span>
          </div>
          <TextArea
            rows={3}
            placeholder="请输入验收意见，例如需要修改的具体内容"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            maxLength={500}
            showCount
          />
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
          items={pastItems.map((item, idx) => {
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
                    marginBottom: idx === pastItems.length - 1 ? 0 : 0,
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
                    <span style={{ color: '#8c8c8c' }}>接单人说明：</span>
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

export default AcceptanceModal;
