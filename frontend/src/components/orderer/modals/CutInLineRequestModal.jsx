import { Modal, Descriptions, Button, Space, message } from 'antd';
import { ArrowUpOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';

/**
 * 插队申请通知弹窗
 * 当其他用户申请插队时，当前第一位排队用户会收到此通知
 */
function CutInLineRequestModal({ 
  open, 
  requestInfo, 
  onAgree, 
  onReject,
  onCancel 
}) {
  const [loading, setLoading] = useState(null); // 'agree' | 'reject' | null

  // requestInfo: { 
  //   id, 
  //   requester_name, // 申请插队的下单人
  //   requester_order_no, // 申请插队的订单编号
  //   requester_task_name, // 申请插队的任务名称
  //   current_position: 1, // 当前排队位置
  //   created_at 
  // }

  const handleAgree = () => {
    setLoading('agree');
    setTimeout(() => {
      message.success('已同意插队申请');
      setLoading(null);
      onAgree?.();
    }, 800);
  };

  const handleReject = () => {
    setLoading('reject');
    setTimeout(() => {
      message.info('已拒绝插队申请');
      setLoading(null);
      onReject?.();
    }, 800);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpOutlined style={{ color: '#fa8c16' }} />
          <span>插队申请通知</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button 
          key="reject" 
          danger
          icon={<ArrowUpOutlined />}
          loading={loading === 'reject'}
          onClick={handleReject}
        >
          拒绝
        </Button>,
        <Button
          key="agree"
          type="primary"
          icon={<ArrowUpOutlined />}
          loading={loading === 'agree'}
          onClick={handleAgree}
        >
          同意
        </Button>,
      ]}
      width={500}
    >
      <div style={{ 
        padding: 12, 
        background: '#fff7e6', 
        borderRadius: 4, 
        marginBottom: 16,
        border: '1px solid #ffd591'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {requestInfo?.requester_name} 申请插队
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
          申请时间：{requestInfo?.created_at}
        </div>
      </div>

      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="申请插队订单">
          {requestInfo?.requester_order_no}
        </Descriptions.Item>
        <Descriptions.Item label="任务名称">
          {requestInfo?.requester_task_name}
        </Descriptions.Item>
        <Descriptions.Item label="您的排队位置">
          第 {requestInfo?.current_position} 位
        </Descriptions.Item>
      </Descriptions>

      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: '#f0f2f5', 
        borderRadius: 4,
        fontSize: 12,
        color: '#595959'
      }}>
        <strong>说明：</strong>
        {requestInfo?.requester_name} 认为其订单非常紧急，申请优先制作。
        若您同意，您的订单将后移一位；若拒绝，对方订单将保持原排队位置。
      </div>
    </Modal>
  );
}

export default CutInLineRequestModal;
