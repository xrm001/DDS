import ReactECharts from 'echarts-for-react';

// 任务类型分布饼图
export function TaskTypePie({ data }) {
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    color: ['#667eea', '#764ba2', '#13c2c2', '#faad14'],
    series: [
      {
        name: '任务类型',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{d}%' },
        data,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 320 }} />;
}

// 近6个月下单趋势折线图
export function MonthlyTrendLine({ months, values }) {
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: months, boundaryGap: false },
    yAxis: { type: 'value', name: '单数' },
    series: [
      {
        name: '下单数',
        type: 'line',
        smooth: true,
        data: values,
        itemStyle: { color: '#667eea' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102,126,234,0.4)' },
              { offset: 1, color: 'rgba(102,126,234,0.05)' },
            ],
          },
        },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
}

// 订单状态柱状图
export function StatusBar({ labels, values }) {
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', name: '单数' },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: values,
        itemStyle: {
          color: (params) => {
            const colors = ['#8c8c8c', '#faad14', '#1677ff', '#d48806', '#52c41a', '#ff4d4f', '#bfbfbf'];
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 28,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
}

// 按年汇总柱状图
export function YearlyBar({ years, values }) {
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: years },
    yAxis: { type: 'value', name: '单数' },
    series: [
      {
        name: '年度下单数',
        type: 'bar',
        data: values,
        itemStyle: { color: '#764ba2', borderRadius: [4, 4, 0, 0] },
        barWidth: 36,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
}

// 累计完成率仪表盘
export function CompleteRateGauge({ rate }) {
  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: { color: '#667eea' },
        progress: { show: true, width: 18 },
        pointer: { show: true },
        axisLine: { lineStyle: { width: 18 } },
        axisTick: { distance: -22 },
        splitLine: { distance: -22, length: 12 },
        axisLabel: { distance: -8, fontSize: 11 },
        anchor: { show: false },
        title: { offsetCenter: [0, '75%'], fontSize: 14 },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#667eea',
          fontSize: 30,
          fontWeight: 600,
          offsetCenter: [0, '45%'],
        },
        data: [{ value: rate, name: '累计完成率' }],
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 300 }} />;
}
