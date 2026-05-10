import { Tabs, Row, Col, Card, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  AuditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  TaskTypePie,
  MonthlyTrendLine,
  StatusBar,
  YearlyBar,
  CompleteRateGauge,
} from '../../components/orderer/charts';
import { DASHBOARD_DATA } from '../../mock/dashboard';

// 工作看板（当前 / 月度 / 历史）
function Dashboard() {
  const { current, monthly, historical } = DASHBOARD_DATA;

  // 当前看板
  const CurrentPane = (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待派单"
              value={current.stats.pending_dispatch}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={current.stats.in_progress}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待验收"
              value={current.stats.pending_acceptance}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={current.stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="任务类型分布">
        <TaskTypePie data={current.taskTypeDist} />
      </Card>
    </>
  );

  // 月度看板
  const MonthlyPane = (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="近 6 个月下单趋势">
          <MonthlyTrendLine months={monthly.trend.months} values={monthly.trend.values} />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="本月订单状态分布">
          <StatusBar labels={monthly.statusDist.labels} values={monthly.statusDist.values} />
        </Card>
      </Col>
    </Row>
  );

  // 历史看板
  const HistoricalPane = (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="按年汇总下单数">
          <YearlyBar years={historical.yearly.years} values={historical.yearly.values} />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="累计完成率">
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
      title={<span style={{ fontSize: 16, fontWeight: 600 }}>工作看板</span>}
      styles={{ body: { padding: 16 } }}
    >
      <Tabs defaultActiveKey="current" items={items} size="large" />
    </Card>
  );
}

export default Dashboard;
