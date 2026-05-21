import { Tabs, Row, Col, Card, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  FileAddOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import {
  TaskTypePie,
  StatusBar,
  YearlyBar,
  CompleteRateGauge,
} from '../../components/orderer/charts';
import { MANAGER_DASHBOARD_DATA } from '../../mock/managerDashboard';

// 下单 vs 接单 双折线
function DualTrendLine({ months, ordered, received }) {
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['下单量', '接单量'] },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: months, boundaryGap: false },
    yAxis: { type: 'value', name: '单数' },
    series: [
      {
        name: '下单量',
        type: 'line',
        smooth: true,
        data: ordered,
        itemStyle: { color: '#667eea' },
      },
      {
        name: '接单量',
        type: 'line',
        smooth: true,
        data: received,
        itemStyle: { color: '#13c2c2' },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
}

// 人员排行榜（横向条形图）
function RankBar({ data, color = '#667eea', title }) {
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 30, top: 10, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: data.map((x) => x.name).reverse(),
      axisTick: { show: false },
    },
    series: [
      {
        name: title,
        type: 'bar',
        data: data.map((x) => x.value).reverse(),
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        barWidth: 18,
        label: { show: true, position: 'right' },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 260 }} />;
}

// 负责人数据看板：全公司所有下单人/接单人订单统计（当前/月度/历史）
function ManagerDashboard() {
  const { current, monthly, historical } = MANAGER_DASHBOARD_DATA;

  // 当前
  const CurrentPane = (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="待派单"
              value={current.stats.pending_dispatch}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="进行中"
              value={current.stats.in_progress}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待验收"
              value={current.stats.pending_acceptance}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="本月已完成"
              value={current.stats.completed_this_month}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="累计下单"
              value={current.stats.total_ordered}
              prefix={<FileAddOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="累计接单"
              value={current.stats.total_received}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="任务类型分布">
            <TaskTypePie data={current.taskTypeDist} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="下单人下单量排行">
            <RankBar data={current.ordererRank} color="#667eea" title="下单量" />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="接单人接单量排行">
            <RankBar data={current.receiverRank} color="#13c2c2" title="接单量" />
          </Card>
        </Col>
      </Row>
    </>
  );

  // 月度
  const MonthlyPane = (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="近 6 个月下单 vs 接单 趋势">
          <DualTrendLine
            months={monthly.trend.months}
            ordered={monthly.trend.ordered}
            received={monthly.trend.received}
          />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="本月订单状态分布">
          <StatusBar labels={monthly.statusDist.labels} values={monthly.statusDist.values} />
        </Card>
      </Col>
    </Row>
  );

  // 历史
  const HistoricalPane = (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="按年汇总全公司订单量">
          <YearlyBar years={historical.yearly.years} values={historical.yearly.values} />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="全公司累计完成率">
          <CompleteRateGauge rate={historical.completeRate} />
        </Card>
      </Col>
    </Row>
  );

  const items = [
    { key: 'current', label: '当前', children: CurrentPane },
    { key: 'monthly', label: '月度', children: MonthlyPane },
    { key: 'historical', label: '历史', children: HistoricalPane },
  ];

  return (
    <Card
      styles={{ body: { padding: 16 } }}
    >
      <Tabs defaultActiveKey="current" items={items} size="large" />
    </Card>
  );
}

export default ManagerDashboard;
