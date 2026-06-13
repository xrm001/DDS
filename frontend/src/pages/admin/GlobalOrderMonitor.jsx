import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Input, Select, DatePicker, Row, Col, Badge, Modal, message } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 全局订单监控页面
function GlobalOrderMonitor() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  const STATUS_MAP = {
    0: { label: '待派单', color: 'default' },
    1: { label: '待接单', color: 'orange' },
    2: { label: '进行中', color: 'processing' },
    3: { label: '待验收', color: 'gold' },
    4: { label: '已完成', color: 'success' },
    5: { label: '已拒绝', color: 'error' },
    6: { label: '已取消', color: 'default' },
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/orders', {
        params: { page, pageSize, ...filters }
      });
      if (res.data.success) {
        setOrders(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  const handleExport = async () => {
    try {
      const res = await axios.get('/api/admin/orders/export', {
        params: filters,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleDetail = (record) => {
    setActiveOrder(record);
    setDetailOpen(true);
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 170,
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
      dataIndex: 'task_type_name',
      key: 'task_type_name',
      width: 110,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 100,
      render: (v) => (
        <Tag color={v === 2 ? 'red' : 'blue'}>
          {v === 2 ? '修改单' : '原始单'}
        </Tag>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 100,
      ellipsis: true,
    },
    {
      title: '下单人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 90,
    },
    {
      title: '接单人',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
      width: 90,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>待派单</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const st = STATUS_MAP[s];
        return <Tag color={st?.color}>{st?.label}</Tag>;
      },
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={<Space><Badge status="processing" />全局订单监控</Space>}
      extra={
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出Excel
        </Button>
      }
    >
      {/* 筛选区 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Input
            placeholder="搜索订单编号/任务名称"
            prefix={<SearchOutlined />}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={handleSearch}
          />
        </Col>
        <Col span={3}>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: '100%' }}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="订单类型"
            allowClear
            style={{ width: '100%' }}
            value={filters.order_type}
            onChange={(v) => setFilters({ ...filters, order_type: v })}
          >
            <Option value={1}>原始单</Option>
            <Option value={2}>修改单</Option>
          </Select>
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
        <Col span={5}>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        scroll={{ x: 1300 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title={`订单详情 - ${activeOrder?.order_no || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
      >
        {activeOrder && (
          <div>
            <Row gutter={[16, 12]}>
              <Col span={12}><strong>订单编号：</strong>{activeOrder.order_no}</Col>
              <Col span={12}><strong>任务名称：</strong>{activeOrder.task_name}</Col>
              <Col span={12}><strong>任务类型：</strong>{activeOrder.task_type_name}</Col>
              <Col span={12}><strong>订单类型：</strong>{activeOrder.order_type === 2 ? '修改单' : '原始单'}</Col>
              <Col span={12}><strong>客户：</strong>{activeOrder.customer_name}</Col>
              <Col span={12}><strong>客户地区：</strong>{activeOrder.customer_region}</Col>
              <Col span={12}><strong>下单人：</strong>{activeOrder.creator_name}</Col>
              <Col span={12}><strong>接单人：</strong>{activeOrder.receiver_name || '待派单'}</Col>
              <Col span={24}><strong>需求描述：</strong>{activeOrder.requirement_desc || '-'}</Col>
              <Col span={12}><strong>下单时间：</strong>{dayjs(activeOrder.created_at).format('YYYY-MM-DD HH:mm')}</Col>
              <Col span={12}><strong>截止时间：</strong>{activeOrder.deadline ? dayjs(activeOrder.deadline).format('YYYY-MM-DD HH:mm') : '-'}</Col>
              <Col span={12}><strong>完成时间：</strong>{activeOrder.completed_at ? dayjs(activeOrder.completed_at).format('YYYY-MM-DD HH:mm') : '-'}</Col>
            </Row>
          </div>
        )}
      </Modal>
    </Card>
  );
}

export default GlobalOrderMonitor;
