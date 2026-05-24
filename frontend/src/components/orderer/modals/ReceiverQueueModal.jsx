import { Modal, List, Avatar, Tag, Empty, Button, Space, message, Popconfirm } from 'antd';
import { UserOutlined, ClockCircleOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';

/**
 * 接单人排队数量弹窗
 * 显示当前接单人的已分配订单排队情况
 * 排序规则：
 * 1. cut_in_line_request.status=1 (插队已同意) 最前面，按 created_at 倒序
 * 2. cut_in_line_request=null 或 status!=1 的订单，按 orders.created_at 倒序
 */
function ReceiverQueueModal({ open, receiverId, receiverName, queueOrders, onCancel, onCutInLine, currentUserId }) {
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 计算统计
  const inProgressCount = queueOrders.filter(o => o.status === 2).length;
  const pendingCount = queueOrders.filter(o => o.status === 1).length;

  // 排序排队订单
  const sortedPendingOrders = useMemo(() => {
    const pendingOrders = queueOrders.filter(o => o.status === 1);
    
    return pendingOrders.sort((a, b) => {
      // 检查插队状态
      const aHasAgreed = a.cut_in_line_request?.status === 1;
      const bHasAgreed = b.cut_in_line_request?.status === 1;
      
      // 如果有插队已同意，排在前面
      if (aHasAgreed && !bHasAgreed) return -1;
      if (!aHasAgreed && bHasAgreed) return 1;
      
      // 都插队已同意或都没插队，按时间排序（越近越前）
      const aTime = aHasAgreed 
        ? dayjs(a.cut_in_line_request.created_at)
        : dayjs(a.created_at);
      const bTime = bHasAgreed
        ? dayjs(b.cut_in_line_request.created_at)
        : dayjs(b.created_at);
      
      return bTime.diff(aTime);
    });
  }, [queueOrders]);

  // 处理插队申请
  const handleCutInLine = async (targetOrder) => {
    setConfirmLoading(true);
    try {
      await onCutInLine?.(targetOrder.id);
      message.success('插队申请已发送');
    } catch (error) {
      message.error('插队申请失败');
    } finally {
      setConfirmLoading(false);
    }
  };

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
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <Tag color="processing" style={{ fontSize: 13, padding: '4px 12px' }}>
          进行中：{inProgressCount} 单
        </Tag>
        <Tag color="warning" style={{ fontSize: 13, padding: '4px 12px', marginLeft: 8 }}>
          排队中：{pendingCount} 单
        </Tag>
      </div>

      {sortedPendingOrders.length > 0 ? (
        <div>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            marginBottom: 8,
            color: '#595959'
          }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            排队中的订单（按优先级排序）：
          </div>
          <List
            dataSource={sortedPendingOrders}
            renderItem={(item, index) => {
              const isFirst = index === 0;
              const isMyOrder = item.creator_id === currentUserId;
              const hasCutInLineRequest = item.cut_in_line_request?.status === 0 || item.cut_in_line_request?.status === 3;
              
              return (
                <List.Item
                  style={{
                    padding: '12px 8px',
                    background: isFirst ? '#fffbe6' : (item.cut_in_line_request?.status === 1 ? '#f6ffed' : '#fafafa'),
                    borderRadius: 4,
                    marginBottom: 8,
                    border: isFirst ? '2px solid #ffd666' : (item.cut_in_line_request?.status === 1 ? '2px solid #b7eb8f' : '1px solid #f0f0f0'),
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size="small" 
                        style={{ 
                          backgroundColor: isFirst 
                            ? '#faad14' 
                            : (item.cut_in_line_request?.status === 1 ? '#52c41a' : '#d9d9d9')
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: isFirst ? 600 : 400 }}>
                          {item.task_name}
                        </span>
                        <Space size="small">
                          {item.cut_in_line_request?.status === 1 && (
                            <Tag color="success" style={{ fontSize: 11 }}>插队已同意</Tag>
                          )}
                          {isFirst && (
                            <Tag color="gold" style={{ fontSize: 11 }}>排第1位</Tag>
                          )}
                          {/* 如果是第一位且是当前用户的订单，显示插队申请按钮 */}
                          {isFirst && isMyOrder && !hasCutInLineRequest && (
                            <Popconfirm
                              title="申请插队"
                              description={`申请插队到 ${receiverName} 的队列最前面？`}
                              okText="确认"
                              cancelText="取消"
                              onConfirm={() => handleCutInLine(item)}
                              disabled={confirmLoading}
                            >
                              <Button
                                type="link"
                                size="small"
                                icon={<ArrowUpOutlined />}
                                loading={confirmLoading}
                                style={{ padding: 0, height: 'auto', color: '#fa8c16' }}
                              >
                                插队申请
                              </Button>
                            </Popconfirm>
                          )}
                        </Space>
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {item.creator_name || '未知'} | {item.order_no} | {item.created_at}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      ) : (
        <Empty description="暂无排队订单" style={{ margin: '20px 0' }} />
      )}
    </Modal>
  );
}

export default ReceiverQueueModal;
