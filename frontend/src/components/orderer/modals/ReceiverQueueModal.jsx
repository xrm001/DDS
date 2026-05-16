import { Modal, List, Avatar, Tag, Empty } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

/**
 * 接单人排队数量弹窗
 * 显示当前接单人的已分配订单排队情况
 */
function ReceiverQueueModal({ open, receiverName, queueOrders, onCancel }) {
  // queueOrders: [{ id, order_no, task_name, creator_name, status, created_at }]
  
  const pendingOrders = queueOrders.filter(o => o.status === 1); // 待接单（排队中）
  const inProgressOrders = queueOrders.filter(o => o.status === 2); // 进行中

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#667eea' }} />
          <span>{receiverName} - 订单排队情况</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <Tag color="processing" style={{ fontSize: 13, padding: '4px 12px' }}>
          进行中：{inProgressOrders.length} 单
        </Tag>
        <Tag color="warning" style={{ fontSize: 13, padding: '4px 12px', marginLeft: 8 }}>
          排队中：{pendingOrders.length} 单
        </Tag>
      </div>

      {pendingOrders.length > 0 ? (
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
          <List
            dataSource={pendingOrders}
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
                      {item.creator_name || '未知'} | {item.order_no}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      ) : (
        <Empty description="暂无排队订单" style={{ margin: '20px 0' }} />
      )}
    </Modal>
  );
}

export default ReceiverQueueModal;
