import { Modal, List, Avatar, Button, Space, Tag, Empty, message } from 'antd';
import { UserOutlined, ArrowUpOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';

/**
 * 插队申请弹窗
 * 显示接单人当前进行中和排队中的订单，允许申请插队
 */
function CutInLineModal({ 
  open, 
  currentOrder, 
  receiverName,
  inProgressOrders, 
  queueOrders, 
  onOk, 
  onCancel 
}) {
  const [submitting, setSubmitting] = useState(false);

  // currentOrder: 当前申请插队的订单
  // inProgressOrders: 接单人正在制作的订单 [{ id, task_name, creator_name }]
  // queueOrders: 排队中的订单 [{ id, task_name, creator_name, position }]

  const handleCutInLine = () => {
    setSubmitting(true);
    // 模拟发送插队申请
    setTimeout(() => {
      message.success('插队申请已发送给第一位排队用户');
      setSubmitting(false);
      onOk?.();
    }, 1000);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpOutlined style={{ color: '#fa8c16' }} />
          <span>申请插队 - {currentOrder?.order_no}</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          icon={<ArrowUpOutlined />}
          loading={submitting}
          onClick={handleCutInLine}
          disabled={queueOrders.length === 0}
        >
          申请插队
        </Button>,
      ]}
    >
      {/* 当前订单信息 */}
      <div style={{ 
        padding: 12, 
        background: '#fff2e8', 
        borderRadius: 4, 
        marginBottom: 16,
        border: '1px solid #ffbb96'
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          您的订单：{currentOrder?.task_name}
        </div>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
          {currentOrder?.creator_name || '未知'} | 状态：排队中
        </div>
      </div>

      {/* 接单人正在制作的订单 */}
      {inProgressOrders.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            marginBottom: 8,
            color: '#1677ff'
          }}>
            <UserOutlined style={{ marginRight: 4 }} />
            {receiverName} 正在制作：
          </div>
          <List
            dataSource={inProgressOrders}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '10px 8px',
                  background: '#e6f7ff',
                  borderRadius: 4,
                  marginBottom: 8,
                  border: '1px solid #91d5ff',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                      <UserOutlined />
                    </Avatar>
                  }
                  title={
                    <span style={{ fontSize: 13 }}>{item.task_name}</span>
                  }
                  description={
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {item.creator_name}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 排队中的订单 */}
      <div>
        <div style={{ 
          fontSize: 13, 
          fontWeight: 600, 
          marginBottom: 8,
          color: '#595959'
        }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          排队中的订单：
        </div>
        {queueOrders.length > 0 ? (
          <List
            dataSource={queueOrders}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  padding: '10px 8px',
                  background: index === 0 ? '#fffbe6' : '#fafafa',
                  borderRadius: 4,
                  marginBottom: 8,
                  border: index === 0 ? '1px solid #ffd666' : '1px solid #f0f0f0',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      size="small" 
                      style={{ 
                        backgroundColor: index === 0 ? '#faad14' : '#d9d9d9' 
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: index === 0 ? 600 : 400 }}>
                        {item.task_name}
                      </span>
                      {index === 0 && (
                        <Tag color="gold" style={{ fontSize: 11 }}>排第1位</Tag>
                      )}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {item.creator_name}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无排队订单" style={{ margin: '20px 0' }} />
        )}
      </div>

      {/* 提示信息 */}
      <div style={{ 
        marginTop: 16, 
        padding: 12, 
        background: '#f6ffed', 
        borderRadius: 4,
        border: '1px solid #b7eb8f',
        fontSize: 12,
        color: '#52c41a'
      }}>
        提示：申请插队后，系统将向排在第一位的下单人发送通知。若对方同意，您的订单将移至排队首位。
      </div>
    </Modal>
  );
}

export default CutInLineModal;
