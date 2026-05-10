import { useState, useMemo } from 'react';
import { Card, Space, Empty, Input, Badge, Tooltip, Button } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ManagerOrderTable from '../../components/manager/ManagerOrderTable';
import ManagerOrderFilterModal from '../../components/manager/modals/ManagerOrderFilterModal';
import DetailModal from '../../components/orderer/modals/DetailModal';
import { MOCK_ORDERS } from '../../mock/orders';
import { getUserName, getUserRole } from '../../mock/users';

// 负责人订单列表（全公司订单）
// - 模糊搜索：任务名称、角色、接单人/下单人名称、客户名称、国籍
// - 高级筛选：订单相关的所有字段
function ManagerOrderList() {
  // 数据源：增强订单，补充 creator_name / creator_role / receiver_role 便于搜索与筛选
  const orders = useMemo(() => {
    return MOCK_ORDERS.map((o) => ({
      ...o,
      creator_name: getUserName(o.creator_id),
      creator_role: getUserRole(o.creator_id),
      receiver_role: o.receiver_id ? getUserRole(o.receiver_id) : '',
    }));
  }, []);

  // 弹框状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // 搜索与筛选
  const [searchText, setSearchText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({});

  // 活动筛选条件数
  const activeFilterCount = useMemo(() => {
    return Object.values(filterValues).filter((v) => {
      if (v === undefined || v === null || v === '') return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }).length;
  }, [filterValues]);

  // 过滤后的订单列表
  const filteredOrders = useMemo(() => {
    let list = orders;

    // 1) 模糊搜索：任务名称 / 角色 / 接单人/下单人 / 客户 / 国籍
    const kw = searchText.trim().toLowerCase();
    if (kw) {
      list = list.filter((o) => {
        const fields = [
          o.task_name,
          o.creator_role,
          o.receiver_role,
          o.creator_name,
          o.receiver_name,
          o.customer_name,
          o.customer_region,
        ];
        return fields.some((f) => (f || '').toLowerCase().includes(kw));
      });
    }

    // 2) 详细筛选
    const f = filterValues || {};
    const includes = (val, kw2) =>
      (val || '').toLowerCase().includes((kw2 || '').toLowerCase());
    const inArr = (val, arr) => !arr || arr.length === 0 || arr.includes(val);
    const inRange = (dateStr, range) => {
      if (!range || range.length !== 2 || !range[0] || !range[1]) return true;
      if (!dateStr) return false;
      const t = dayjs(dateStr);
      return (
        t.isAfter(range[0].startOf('day').subtract(1, 'second')) &&
        t.isBefore(range[1].endOf('day').add(1, 'second'))
      );
    };

    if (f.order_no) list = list.filter((o) => includes(o.order_no, f.order_no));
    if (f.task_name) list = list.filter((o) => includes(o.task_name, f.task_name));
    if (f.customer_name) list = list.filter((o) => includes(o.customer_name, f.customer_name));
    if (f.creator_name) list = list.filter((o) => includes(o.creator_name, f.creator_name));
    if (f.receiver_name) list = list.filter((o) => includes(o.receiver_name, f.receiver_name));
    if (f.customer_region?.length)
      list = list.filter((o) => inArr(o.customer_region, f.customer_region));
    // role 过滤：下单人角色或接单人角色任一匹配即可
    if (f.role?.length)
      list = list.filter(
        (o) => f.role.includes(o.creator_role) || f.role.includes(o.receiver_role)
      );
    if (f.order_type !== undefined && f.order_type !== null)
      list = list.filter((o) => o.order_type === f.order_type);
    if (f.task_type_id?.length) list = list.filter((o) => inArr(o.task_type_id, f.task_type_id));
    if (f.priority?.length) list = list.filter((o) => inArr(o.priority, f.priority));
    if (f.status?.length) list = list.filter((o) => inArr(o.status, f.status));
    if (f.is_evaluated_by_creator !== undefined && f.is_evaluated_by_creator !== null)
      list = list.filter((o) => (o.is_evaluated_by_creator || 0) === f.is_evaluated_by_creator);
    if (f.is_evaluated_by_receiver !== undefined && f.is_evaluated_by_receiver !== null)
      list = list.filter((o) => (o.is_evaluated_by_receiver || 0) === f.is_evaluated_by_receiver);
    if (f.created_at_range) list = list.filter((o) => inRange(o.created_at, f.created_at_range));
    if (f.deadline_range) list = list.filter((o) => inRange(o.deadline, f.deadline_range));
    if (f.completed_at_range)
      list = list.filter((o) => inRange(o.completed_at, f.completed_at_range));

    return list;
  }, [orders, searchText, filterValues]);

  const handleFilterOk = (values) => {
    setFilterValues(values);
    setFilterOpen(false);
  };
  const handleFilterReset = () => setFilterValues({});

  const handleDetail = (order) => {
    setActiveOrder(order);
    setDetailOpen(true);
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <span style={{ fontSize: 16, fontWeight: 600 }}>订单列表（全公司）</span>
            <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 400 }}>
              （共 {filteredOrders.length} 条）
            </span>
          </Space>
        }
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="搜索：任务名称 / 角色 / 接单人 / 下单人 / 客户 / 国籍"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(v) => setSearchText(v)}
              style={{ width: 360 }}
            />
            <Tooltip title="高级筛选">
              <Badge count={activeFilterCount} size="small" offset={[-2, 2]}>
                <Button
                  icon={<FilterOutlined />}
                  type={activeFilterCount > 0 ? 'primary' : 'default'}
                  onClick={() => setFilterOpen(true)}
                >
                  筛选
                </Button>
              </Badge>
            </Tooltip>
            {activeFilterCount > 0 && (
              <Button size="small" type="link" onClick={handleFilterReset}>
                清空筛选
              </Button>
            )}
          </Space>
        }
        styles={{ body: { padding: 16 } }}
      >
        {filteredOrders.length > 0 ? (
          <ManagerOrderTable dataSource={filteredOrders} onDetail={handleDetail} />
        ) : (
          <Empty
            description={
              searchText || activeFilterCount > 0 ? '没有符合条件的订单' : '暂无订单数据'
            }
          />
        )}
      </Card>

      <DetailModal
        open={detailOpen}
        order={activeOrder}
        onCancel={() => setDetailOpen(false)}
      />
      <ManagerOrderFilterModal
        open={filterOpen}
        initialValues={filterValues}
        onCancel={() => setFilterOpen(false)}
        onOk={handleFilterOk}
        onReset={handleFilterReset}
      />
    </div>
  );
}

export default ManagerOrderList;
