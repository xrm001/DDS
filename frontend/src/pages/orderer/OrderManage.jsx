import { useState, useMemo, useRef } from 'react';
import { Card, Button, Space, Modal, message, Divider, Empty, Input, Badge, Tooltip } from 'antd';
import { PlusOutlined, ReloadOutlined, CheckCircleOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TaskForm from '../../components/orderer/TaskForm';
import OrderTable from '../../components/orderer/OrderTable';
import EditOrderModal from '../../components/orderer/modals/EditOrderModal';
import DetailModal from '../../components/orderer/modals/DetailModal';
import ChatModal from '../../components/orderer/modals/ChatModal';
import EvaluationModal from '../../components/orderer/modals/EvaluationModal';
import AcceptanceModal from '../../components/orderer/modals/AcceptanceModal';
import CutInLineRequestModal from '../../components/orderer/modals/CutInLineRequestModal';
import OrderFilterModal from '../../components/orderer/modals/OrderFilterModal';
import { MOCK_ORDERS } from '../../mock/orders';

// 创建空任务对象
const emptyTask = (overrides = {}) => ({
  id: Date.now() + Math.random(),
  task_name: '',
  customer_name: '',
  customer_region: undefined,
  task_type_id: undefined,
  priority: 2,
  deadline: null,
  requirement_desc: '',
  fileList: [],
  orderType: 1, // 1=原始订单, 2=修改单
  originalOrderId: null,
  originalOrderNo: null,
  ...overrides,
});

// 下单管理页
function OrderManage() {
  // 任务下单区：tasks 数组
  const [tasks, setTasks] = useState([emptyTask()]);
  // 订单列表数据
  const [orders, setOrders] = useState(MOCK_ORDERS);
  // 当前登录用户
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('dds_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  // 弹框状态
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [acceptanceOpen, setAcceptanceOpen] = useState(false);
  const [cutInLineRequestOpen, setCutInLineRequestOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [cutInLineRequest, setCutInLineRequest] = useState(null);

  // 搜索与筛选状态
  const [searchText, setSearchText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({});

  // 计算有效筛选条件数（用于 Badge 数字提示）
  const activeFilterCount = useMemo(() => {
    return Object.values(filterValues).filter((v) => {
      if (v === undefined || v === null || v === '') return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    }).length;
  }, [filterValues]);

  // 过滤后的订单列表：先模糊搜索，再应用详细筛选
  const filteredOrders = useMemo(() => {
    let list = orders;

    // 1) 模糊搜索：任务名称 / 接单人名称 / 客户名称 / 国籍
    const kw = searchText.trim().toLowerCase();
    if (kw) {
      list = list.filter((o) => {
        const fields = [
          o.task_name,
          o.receiver_name,
          o.customer_name,
          o.customer_region,
        ];
        return fields.some((f) => (f || '').toLowerCase().includes(kw));
      });
    }

    // 2) 详细筛选
    const f = filterValues || {};
    const includes = (val, kw) =>
      (val || '').toLowerCase().includes((kw || '').toLowerCase());
    const inArr = (val, arr) => !arr || arr.length === 0 || arr.includes(val);
    const inRange = (dateStr, range) => {
      if (!range || range.length !== 2 || !range[0] || !range[1]) return true;
      if (!dateStr) return false;
      const t = dayjs(dateStr);
      return t.isAfter(range[0].startOf('day').subtract(1, 'second')) &&
             t.isBefore(range[1].endOf('day').add(1, 'second'));
    };

    if (f.order_no) list = list.filter((o) => includes(o.order_no, f.order_no));
    if (f.task_name) list = list.filter((o) => includes(o.task_name, f.task_name));
    if (f.customer_name) list = list.filter((o) => includes(o.customer_name, f.customer_name));
    if (f.receiver_name) list = list.filter((o) => includes(o.receiver_name, f.receiver_name));
    if (f.customer_region?.length) list = list.filter((o) => inArr(o.customer_region, f.customer_region));
    if (f.order_type !== undefined && f.order_type !== null)
      list = list.filter((o) => o.order_type === f.order_type);
    if (f.task_type_id?.length) list = list.filter((o) => inArr(o.task_type_id, f.task_type_id));
    if (f.status?.length) list = list.filter((o) => inArr(o.status, f.status));
    if (f.is_evaluated_by_creator !== undefined && f.is_evaluated_by_creator !== null)
      list = list.filter((o) => (o.is_evaluated_by_creator || 0) === f.is_evaluated_by_creator);
    if (f.created_at_range) list = list.filter((o) => inRange(o.created_at, f.created_at_range));
    if (f.deadline_range) list = list.filter((o) => inRange(o.deadline, f.deadline_range));
    if (f.completed_at_range) list = list.filter((o) => inRange(o.completed_at, f.completed_at_range));

    return list;
  }, [orders, searchText, filterValues]);

  const handleFilterOk = (values) => {
    setFilterValues(values);
    setFilterOpen(false);
  };

  const handleFilterReset = () => {
    setFilterValues({});
  };

  // 下单区滚动锚点 & 首输入框引用
  const formRegionRef = useRef(null);
  const firstInputRef = useRef(null);

  // === 任务下单区操作 ===
  const handleTaskChange = (index, partial) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...partial } : t)));
  };

  const handleAddTask = () => {
    setTasks((prev) => [...prev, emptyTask()]);
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '将清空所有已填写的任务，确定继续？',
      okText: '重置',
      cancelText: '取消',
      onOk: () => setTasks([emptyTask()]),
    });
  };

  const handleSubmit = () => {
    // 简单校验：任务名、客户名、地区、任务类型、截止日期
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.task_name?.trim()) {
        message.error(`任务 ${i + 1}：请填写任务名称`);
        return;
      }
      if (!t.customer_name?.trim()) {
        message.error(`任务 ${i + 1}：请填写客户名称`);
        return;
      }
      if (!t.customer_region) {
        message.error(`任务 ${i + 1}：请选择客户国籍/地区`);
        return;
      }
      if (!t.task_type_id) {
        message.error(`任务 ${i + 1}：请选择任务类型`);
        return;
      }
      if (!t.deadline) {
        message.error(`任务 ${i + 1}：请选择截止日期`);
        return;
      }
    }

    // 屏幕中央显示"提交成功"
    Modal.success({
      title: '提交成功',
      content: `已成功提交 ${tasks.length} 个任务订单`,
      centered: true,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      okText: '确定',
      onOk: () => setTasks([emptyTask()]),
    });
  };

  // === 订单列表操作 ===
  const handleEdit = (order) => {
    setActiveOrder(order);
    setEditOpen(true);
  };

  const handleEditOk = (updated) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
    setEditOpen(false);
    message.success('订单修改成功');
  };

  const handleRecall = (order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 6 } : o))
    );
    message.success(`订单 ${order.order_no} 已撤回`);
  };

  const handleDetail = (order) => {
    setActiveOrder(order);
    setDetailOpen(true);
  };

  const handleChat = (order) => {
    setActiveOrder(order);
    setChatOpen(true);
    // 打开聊天后清零未读数
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, unread_messages: 0 } : o))
    );
  };

  const handleEvaluate = (order) => {
    setActiveOrder(order);
    setEvalOpen(true);
  };

  // 打开验收弹框（仅待验收状态）
  const handleAcceptance = (order) => {
    setActiveOrder(order);
    setAcceptanceOpen(true);
  };

  // 处理插队申请
  const handleCutInLine = (order) => {
    // 模拟：找到该接单人的第一位排队用户
    const receiverOrders = orders.filter(o => o.receiver_id === order.receiver_id && o.status === 1);
    if (receiverOrders.length > 0) {
      const firstInQueue = receiverOrders[0];
      // 这里应该发送通知给firstInQueue的下单人
      message.info(`已向 ${firstInQueue.creator_name} 发送插队申请通知`);
      
      // 模拟显示插队申请通知（实际应该在第一位排队用户的界面显示）
      setCutInLineRequest({
        id: Date.now(),
        requester_name: '当前用户',
        requester_order_no: order.order_no,
        requester_task_name: order.task_name,
        current_position: 1,
        created_at: new Date().toLocaleString(),
      });
      setCutInLineRequestOpen(true);
    }
  };

  // 同意插队
  const handleAgreeCutInLine = () => {
    message.success('已同意插队，对方订单将优先制作');
    setCutInLineRequestOpen(false);
    setCutInLineRequest(null);
  };

  // 拒绝插队
  const handleRejectCutInLine = () => {
    message.info('已拒绝插队申请');
    setCutInLineRequestOpen(false);
    setCutInLineRequest(null);
  };

  // 驳回：订单状态回退为"进行中"，并把 pending 条目标记为 rejected 存入历史
  const handleReject = (order, remark) => {
    const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        const history = (o.acceptance_history || []).map((h) =>
          h.review_result === 'pending'
            ? { ...h, review_result: 'rejected', review_remark: remark, reviewed_at: reviewedAt }
            : h
        );
        return { ...o, status: 2, acceptance_history: history };
      })
    );
    setAcceptanceOpen(false);
    message.warning(`订单 ${order.order_no} 已驳回，退回进行中`);
  };

  // 通过：订单状态置为"已完成"，并把 pending 条目标记为 approved 存入历史
  const handleApprove = (order, remark) => {
    const reviewedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        const history = (o.acceptance_history || []).map((h) =>
          h.review_result === 'pending'
            ? { ...h, review_result: 'approved', review_remark: remark || '通过验收', reviewed_at: reviewedAt }
            : h
        );
        return { ...o, status: 4, completed_at: reviewedAt, acceptance_history: history };
      })
    );
    setAcceptanceOpen(false);
    message.success(`订单 ${order.order_no} 已验收通过，订单完结`);
  };

  const handleEvalOk = (payload) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === payload.orderId
          ? {
              ...o,
              is_evaluated_by_creator: 1,
              evaluation: {
                score_completion: payload.score_completion || 0,
                score_communication: payload.score_communication || 0,
                score_understanding: payload.score_understanding || 0,
                score_technical: payload.score_technical || 0,
                score_design: payload.score_design || 0,
                overall_score: payload.overall_score,
                comment: payload.comment,
              },
            }
          : o
      )
    );
    setEvalOpen(false);
    message.success('评价已提交');
  };

  // 修改单：跳转至下单区，预填原单数据，高亮为修改单
  const handleModify = (order) => {
    const newTask = emptyTask({
      task_name: order.task_name,
      customer_name: order.customer_name,
      customer_region: order.customer_region,
      task_type_id: order.task_type_id,
      priority: order.priority,
      deadline: order.deadline ? dayjs(order.deadline) : null,
      requirement_desc: order.requirement_desc,
      orderType: 2, // 修改单
      originalOrderId: order.id,
      originalOrderNo: order.order_no,
    });
    // prepend 到任务列表顶部
    setTasks((prev) => [newTask, ...prev]);
    // 滚动到下单区并 focus 首个输入框
    setTimeout(() => {
      formRegionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      firstInputRef.current?.focus();
    }, 100);
    message.info(`已加载订单 ${order.order_no} 作为修改单`);
  };

  return (
    <div>
      {/* ========== 上部分：任务下单区 ========== */}
      <div ref={formRegionRef}>
        <Card
          title={
            <Space>
              <span style={{ fontSize: 16, fontWeight: 600 }}>任务下单区</span>
              <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 400 }}>
                （共 {tasks.length} 个任务）
              </span>
            </Space>
          }
          extra={
            <Space>
              <Button icon={<PlusOutlined />} onClick={handleAddTask}>
                添加任务
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button type="primary" onClick={handleSubmit}>
                提交
              </Button>
            </Space>
          }
          style={{ marginBottom: 20 }}
          styles={{ body: { padding: 16 } }}
        >
          {tasks.map((task, idx) => (
            <TaskForm
              key={task.id}
              task={task}
              index={idx}
              onChange={handleTaskChange}
              onRemove={handleRemoveTask}
              showRemove={tasks.length > 1}
              firstInputRef={firstInputRef}
              userRoles={currentUser.roles}
            />
          ))}
        </Card>
      </div>

      {/* ========== 下部分：订单列表操作区 ========== */}
      <Card
        title={
          <Space>
            <span style={{ fontSize: 16, fontWeight: 600 }}>订单列表</span>
            <span style={{ color: '#8c8c8c', fontSize: 12, fontWeight: 400 }}>
              （共 {filteredOrders.length} 条）
            </span>
          </Space>
        }
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="搜索：任务名称 / 接单人 / 客户 / 国籍"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(v) => setSearchText(v)}
              style={{ width: 300 }}
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
          <OrderTable
            dataSource={filteredOrders}
            allOrders={orders}
            onEdit={handleEdit}
            onRecall={handleRecall}
            onDetail={handleDetail}
            onModify={handleModify}
            onEvaluate={handleEvaluate}
            onChat={handleChat}
            onAcceptance={handleAcceptance}
            onCutInLine={handleCutInLine}
          />
        ) : (
          <Empty description={searchText || activeFilterCount > 0 ? '没有符合条件的订单' : '暂无订单数据'} />
        )}
      </Card>

      {/* ========== 弹框 ========== */}
      <EditOrderModal
        open={editOpen}
        order={activeOrder}
        onCancel={() => setEditOpen(false)}
        onOk={handleEditOk}
      />
      <DetailModal
        open={detailOpen}
        order={activeOrder}
        onCancel={() => setDetailOpen(false)}
      />
      <ChatModal
        open={chatOpen}
        order={activeOrder}
        currentUser={currentUser}
        onCancel={() => setChatOpen(false)}
      />
      <EvaluationModal
        open={evalOpen}
        order={activeOrder}
        onCancel={() => setEvalOpen(false)}
        onOk={handleEvalOk}
      />
      <AcceptanceModal
        open={acceptanceOpen}
        order={activeOrder}
        onCancel={() => setAcceptanceOpen(false)}
        onReject={handleReject}
        onApprove={handleApprove}
      />
      <OrderFilterModal
        open={filterOpen}
        initialValues={filterValues}
        onCancel={() => setFilterOpen(false)}
        onOk={handleFilterOk}
        onReset={handleFilterReset}
      />
      <CutInLineRequestModal
        open={cutInLineRequestOpen}
        requestInfo={cutInLineRequest}
        onAgree={handleAgreeCutInLine}
        onReject={handleRejectCutInLine}
        onCancel={() => {
          setCutInLineRequestOpen(false);
          setCutInLineRequest(null);
        }}
      />
    </div>
  );
}

export default OrderManage;
