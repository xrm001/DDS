import { Table, Tag, Button, Space, Badge, Tooltip, Popconfirm, Popover } from 'antd';
import { MessageOutlined, EditOutlined, RollbackOutlined, InfoCircleOutlined, FileSyncOutlined, StarOutlined, StarFilled, AuditOutlined, ArrowUpOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { ORDER_STATUS, ORDER_TYPES, TASK_TYPES, PRIORITIES } from '../../constants/enums';
import { useState } from 'react';
import ReceiverQueueModal from './modals/ReceiverQueueModal';
import CutInLineModal from './modals/CutInLineModal';

// 查找任务类型标签
const getTaskTypeLabel = (id) => TASK_TYPES.find((t) => t.value === id)?.label || '-';
const getPriority = (v) => PRIORITIES.find((p) => p.value === v);

// 订单列表表格
// props:
//   dataSource: 订单数组
//   onEdit, onRecall, onDetail, onModify, onEvaluate, onChat, onAcceptance, onCutInLine
//   allOrders: 所有订单数据（用于计算排队情况）
function OrderTable({ 
  dataSource, 
  onEdit, 
  onRecall, 
  onDetail, 
  onModify, 
  onEvaluate, 
  onChat, 
  onAcceptance,
  onCutInLine,
  allOrders = [] 
}) {
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [cutInLineModalOpen, setCutInLineModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReceiver, setSelectedReceiver] = useState(null);

  // 获取接单人的所有订单
  const getReceiverOrders = (receiverId) => {
    return allOrders.filter(o => o.receiver_id === receiverId);
  };
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
      fixed: 'left',
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '任务类型',
      dataIndex: 'task_type_id',
      key: 'task_type_id',
      width: 100,
      render: (id) => <Tag>{getTaskTypeLabel(id)}</Tag>,
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 100,
      render: (t) => (
        <Tag color={ORDER_TYPES[t].color}>{ORDER_TYPES[t].label}</Tag>
      ),
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
    {
      title: '结束时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 160,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (s, record) => {
        const st = ORDER_STATUS[s];
        const isQueuing = s === 1 && record.receiver_id; // 待接单且有接单人 = 排队中
        
        // 只要产生过审核记录（提交过待验收）就显示图标，可查看审核历史
        const hasAcceptanceHistory =
          Array.isArray(record.acceptance_history) && record.acceptance_history.length > 0;
        const hasPending =
          hasAcceptanceHistory &&
          record.acceptance_history.some((h) => h.review_result === 'pending');

        const statusTag = isQueuing ? (
          <Tag color="warning">排队中</Tag>
        ) : (
          <Tag color={st.color}>{st.label}</Tag>
        );

        if (hasAcceptanceHistory) {
          return (
            <Space size={4}>
              {statusTag}
              <Tooltip title={hasPending ? '有待审核内容，点击处理' : '点击查看审核历史'}>
                <AuditOutlined
                  onClick={() => onAcceptance(record)}
                  style={{
                    color: hasPending ? '#faad14' : '#1677ff',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 2,
                  }}
                />
              </Tooltip>
            </Space>
          );
        }

        // 排队中且不是自己的订单，显示插队按钮
        if (isQueuing && record.creator_id !== 2) { // 假设当前用户id为2
          return (
            <Space size={4}>
              {statusTag}
              <Button
                type="link"
                size="small"
                icon={<ArrowUpOutlined />}
                style={{ padding: 0, height: 'auto', color: '#fa8c16' }}
                onClick={() => {
                  setSelectedOrder(record);
                  setCutInLineModalOpen(true);
                }}
              >
                插队
              </Button>
            </Space>
          );
        }

        return statusTag;
      },
    },
    {
      title: '接单人',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
      width: 120,
      render: (v, record) => {
        if (!v) return <span style={{ color: '#bfbfbf' }}>待派单</span>;
        
        const receiverOrders = getReceiverOrders(record.receiver_id);
        
        return (
          <Popover
            content={
              <div style={{ width: 200 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{v} 的订单</div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  <div>进行中：{receiverOrders.filter(o => o.status === 2).length} 单</div>
                  <div style={{ marginTop: 4 }}>排队中：{receiverOrders.filter(o => o.status === 1).length} 单</div>
                </div>
                <Button
                  type="link"
                  size="small"
                  style={{ marginTop: 8, padding: 0 }}
                  onClick={() => {
                    setSelectedReceiver({
                      name: v,
                      id: record.receiver_id,
                      orders: receiverOrders
                    });
                    setQueueModalOpen(true);
                  }}
                >
                  查看详情
                </Button>
              </div>
            }
            title={null}
            trigger="hover"
          >
            <span style={{ cursor: 'pointer', color: '#1677ff' }}>{v}</span>
          </Popover>
        );
      },
    },
    {
      title: '沟通消息',
      key: 'messages',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.unread_messages} size="small">
          <Button
            type="text"
            icon={<MessageOutlined />}
            size="small"
            onClick={() => onChat(record)}
          >
            消息
          </Button>
        </Badge>
      ),
    },
    {
      title: '评价',
      key: 'evaluation',
      width: 120,
      align: 'center',
      render: (_, record) => {
        // 已评价：显示综合得分
        if (record.is_evaluated_by_creator && record.evaluation) {
          return (
            <Tooltip title={record.evaluation.comment || '暂无评价内容'}>
              <span style={{ color: '#faad14', fontWeight: 600, fontSize: 15 }}>
                <StarFilled style={{ marginRight: 4 }} />
                {Number(record.evaluation.overall_score).toFixed(2)}
              </span>
            </Tooltip>
          );
        }
        // 未评价：点击可评价（仅在待验收/已完成状态下可点）
        const canEvaluate = record.status === 3 || record.status === 4;
        return (
          <Button
            type="link"
            size="small"
            icon={<StarOutlined />}
            disabled={!canEvaluate}
            onClick={() => canEvaluate && onEvaluate(record)}
          >
            未评价
          </Button>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_, record) => {
        // 已完成/已取消/已拒绝：只能查看详情与修改单
        const isClosed = record.status === 4 || record.status === 5 || record.status === 6;
        return (
          <Space size={4} wrap>
            <Button
              size="small"
              type="link"
              icon={<EditOutlined />}
              disabled={isClosed}
              onClick={() => onEdit(record)}
            >
              修改
            </Button>
            <Popconfirm
              title="确认撤回该订单？"
              description="撤回后订单将标记为已取消"
              okText="撤回"
              cancelText="取消"
              onConfirm={() => onRecall(record)}
              disabled={isClosed}
            >
              <Button
                size="small"
                type="link"
                icon={<RollbackOutlined />}
                disabled={isClosed}
                danger
              >
                撤回
              </Button>
            </Popconfirm>
            <Button
              size="small"
              type="link"
              icon={<InfoCircleOutlined />}
              onClick={() => onDetail(record)}
            >
              详情
            </Button>
            <Button
              size="small"
              type="link"
              icon={<FileSyncOutlined />}
              onClick={() => onModify(record)}
            >
              修改单
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={dataSource}
        scroll={{ x: 1700, y: 420 }}
        pagination={{
          defaultPageSize: 10,
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      
      {/* 接单人排队详情弹窗 */}
      {selectedReceiver && (
        <ReceiverQueueModal
          open={queueModalOpen}
          receiverName={selectedReceiver.name}
          queueOrders={selectedReceiver.orders}
          onCancel={() => setQueueModalOpen(false)}
        />
      )}
      
      {/* 插队申请弹窗 */}
      {selectedOrder && (
        <CutInLineModal
          open={cutInLineModalOpen}
          currentOrder={selectedOrder}
          receiverName={selectedOrder.receiver_name}
          inProgressOrders={getReceiverOrders(selectedOrder.receiver_id).filter(o => o.status === 2)}
          queueOrders={getReceiverOrders(selectedOrder.receiver_id).filter(o => o.status === 1 && o.id !== selectedOrder.id)}
          onCancel={() => setCutInLineModalOpen(false)}
          onOk={() => {
            setCutInLineModalOpen(false);
            onCutInLine?.(selectedOrder);
          }}
        />
      )}
    </>
  );
}

export default OrderTable;
