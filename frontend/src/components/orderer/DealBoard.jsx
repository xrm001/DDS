import { Card, Row, Col, Tag, Space, Tooltip, Empty, Badge } from 'antd';
import { ClockCircleOutlined, SyncOutlined, DollarOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { DEAL_STATUS } from '../../constants/enums';

// 看板组件：按成交状态分组显示订单
// 特点：
// 1. 按"待确认/谈单中/已成交/未成交"分组
// 2. 超过3天未更新的订单高亮显示并标记
// 3. 显示成交金额（接单人KPI统计）
function DealBoard({ orders = [], onDealClick }) {
  // 按成交状态分组
  const groupedOrders = {
    7: [], // 待确认
    8: [], // 谈单中
    9: [], // 已成交
    10: [], // 未成交
  };

  // 筛选已完成或已拒绝的订单
  const completedOrders = orders.filter(
    (order) => order.status === 4 || order.status === 5
  );

  // 分配到对应分组
  completedOrders.forEach((order) => {
    const dealStatus = order.deal_status || 7; // 默认待确认
    if (groupedOrders[dealStatus]) {
      groupedOrders[dealStatus].push(order);
    }
  });

  // 计算是否超期（超过3天未更新）
  const isOverdue = (order) => {
    const updatedAt = order.deal_updated_at || order.completed_at;
    if (!updatedAt) return false;
    return dayjs().diff(dayjs(updatedAt), 'day') > 3;
  };

  // 渲染订单卡片
  const renderOrderCard = (order) => {
    const overdue = isOverdue(order);
    const currency = order.currency === 'USD' ? '$' : '¥';
    
    return (
      <Card
        key={order.id}
        size="small"
        hoverable
        style={{
          marginBottom: 12,
          border: overdue ? '2px solid #ff4d4f' : '1px solid #f0f0f0',
          background: overdue ? '#fff2f0' : '#fff',
          cursor: 'pointer',
        }}
        onClick={() => onDealClick && onDealClick(order)}
      >
        <div style={{ marginBottom: 8 }}>
          <Space>
            <Tag color="blue">{order.order_no}</Tag>
            {overdue && (
              <Tooltip title="已超过3天未更新">
                <Badge dot color="red">
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                </Badge>
              </Tooltip>
            )}
          </Space>
        </div>
        
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#262626' }}>
          {order.task_name}
        </div>
        
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
          客户：{order.customer_name}
        </div>
        
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#595959' }}>成交状态：</span>
            <Tag color={DEAL_STATUS[order.deal_status || 7].color}>
              {DEAL_STATUS[order.deal_status || 7].label}
            </Tag>
          </div>
          
          {order.deal_amount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#595959' }}>成交金额：</span>
              <Space size={4}>
                <DollarOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#52c41a' }}>
                  {currency}{order.deal_amount.toFixed(2)}
                </span>
              </Space>
            </div>
          )}
          
          {(order.deal_updated_at || order.completed_at) && (
            <div style={{ fontSize: 11, color: overdue ? '#ff4d4f' : '#bfbfbf' }}>
              更新时间：{order.deal_updated_at || order.completed_at}
              {overdue && ' (已超期)'}
            </div>
          )}
        </Space>
      </Card>
    );
  };

  // 渲染分组
  const renderGroup = (status, title, icon, color) => {
    const groupOrders = groupedOrders[status];
    
    return (
      <Col span={6} key={status}>
        <Card
          title={
            <Space>
              {icon}
              <span>{title}</span>
              <Badge count={groupOrders.length} style={{ backgroundColor: color }} />
            </Space>
          }
          size="small"
          style={{ height: '100%' }}
        >
          {groupOrders.length === 0 ? (
            <Empty description="暂无订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {groupOrders.map(renderOrderCard)}
            </div>
          )}
        </Card>
      </Col>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]}>
        {renderGroup(7, '待确认', <ClockCircleOutlined />, '#d9d9d9')}
        {renderGroup(8, '谈单中', <SyncOutlined spin />, '#1677ff')}
        {renderGroup(9, '已成交', <DollarOutlined />, '#52c41a')}
        {renderGroup(10, '未成交', <WarningOutlined />, '#ff4d4f')}
      </Row>
    </div>
  );
}

export default DealBoard;
