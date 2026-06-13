import { useState, useMemo, useEffect } from 'react';
import { Card, Space, Empty, Input, Badge, Tooltip, Button, message, Spin } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReceiverOrderTable from '../../components/receiver/ReceiverOrderTable';
import SubmitAcceptanceModal from '../../components/receiver/modals/SubmitAcceptanceModal';
import ReviewHistoryModal from '../../components/receiver/modals/ReviewHistoryModal';
import AcceptOrderModal from '../../components/receiver/modals/AcceptOrderModal';
import ReceiverEvaluationModal from '../../components/receiver/modals/ReceiverEvaluationModal';
import AssignModal from '../../components/receiver/modals/AssignModal';
import DetailModal from '../../components/orderer/modals/DetailModal';
import ChatModal from '../../components/orderer/modals/ChatModal';
import OrderFilterModal from '../../components/orderer/modals/OrderFilterModal';
import { getReceiverOrderList } from '../../api/orders';

// 接单人订单管理页（与下单人订单列表操作区设计风格一致）
function ReceiverOrderManage() {
  // 当前登录用户
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('dds_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 从后端加载订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      const myId = currentUser?.userId;
      if (!myId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await getReceiverOrderList(myId);
        if (result.success) {
          setOrders(result.data || []);
        } else {
          message.error(result.message || '加载订单失败');
        }
      } catch (error) {
        console.error('加载订单失败:', error);
        message.error('加载订单失败: ' + (error.message || '未知错误'));
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  // 监听通知中心事件：打开聊天 + 订单置顶
  useEffect(() => {
    const handleOpenChat = (e) => {
      const { orderId } = e.detail || {};
      if (!orderId) return;
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setActiveOrder(order);
        setChatOpen(true);
      }
    };
    const handleScrollToOrder = (e) => {
      const { orderId } = e.detail || {};
      if (!orderId) return;
      setOrders(prev => {
        const idx = prev.findIndex(o => o.id === orderId);
        if (idx <= 0) return prev;
        const target = prev[idx];
        return [target, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
    };
    window.addEventListener('dds-open-chat', handleOpenChat);
    window.addEventListener('dds-scroll-to-order', handleScrollToOrder);
    return () => {
      window.removeEventListener('dds-open-chat', handleOpenChat);
      window.removeEventListener('dds-scroll-to-order', handleScrollToOrder);
    };
  }, [orders]);

  // 刷新订单列表
  const refreshOrders = async () => {
    const myId = currentUser?.userId;
    if (!myId) return;
    try {
      const result = await getReceiverOrderList(myId);
      if (result.success) {
        setOrders(result.data || []);
      }
    } catch (error) {
      console.error('刷新订单失败:', error);
    }
  };

  // 弹框状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  // 接单人评价弹框（对订单/下单人的评价）
  const [receiverEvalOpen, setReceiverEvalOpen] = useState(false);
  // 组长分配弹框
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // 判断当前用户是否为接单组长
  const isGroupLeader = useMemo(() => {
    return currentUser?.roles?.some(r => r.role_name === '接单组长');
  }, [currentUser]);

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

    // 1) 模糊搜索：任务名 / 接单人 / 客户 / 国籍
    const kw = searchText.trim().toLowerCase();
    if (kw) {
      list = list.filter((o) => {
        const fields = [o.task_name, o.receiver_name, o.customer_name, o.customer_region];
        return fields.some((f) => (f || '').toLowerCase().includes(kw));
      });
    }

    // 2) 详细筛选
    const f = filterValues || {};
    const includes = (val, kw) => (val || '').toLowerCase().includes((kw || '').toLowerCase());
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
    if (f.receiver_name) list = list.filter((o) => includes(o.receiver_name, f.receiver_name));
    if (f.customer_region?.length) list = list.filter((o) => inArr(o.customer_region, f.customer_region));
    if (f.order_type !== undefined && f.order_type !== null)
      list = list.filter((o) => o.order_type === f.order_type);
    if (f.task_type_id?.length) list = list.filter((o) => inArr(o.task_type_id, f.task_type_id));
    if (f.priority?.length) list = list.filter((o) => inArr(o.priority, f.priority));
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
  const handleFilterReset = () => setFilterValues({});

  // === 操作处理 ===
  const handleDetail = (order) => {
    setActiveOrder(order);
    setDetailOpen(true);
  };

  const handleChat = (order) => {
    setActiveOrder(order);
    setChatOpen(true);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, unread_messages: 0 } : o)));
  };

  const handleHistory = (order) => {
    setActiveOrder(order);
    setHistoryOpen(true);
  };

  // 接单人评价：点击"未评价"或已评价星标（已完结订单）
  const handleEvaluate = (order) => {
    setActiveOrder(order);
    setReceiverEvalOpen(true);
  };

  // 提交接单人评价：写入 evaluation_by_receiver + is_evaluated_by_receiver
  const handleReceiverEvalOk = (payload) => {
    const { orderId, overall_score, comment, ...dims } = payload;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              is_evaluated_by_receiver: 1,
              evaluation_by_receiver: {
                ...dims,
                overall_score,
                comment,
                evaluated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              },
            }
          : o
      )
    );
    setReceiverEvalOpen(false);
    message.success('评价提交成功');
  };

  // 接单处理：点击待接单 Tag 或操作列"处理接单"按钮，唤起弹框
  const handleAccept = (order) => {
    setActiveOrder(order);
    setAcceptOpen(true);
  };

  // 弹框内点击"接受"：status 1 -> 2
  const handleAcceptConfirm = (order) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 2 } : o)));
    setAcceptOpen(false);
    message.success(`订单 ${order.order_no} 已接单，进入进行中`);
  };

  // 弹框内点击“确认拒绝”（带理由）：status 1 -> 5
  const handleRejectConfirm = (order, reason) => {
    const rejectedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, status: 5, reject_reason: reason, rejected_at: rejectedAt }
          : o
      )
    );
    setAcceptOpen(false);
    message.warning(`订单 ${order.order_no} 已拒绝`);
  };
  
  // 提交验收：打开 SubmitAcceptanceModal
  const handleSubmitAcceptance = (order) => {
    setActiveOrder(order);
    setSubmitAcceptanceOpen(true);
  };
  
  // 提交验收确认：status 2 -> 3
  const handleSubmitAcceptanceOk = (order, payload) => {
    const submittedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newHistory = {
      id: (order.acceptance_history?.length || 0) + 1,
      submit_time: submittedAt,
      description: payload.description,
      files: payload.files,
      review_result: 'pending',
      review_comment: '',
      reviewed_at: '',
    };
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 3,
              acceptance_history: [...(o.acceptance_history || []), newHistory],
            }
          : o
      )
    );
    setSubmitAcceptanceOpen(false);
    message.success(`订单 ${order.order_no} 已提交验收，等待审核`);
  };
  
  // 退单处理：status 2 -> 1（返回待接单）
  const handleReturnOrder = (order, reason) => {
    const returnedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 1,
              return_reason: reason,
              returned_at: returnedAt,
            }
          : o
      )
    );
    message.warning(`订单 ${order.order_no} 已退单，返回待接单池`);
  };

  // 提交验收：弹出 SubmitAcceptanceModal
  const handleSubmit = (order) => {
    setActiveOrder(order);
    setSubmitOpen(true);
  };

  // 提交验收 onOk：生成 pending 条目，状态 2 -> 3
  const handleSubmitOk = (order, payload) => {
    const submittedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const submitter = currentUser?.realName || currentUser?.username || order.receiver_name || '接单人';
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== order.id) return o;
        const history = Array.isArray(o.acceptance_history) ? o.acceptance_history.slice() : [];
        const nextId = history.length > 0 ? Math.max(...history.map((h) => h.id || 0)) + 1 : 1;
        history.push({
          id: nextId,
          submitted_at: submittedAt,
          submitter,
          description: payload.description,
          files: payload.files,
          review_result: 'pending',
          review_remark: null,
          reviewed_at: null,
        });
        return { ...o, status: 3, acceptance_history: history };
      })
    );
    setSubmitOpen(false);
    message.success(`订单 ${order.order_no} 已提交验收，等待客户审核`);
  };

  return (
    <div>
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
        <Spin spinning={loading}>
          {filteredOrders.length > 0 ? (
            <ReceiverOrderTable
              dataSource={filteredOrders}
              onAccept={handleAccept}
              onSubmit={handleSubmit}
              onDetail={handleDetail}
              onChat={handleChat}
              onHistory={handleHistory}
              onEvaluate={handleEvaluate}
              onAssign={(order) => {
                setActiveOrder(order);
                setAssignOpen(true);
              }}
              isGroupLeader={isGroupLeader}
            />
          ) : (
            <Empty
              description={
                searchText || activeFilterCount > 0 ? '没有符合条件的订单' : '暂无订单数据'
              }
            />
          )}
        </Spin>
      </Card>

      {/* 弹框 */}
      <DetailModal open={detailOpen} order={activeOrder} onCancel={() => setDetailOpen(false)} />
      <ChatModal
        open={chatOpen}
        order={activeOrder}
        currentUser={currentUser}
        onCancel={() => setChatOpen(false)}
      />
      <SubmitAcceptanceModal
        open={submitOpen}
        order={activeOrder}
        onCancel={() => setSubmitOpen(false)}
        onOk={handleSubmitOk}
        onReturn={handleReturnOrder}
      />
      <ReviewHistoryModal
        open={historyOpen}
        order={activeOrder}
        onCancel={() => setHistoryOpen(false)}
      />
      <AcceptOrderModal
        open={acceptOpen}
        order={activeOrder}
        onCancel={() => setAcceptOpen(false)}
        onAccept={handleAcceptConfirm}
        onReject={handleRejectConfirm}
      />
      <ReceiverEvaluationModal
        open={receiverEvalOpen}
        order={activeOrder}
        onCancel={() => setReceiverEvalOpen(false)}
        onOk={handleReceiverEvalOk}
      />
      <AssignModal
        open={assignOpen}
        order={activeOrder}
        leaderId={currentUser?.userId}
        onCancel={() => setAssignOpen(false)}
        onSuccess={() => {
          setAssignOpen(false);
          // 重新加载订单列表
          window.location.reload();
        }}
      />
      <OrderFilterModal
        open={filterOpen}
        initialValues={filterValues}
        onCancel={() => setFilterOpen(false)}
        onOk={handleFilterOk}
        onReset={handleFilterReset}
      />
    </div>
  );
}

export default ReceiverOrderManage;
