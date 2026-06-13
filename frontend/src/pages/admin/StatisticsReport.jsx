import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, DatePicker, Select, Spin, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 数据统计与报表页面（不含评分）
function StatisticsReport() {
  const [loading, setLoading] = useState(false);
  const [quickRange, setQuickRange] = useState('month');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [stats, setStats] = useState({
    ordererStats: [],
    receiverStats: [],
    taskTypeStats: [],
    departmentStats: [],
    dealStats: { total: 0, success: 0, amount: 0 },
    dailyTrend: { dates: [], ordered: [], completed: [] },
  });

  const fetchStatistics = useCallback(async (start, end) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/statistics', {
        params: {
          start_date: start.format('YYYY-MM-DD'),
          end_date: end.format('YYYY-MM-DD'),
        }
      });
      if (res.data.success && res.data.data) {
        setStats({
          ordererStats: res.data.data.ordererStats || [],
          receiverStats: res.data.data.receiverStats || [],
          taskTypeStats: res.data.data.taskTypeStats || [],
          departmentStats: res.data.data.departmentStats || [],
          dealStats: res.data.data.dealStats || { total: 0, success: 0, amount: 0 },
          dailyTrend: res.data.data.dailyTrend || { dates: [], ordered: [], completed: [] },
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics(dateRange[0], dateRange[1]);
  }, [dateRange, fetchStatistics]);

  const handleQuickRange = (v) => {
    setQuickRange(v);
    let range;
    if (v === 'week') range = [dayjs().subtract(7, 'day'), dayjs()];
    else if (v === 'month') range = [dayjs().subtract(30, 'day'), dayjs()];
    else if (v === 'quarter') range = [dayjs().subtract(90, 'day'), dayjs()];
    else range = [dayjs().subtract(30, 'day'), dayjs()];
    setDateRange(range);
  };

  // 下单人统计条形图
  const ordererBarOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['下单量', '完成量'] },
    grid: { left: 80, right: 40, top: 40, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: (stats.ordererStats || []).map(x => x.name).reverse(),
      axisTick: { show: false },
    },
    series: [
      {
        name: '下单量', type: 'bar',
        data: (stats.ordererStats || []).map(x => x.total).reverse(),
        itemStyle: { color: '#667eea', borderRadius: [0, 4, 4, 0] },
      },
      {
        name: '完成量', type: 'bar',
        data: (stats.ordererStats || []).map(x => x.completed).reverse(),
        itemStyle: { color: '#43e97b', borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  // 接单人统计条形图
  const receiverBarOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['接单量', '完成量'] },
    grid: { left: 80, right: 40, top: 40, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: (stats.receiverStats || []).map(x => x.name).reverse(),
      axisTick: { show: false },
    },
    series: [
      {
        name: '接单量', type: 'bar',
        data: (stats.receiverStats || []).map(x => x.total).reverse(),
        itemStyle: { color: '#667eea', borderRadius: [0, 4, 4, 0] },
      },
      {
        name: '完成量', type: 'bar',
        data: (stats.receiverStats || []).map(x => x.completed).reverse(),
        itemStyle: { color: '#43e97b', borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  // 任务类型分布
  const taskTypePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    color: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'],
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      label: { show: true, formatter: '{b}\n{c}单' },
      data: stats.taskTypeStats || [],
    }],
  };

  // 部门绩效排行
  const departmentBarOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['订单数'] },
    grid: { left: 100, right: 40, top: 40, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: (stats.departmentStats || []).map(x => x.name).reverse(),
      axisTick: { show: false },
    },
    series: [{
      name: '订单数', type: 'bar',
      data: (stats.departmentStats || []).map(x => x.total).reverse(),
      itemStyle: { color: '#667eea', borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right' },
    }],
  };

  // 订单趋势折线图
  const trendLineOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['下单量', '完成量'] },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: (stats.dailyTrend || {}).dates || [], boundaryGap: false },
    yAxis: { type: 'value', name: '单数' },
    series: [
      {
        name: '下单量', type: 'line', smooth: true,
        data: (stats.dailyTrend || {}).ordered || [],
        itemStyle: { color: '#667eea' },
        areaStyle: { color: 'rgba(102, 126, 234, 0.1)' }
      },
      {
        name: '完成量', type: 'line', smooth: true,
        data: (stats.dailyTrend || {}).completed || [],
        itemStyle: { color: '#43e97b' },
        areaStyle: { color: 'rgba(67, 233, 123, 0.1)' }
      },
    ],
  };

  const dealTotal = Number(stats.dealStats?.total || 0);
  const dealSuccess = Number(stats.dealStats?.success || 0);
  const dealAmount = Number(stats.dealStats?.amount || 0);

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: 8 }}>时间范围：</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  setDateRange([...dates]);
                  setQuickRange('');
                }
              }}
            />
          </Col>
          <Col>
            <Select value={quickRange || undefined} style={{ width: 120 }} onChange={handleQuickRange}
              placeholder="快捷选择">
              <Option value="week">近7天</Option>
              <Option value="month">近30天</Option>
              <Option value="quarter">近90天</Option>
            </Select>
          </Col>
          <Col>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              成交统计：成交率 {dealTotal > 0 ? ((dealSuccess / dealTotal) * 100).toFixed(1) : 0}% | 成交金额 ¥{dealAmount.toFixed(2)}
            </Card>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="下单人统计（下单量/完成量）" size="small">
              {(stats.ordererStats || []).length > 0
                ? <ReactECharts option={ordererBarOption} style={{ height: 300 }} />
                : <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="接单人统计（接单量/完成量）" size="small">
              {(stats.receiverStats || []).length > 0
                ? <ReactECharts option={receiverBarOption} style={{ height: 300 }} />
                : <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />}
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card title="任务类型分布" size="small">
              {(stats.taskTypeStats || []).length > 0
                ? <ReactECharts option={taskTypePieOption} style={{ height: 300 }} />
                : <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="部门绩效排行" size="small">
              {(stats.departmentStats || []).length > 0
                ? <ReactECharts option={departmentBarOption} style={{ height: 300 }} />
                : <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />}
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Card title="订单趋势分析" size="small">
              {((stats.dailyTrend || {}).dates || []).length > 0
                ? <ReactECharts option={trendLineOption} style={{ height: 300 }} />
                : <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default StatisticsReport;
