import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  FileAddOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';

// 数据总览看板
function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    todayCompleted: 0,
    totalUsers: 0,
    statusDistribution: [],
    taskTypeDistribution: [],
    dailyTrend: { dates: [], ordered: [], completed: [] },
    receiverWorkload: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('加载看板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 订单状态分布饼图
  const statusPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}\n{c}' },
      data: stats.statusDistribution.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: item.color }
      }))
    }]
  };

  // 任务类型分布饼图
  const taskTypePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    color: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      label: { show: true, formatter: '{b}\n{c}' },
      data: stats.taskTypeDistribution
    }]
  };

  // 近30天趋势折线图
  const trendLineOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['下单量', '完成量'] },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: stats.dailyTrend.dates, boundaryGap: false },
    yAxis: { type: 'value', name: '单数' },
    series: [
      {
        name: '下单量',
        type: 'line',
        smooth: true,
        data: stats.dailyTrend.ordered,
        itemStyle: { color: '#667eea' },
        areaStyle: { color: 'rgba(102, 126, 234, 0.1)' }
      },
      {
        name: '完成量',
        type: 'line',
        smooth: true,
        data: stats.dailyTrend.completed,
        itemStyle: { color: '#43e97b' },
        areaStyle: { color: 'rgba(67, 233, 123, 0.1)' }
      },
    ],
  };

  // 接单人工作负载条形图
  const workloadBarOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 100, right: 30, top: 10, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: stats.receiverWorkload.map(x => x.name).reverse(),
      axisTick: { show: false },
    },
    series: [{
      name: '当前订单数',
      type: 'bar',
      data: stats.receiverWorkload.map(x => x.value).reverse(),
      itemStyle: { color: '#667eea', borderRadius: [0, 4, 4, 0] },
      barWidth: 20,
      label: { show: true, position: 'right' },
    }],
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日新增订单"
              value={stats.todayOrders}
              prefix={<FileAddOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理订单"
              value={stats.pendingOrders}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日完成订单"
              value={stats.todayCompleted}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统用户数"
              value={stats.totalUsers}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="订单状态分布" size="small">
            <ReactECharts option={statusPieOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="任务类型分布" size="small">
            <ReactECharts option={taskTypePieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="近30天订单趋势" size="small">
            <ReactECharts option={trendLineOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="接单人工作负载（当前订单数）" size="small">
            <ReactECharts option={workloadBarOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdminDashboard;
