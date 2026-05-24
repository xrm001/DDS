import { Modal, Descriptions, Input, Button, Space, message } from 'antd';
import { useState, useEffect } from 'react';

const { TextArea } = Input;

// 插队处理弹窗（接单后处理插队申请）
function CutInLineProcessModal({ open, cutInLineData, onCancel, onAgree, onReject }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  if (!cutInLineData) return null;

  const handleAgree = () => {
    if (onAgree) {
      onAgree(cutInLineData.id);
    }
    message.success('已同意插队申请');
  };

  const handleReject = () => {
    if (!reason.trim()) {
      message.warning('请填写拒绝原因');
      return;
    }
    if (onReject) {
      onReject(cutInLineData.id, reason.trim());
    }
    message.info('已拒绝插队申请');
  };

  return (
    <Modal
      title="处理插队申请"
      open={open}
      onCancel={onCancel}
      width={600}
      footer={null}
      destroyOnClose
    >
      <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="申请ID">{cutInLineData.id}</Descriptions.Item>
        <Descriptions.Item label="插队人">{cutInLineData.creator_name}</Descriptions.Item>
        <Descriptions.Item label="插队订单">{cutInLineData.order_no}</Descriptions.Item>
        <Descriptions.Item label="被插队订单">{cutInLineData.target_order_no}</Descriptions.Item>
        <Descriptions.Item label="接单人">{cutInLineData.receiver_name}</Descriptions.Item>
        <Descriptions.Item label="申请时间">{cutInLineData.created_at}</Descriptions.Item>
      </Descriptions>

      <div style={{ marginBottom: 6, color: '#262626', fontWeight: 500 }}>
        拒绝原因
      </div>
      <TextArea
        rows={4}
        placeholder="请输入拒绝原因（选填）"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        showCount
        style={{ marginBottom: 16 }}
      />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button danger onClick={handleReject}>
            拒绝
          </Button>
          <Button type="primary" onClick={handleAgree}>
            接受
          </Button>
        </Space>
      </div>
    </Modal>
  );
}

export default CutInLineProcessModal;
