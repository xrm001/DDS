import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { InfoCircleOutlined, StarFilled } from '@ant-design/icons';
import {
  ORDER_STATUS,
  ORDER_TYPES,
  TASK_TYPES,
  PRIORITIES,
} from '../../constants/enums';
import { getUserName, getUserRole } from '../../mock/users';

const getTaskTypeLabel = (id) => TASK_TYPES.find((t) => t.value === id)?.label || '-';
const getPriority = (v) => PRIORITIES.find((p) => p.value === v);

// 负责人视角的订单列表（只读全字段展示）
// props: dataSource, onDetail(order)
function ManagerOrderTable({ dataSource, onDetail }) {
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
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 120,
      ellipsis: true,
    },
    {
      title: '国籍',
      dataIndex: 'customer_region',
      key: 'customer_region',
      width: 90,
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
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p) => {
        const pri = getPriority(p);
        return pri ? <Tag color={pri.color}>{pri.label}</Tag> : '-';
      },
    },
    {
      title: '下单人',
      key: 'creator',
      width: 120,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{getUserName(r.creator_id)}</span>
          <Tag color="blue" style={{ fontSize: 11, marginInlineEnd: 0 }}>
            {getUserRole(r.creator_id)}
          </Tag>
        </Space>
      ),
    },
    {
      title: '接单人',
      key: 'receiver',
      width: 120,
      render: (_, r) =>
        r.receiver_id ? (
          <Space direction="vertical" size={0}>
            <span>{r.receiver_name || getUserName(r.receiver_id)}</span>
            <Tag color="green" style={{ fontSize: 11, marginInlineEnd: 0 }}>
              {getUserRole(r.receiver_id)}
            </Tag>
          </Space>
        ) : (
          <span style={{ color: '#bfbfbf' }}>待派单</span>
        ),
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
      width: 110,
      render: (s) => {
        const st = ORDER_STATUS[s];
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
    {
      title: '下单评价',
      key: 'eval_creator',
      width: 100,
      align: 'center',
      render: (_, r) => {
        if (r.is_evaluated_by_creator && r.evaluation) {
          return (
            <Tooltip title={r.evaluation.comment || '暂无评语'}>
              <span style={{ color: '#faad14', fontWeight: 600 }}>
                <StarFilled style={{ marginRight: 4 }} />
                {Number(r.evaluation.overall_score).toFixed(2)}
              </span>
            </Tooltip>
          );
        }
        return <span style={{ color: '#bfbfbf' }}>—</span>;
      },
    },
    {
      title: '接单评价',
      key: 'eval_receiver',
      width: 100,
      align: 'center',
      render: (_, r) => {
        if (r.is_evaluated_by_receiver && r.evaluation_by_receiver) {
          return (
            <Tooltip title={r.evaluation_by_receiver.comment || '暂无评语'}>
              <span style={{ color: '#faad14', fontWeight: 600 }}>
                <StarFilled style={{ marginRight: 4 }} />
                {Number(r.evaluation_by_receiver.overall_score).toFixed(2)}
              </span>
            </Tooltip>
          );
        }
        return <span style={{ color: '#bfbfbf' }}>—</span>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<InfoCircleOutlined />}
          onClick={() => onDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      size="middle"
      columns={columns}
      dataSource={dataSource}
      scroll={{ x: 1900, y: 500 }}
      pagination={{
        defaultPageSize: 10,
        pageSizeOptions: [10, 20, 50],
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
      }}
    />
  );
}

export default ManagerOrderTable;
