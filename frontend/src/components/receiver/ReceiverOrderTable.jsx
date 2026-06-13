import { Table, Tag, Button, Space, Badge, Tooltip } from 'antd';
import {
  MessageOutlined,
  InfoCircleOutlined,
  AuditOutlined,
  StarFilled,
  StarOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { ORDER_STATUS, ORDER_TYPES, TASK_TYPES, PRIORITIES } from '../../constants/enums';

// 查找任务类型标签
const getTaskTypeLabel = (id) => TASK_TYPES.find((t) => t.value === id)?.label || '-';
const getPriority = (v) => PRIORITIES.find((p) => p.value === v);

// 接单人订单列表表格
// props:
//   dataSource: 订单数组（已按接单人过滤）
//   onAccept(order)       - 点击"待接单"状态或操作列"处理"按钮，打开接单处理弹框
//   onSubmit(order)       - 提交验收（status 2->3，弹 SubmitAcceptanceModal）
//   onDetail(order)       - 详情
//   onChat(order)         - 沟通
//   onHistory(order)      - 审核历史（只读）
//   onEvaluate(order)     - 接单人对订单的评价（打开 ReceiverEvaluationModal）
//   onAssign(order)       - 组长分配（仅接单组长可见）
//   isGroupLeader: boolean - 是否为接单组长
function ReceiverOrderTable({
  dataSource,
  onAccept,
  onSubmit,
  onDetail,
  onChat,
  onHistory,
  onEvaluate,
  onAssign,
  isGroupLeader = false,
}) {
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
      width: 200,
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
      render: (t) => <Tag color={ORDER_TYPES[t].color}>{ORDER_TYPES[t].label}</Tag>,
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s, record) => {
        const st = ORDER_STATUS[s];
        // 待接单：Tag 可点击，唤起接单处理弹框
        if (s === 1) {
          return (
            <Tooltip title="点击处理接单">
              <Tag
                color={st.color}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => onAccept(record)}
              >
                {st.label}
              </Tag>
            </Tooltip>
          );
        }
        // 进行中：Tag 可点击，唤起提交验收弹框
        if (s === 2) {
          return (
            <Tooltip title="点击提交验收">
              <Tag
                color={st.color}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => onSubmit(record)}
              >
                {st.label}
              </Tag>
            </Tooltip>
          );
        }
        // 有审核记录：显示审核入口图标
        const hasAcceptanceHistory =
          Array.isArray(record.acceptance_history) && record.acceptance_history.length > 0;
        const hasPending =
          hasAcceptanceHistory &&
          record.acceptance_history.some((h) => h.review_result === 'pending');
        if (hasAcceptanceHistory) {
          return (
            <Space size={4}>
              <Tag color={st.color}>{st.label}</Tag>
              <Tooltip title={hasPending ? '等待下单人审核中' : '点击查看审核历史'}>
                <AuditOutlined
                  onClick={() => onHistory(record)}
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
        return <Tag color={st.color}>{st.label}</Tag>;
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
        // 已评价：显示综合得分（金色星 + 分数），悬停查看评语
        if (record.is_evaluated_by_receiver && record.evaluation_by_receiver) {
          return (
            <Tooltip title={record.evaluation_by_receiver.comment || '暂无评语'}>
              <span
                style={{ color: '#faad14', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                onClick={() => onEvaluate(record)}
              >
                <StarFilled style={{ marginRight: 4 }} />
                {Number(record.evaluation_by_receiver.overall_score).toFixed(2)}
              </span>
            </Tooltip>
          );
        }
        // 未评价：仅在订单完结（status=4）时可点击评价
        const canEvaluate = record.status === 4;
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
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const status = record.status;
        const isPendingReview = status === 3;
        // 组长可对status=0（待接单）的订单进行分配
        const canAssign = isGroupLeader && status === 0;

        return (
          <Space size={4} wrap>
            {canAssign && (
              <Button
                size="small"
                type="link"
                icon={<UserAddOutlined />}
                onClick={() => onAssign(record)}
              >
                分配
              </Button>
            )}
            {isPendingReview && (
              <Button
                size="small"
                type="link"
                icon={<AuditOutlined />}
                onClick={() => onHistory(record)}
              >
                查看审核
              </Button>
            )}
            <Button
              size="small"
              type="link"
              icon={<InfoCircleOutlined />}
              onClick={() => onDetail(record)}
            >
              详情
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      size="middle"
      columns={columns}
      dataSource={dataSource}
      scroll={{ x: 1500, y: 500 }}
      pagination={{
        defaultPageSize: 10,
        pageSizeOptions: [10, 20, 50],
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
      }}
    />
  );
}

export default ReceiverOrderTable;
