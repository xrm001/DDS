import { useEffect, useState } from 'react';
import { Table, Tag, Card, Input, Select, DatePicker, Row, Col, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const STATUS_LABEL = {
  0: '待派单',
  1: '待接单',
  2: '进行中',
  3: '待验收',
  4: '已完成',
  5: '已拒绝',
  6: '已取消',
};

const STATUS_COLOR = {
  0: 'default',
  1: 'orange',
  2: 'processing',
  3: 'gold',
  4: 'success',
  5: 'error',
  6: 'default',
};

// 操作日志页面（基于 order_status_history 表）
function OperationLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/logs', {
        params: { page, pageSize, ...filters }
      });
      if (res.data.success) {
        setLogs(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '变更前',
      dataIndex: 'from_status',
      key: 'from_status',
      width: 100,
      render: (v) => v !== null && v !== undefined
        ? <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>
        : <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: '变更后',
      dataIndex: 'to_status',
      key: 'to_status',
      width: 100,
      render: (v) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v]}</Tag>,
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return (
    <Card title="操作日志">
      {/* 筛选区 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Input
            placeholder="搜索订单编号"
            prefix={<SearchOutlined />}
            value={filters.order_no}
            onChange={(e) => setFilters({ ...filters, order_no: e.target.value })}
            onPressEnter={handleSearch}
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="变更后状态"
            allowClear
            style={{ width: '100%' }}
            value={filters.to_status}
            onChange={(v) => setFilters({ ...filters, to_status: v })}
          >
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Input
            placeholder="操作人姓名"
            value={filters.operator_name}
            onChange={(e) => setFilters({ ...filters, operator_name: e.target.value })}
            onPressEnter={handleSearch}
          />
        </Col>
        <Col span={7}>
          <RangePicker
            style={{ width: '100%' }}
            onChange={(dates) => {
              setFilters({
                ...filters,
                start_date: dates?.[0]?.format('YYYY-MM-DD'),
                end_date: dates?.[1]?.format('YYYY-MM-DD'),
              });
            }}
          />
        </Col>
        <Col span={4}>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />
    </Card>
  );
}

export default OperationLog;
