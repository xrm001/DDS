import { Modal, Descriptions, Tag, Image, Empty, Tooltip } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import { TASK_TYPES, ORDER_STATUS, ORDER_TYPES } from '../../../constants/enums';

// 判断是否为图片
const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)(\?.*)?$/i.test(url);

// 下载文件
const handleDownload = (url, name) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = name || '下载';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 订单详情弹框（只读展示所有字段）
function DetailModal({ open, order, onCancel }) {
  if (!order) return null;

  const taskType = TASK_TYPES.find((t) => t.value === order.task_type_id);
  const status = ORDER_STATUS[order.status];
  const orderType = ORDER_TYPES[order.order_type];
  // 与表格一致：status=1 且已派单（有receiver_id）显示"排队中"
  const isQueuing = order.status === 1 && order.receiver_id;

  // 从 attachments 数据中解析所有文件（file_url 和 file_name 均为逗号分隔）
  const attachmentList = (order.attachments || []).flatMap(a => {
    const urls = (a.file_url || '').split(',').map(u => u.trim()).filter(u => u);
    const names = (a.file_name || '').split(',').map(n => n.trim()).filter(n => n);
    return urls.map((url, i) => ({ url, name: names[i] || url.split('/').pop() }));
  });

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
        <Descriptions.Item label="订单状态">
          {isQueuing ? <Tag color="warning">排队中</Tag> : (status ? <Tag color={status.color}>{status.label}</Tag> : `状态${order.status}`)}
        </Descriptions.Item>
        <Descriptions.Item label="下单时间">{order.created_at}</Descriptions.Item>
        <Descriptions.Item label="截止日期">{order.deadline || '-'}</Descriptions.Item>
        <Descriptions.Item label="结束时间">{order.completed_at || '-'}</Descriptions.Item>
        <Descriptions.Item label="下单人">{order.creator_name || '-'}</Descriptions.Item>
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
          {attachmentList.length > 0 ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Image.PreviewGroup>
                {attachmentList.map((item, idx) => (
                  <Tooltip key={idx} title={item.name}>
                    <div
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => handleDownload(item.url, item.name)}
                    >
                      {isImageUrl(item.url) ? (
                        <Image
                          width={120}
                          height={80}
                          src={item.url}
                          style={{ borderRadius: 4, objectFit: 'cover' }}
                          onClick={(e) => e.stopPropagation()} // 点击预览时不触发下载
                        />
                      ) : (
                        <div
                          style={{
                            width: 120,
                            height: 80,
                            borderRadius: 4,
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #d9d9d9',
                          }}
                        >
                          <FileOutlined style={{ fontSize: 32, color: '#8c8c8c' }} />
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 12,
                          color: '#8c8c8c',
                          marginTop: 4,
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </div>
                    </div>
                  </Tooltip>
                ))}
              </Image.PreviewGroup>
            </div>
          ) : (
            <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default DetailModal;
