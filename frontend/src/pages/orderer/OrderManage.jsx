import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Card, Button, Space, Modal, message, Divider, Empty, Input, Badge, Tooltip, Tabs } from 'antd';
import { PlusOutlined, ReloadOutlined, CheckCircleOutlined, FilterOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TaskForm from '../../components/orderer/TaskForm';
import OrderTable from '../../components/orderer/OrderTable';
import DealBoard from '../../components/orderer/DealBoard';
import EditOrderModal from '../../components/orderer/modals/EditOrderModal';
import DetailModal from '../../components/orderer/modals/DetailModal';
import ChatModal from '../../components/orderer/modals/ChatModal';
import EvaluationModal from '../../components/orderer/modals/EvaluationModal';
import AcceptanceModal from '../../components/orderer/modals/AcceptanceModal';
import DealStatusModal from '../../components/orderer/modals/DealStatusModal';
import CutInLineRequestModal from '../../components/orderer/modals/CutInLineRequestModal';
import OrderFilterModal from '../../components/orderer/modals/OrderFilterModal';
import NotificationCenter from '../../components/orderer/NotificationCenter';
import { submitOrder, getOrderList, recallOrder, updateOrder, updateDealStatus, submitEvaluation, reviewOrder } from '../../api/orders';

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
  is_special_order: 0, // 0=否, 1=是
  ...overrides,
});

// 读取文件为 Base64 字符串（用于传输）
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 下单管理页
function OrderManage() {
  // 任务下单区：tasks 数组
  const [tasks, setTasks] = useState([emptyTask()]);
  // 订单列表数据
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // 视图模式：'table' 表格视图，'board' 看板视图
  const [viewMode, setViewMode] = useState('table');
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
  const [dealOpen, setDealOpen] = useState(false);
  const [cutInLineRequestOpen, setCutInLineRequestOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [cutInLineRequest, setCutInLineRequest] = useState(null);

  // 搜索与筛选状态
  const [searchText, setSearchText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({});

  // 加载订单列表
  const fetchOrders = useCallback(async () => {
    if (!currentUser.id) return;
    setOrdersLoading(true);
    try {
      const result = await getOrderList(currentUser.id);
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败: ' + (error.message || '未知错误'));
    } finally {
      setOrdersLoading(false);
    }
  }, [currentUser.id]);

  // 页面加载时获取订单
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  // 判断是否为运营相关角色（运营下单人、运营主管、新媒体运营主管、新媒体运营下单人、市场运营部门经理）
  const isOperationOrderer = useMemo(() => {
    const OPERATION_ROLE_NAMES = ['运营下单人', '运营主管下单人', '新媒体运营主管下单人', '新媒体运营下单人', '市场运营部门经理'];
    const OPERATION_ROLE_CODES = ['operation_orderer', 'operation_supervisor', 'newmedia_supervisor', 'newmedia_operation_orderer', 'operation_dept_manager'];
    return currentUser.roles?.some(r => 
      OPERATION_ROLE_NAMES.includes(r.role_name) || OPERATION_ROLE_CODES.includes(r.role_code)
    );
  }, [currentUser.roles]);

  const handleSubmit = async () => {
    // 简单校验：任务名、客户名/地区（业务下单人）、任务类型、截止日期
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.task_name?.trim()) {
        message.error(`任务 ${i + 1}：请填写任务名称`);
        return;
      }
      // 运营下单人不需要客户名称和客户地区
      if (!isOperationOrderer) {
        if (!t.customer_name?.trim()) {
          message.error(`任务 ${i + 1}：请填写客户名称`);
          return;
        }
        if (!t.customer_region) {
          message.error(`任务 ${i + 1}：请选择客户国籍/地区`);
          return;
        }
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

    try {
      // 提交所有任务
      const submitPromises = tasks.map(async (task) => {
        // 准备附件数据 - 需要读取文件内容
        const attachments = [];
        
        if (task.fileList && task.fileList.length > 0) {
          for (const file of task.fileList) {
            // 如果有原始文件对象，读取文件内容
            if (file.originFileObj) {
              try {
                const fileBase64 = await readFileAsBase64(file.originFileObj);
                attachments.push({
                  file_name: file.name,
                  mime_type: file.type || 'application/octet-stream',
                  file_type: 1, // 过程文件
                  file_buffer: fileBase64 // Base64编码的文件内容
                });
              } catch (readError) {
                console.error(`读取文件 ${file.name} 失败:`, readError);
                // 即使读取失败，也记录附件信息（但不上传OSS）
                attachments.push({
                  file_name: file.name,
                  mime_type: file.type || 'application/octet-stream',
                  file_type: 1
                });
              }
            } else {
              // 没有原始文件对象，只记录信息
              attachments.push({
                file_name: file.name,
                mime_type: file.type || 'application/octet-stream',
                file_type: 1
              });
            }
          }
        }

        // 确保deadline是dayjs对象
        const deadlineDate = task.deadline ? 
          (typeof task.deadline.format === 'function' ? task.deadline : dayjs(task.deadline)) : 
          null;

        if (!deadlineDate) {
          throw new Error('截止日期无效');
        }

        // 调用后端API（下单人不能指定接单人，系统自动派发）
        const result = await submitOrder({
          task_name: task.task_name,
          // 运营下单人时 customer_name 和 customer_region 为 null
          customer_name: isOperationOrderer ? null : (task.customer_name || null),
          customer_region: isOperationOrderer ? null : (task.customer_region || null),
          task_type_id: task.task_type_id,
          deadline: deadlineDate.format('YYYY-MM-DD HH:mm:ss'),
          requirement_desc: task.requirement_desc,
          creator_id: currentUser.id || 2, // TODO: 从全局状态获取
          order_type: task.orderType || 1, // 1=原始订单, 2=修改单
          original_order_id: task.originalOrderId || null, // 修改单关联原单ID
          is_special_order: task.is_special_order ?? 0, // 特殊订单
          attachments
        });

        return result;
      });

      const results = await Promise.all(submitPromises);
      const successResults = results.filter(r => r.success && !r.data?.dispatch_failed);
      const failedResults = results.filter(r => r.data?.dispatch_failed);

      if (failedResults.length > 0) {
        // 有派发失败的订单，显示"下单异常"
        Modal.warning({
          title: '下单异常',
          content: `共提交 ${results.length} 个订单，其中 ${failedResults.length} 个派发失败（订单已创建但未分配接单人）`,
          centered: true,
          okText: '确定',
          onOk: () => setTasks([emptyTask()]),
        });
      } else {
        // 全部派发成功
        Modal.success({
          title: '提交成功',
          content: `已成功提交 ${successResults.length}/${tasks.length} 个任务订单`,
          centered: true,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          okText: '确定',
          onOk: () => setTasks([emptyTask()]),
        });
      }

      // 刷新订单列表
      fetchOrders();

    } catch (error) {
      console.error('提交订单错误:', error);
      const errorMsg = error.response?.data?.message || error.message || '未知错误';
      message.error('提交失败：' + errorMsg);
    }
  };

  // === 订单列表操作 ===
  const handleEdit = (order) => {
    setActiveOrder(order);
    setEditOpen(true);
  };

  const handleEditOk = async (updated) => {
    try {
      const result = await updateOrder(updated.id, {
        task_name: updated.task_name,
        requirement_desc: updated.requirement_desc,
        task_type_id: updated.task_type_id,
        customer_name: updated.customer_name,
        customer_region: updated.customer_region,
        attachments: updated.attachments || [],
      });
      if (result.success) {
        setEditOpen(false);
        message.success('订单修改成功');
        fetchOrders(); // 刷新列表
      } else {
        message.error(result.message || '修改失败');
      }
    } catch (error) {
      throw error; // 抛给 EditOrderModal 处理
    }
  };

  const handleRecall = async (order) => {
    try {
      await recallOrder(order.id, '用户撤回');
      message.success(`订单 ${order.order_no} 已撤回`);
      fetchOrders();
    } catch (error) {
      message.error('撤回失败: ' + (error.message || '未知错误'));
    }
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

  // 打开成交状态管理弹框
  const handleDeal = (order) => {
    setActiveOrder(order);
    setDealOpen(true);
  };

  // 更新成交状态
  const handleDealUpdate = async (orderId, dealData) => {
    try {
      await updateDealStatus(orderId, dealData);
      // 更新本地状态
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...dealData } : o))
      );
    } catch (error) {
      message.error('更新成交状态失败: ' + (error.message || '未知错误'));
    }
  };

  // 处理插队申请（status=3）
  const handleCutInLineProcess = (cutInLineId, action, reason) => {
    const updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    
    setOrders((prev) =>
      prev.map((order) => {
        if (!order.cut_in_line_request || order.cut_in_line_request.id !== cutInLineId) {
          return order;
        }
        
        const updatedRequest = {
          ...order.cut_in_line_request,
          status: action === 'agree' ? 4 : 5,
          refuse_content: reason || '',
          updated_at: updatedAt,
        };
        
        return {
          ...order,
          cut_in_line_request: updatedRequest,
        };
      })
    );
  };

  // 处理插队申请（从排队列表发起）
  const handleCutInLineRequest = (targetOrderId) => {
    // 找到目标订单
    const targetOrder = orders.find(o => o.id === targetOrderId);
    if (!targetOrder) {
      message.error('订单不存在');
      return;
    }

    // TODO: 这里应该调用后端API创建插队申请
    // 暂时模拟：找到当前用户的订单，并创建插队申请记录
    const currentOrderId = 10; // TODO: 从上下文获取当前操作订单ID
    const currentOrder = orders.find(o => o.id === currentOrderId);
    
    if (!currentOrder) {
      message.error('当前订单不存在');
      return;
    }

    const cutInLineRequestId = Date.now();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // 更新目标订单的插队申请状态为 3 (待处理)
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === targetOrderId) {
          return {
            ...order,
            cut_in_line_request: {
              id: cutInLineRequestId,
              creator_id: currentOrder.creator_id,
              creator_name: currentOrder.creator_name,
              order_id: currentOrder.id,
              order_no: currentOrder.order_no,
              target_order_id: targetOrder.id,
              target_order_no: targetOrder.order_no,
              receiver_id: targetOrder.receiver_id,
              receiver_name: targetOrder.receiver_name,
              status: 3, // 插队待处理
              reason: '',
              response_reason: '',
              refuse_content: '',
              created_at: now,
              responded_at: null,
            },
          };
        }
        
        // 更新当前订单的插队申请状态为 0 (已申请)
        if (order.id === currentOrderId) {
          return {
            ...order,
            cut_in_line_request: {
              id: cutInLineRequestId,
              creator_id: currentOrder.creator_id,
              creator_name: currentOrder.creator_name,
              order_id: currentOrder.id,
              order_no: currentOrder.order_no,
              target_order_id: targetOrder.id,
              target_order_no: targetOrder.order_no,
              receiver_id: targetOrder.receiver_id,
              receiver_name: targetOrder.receiver_name,
              status: 0, // 插队已申请
              reason: '',
              response_reason: '',
              refuse_content: '',
              created_at: now,
              responded_at: null,
            },
          };
        }
        
        return order;
      })
    );

    message.success('插队申请已发送，等待接单人处理');
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

  // 驳回：订单状态回退为“进行中”
  const handleReject = async (order, remark) => {
    try {
      await reviewOrder(order.id, { review_result: 'rejected', review_remark: remark });
      setAcceptanceOpen(false);
      message.warning(`订单 ${order.order_no} 已驳回，退回进行中`);
      fetchOrders();
    } catch (error) {
      message.error('驳回失败: ' + (error.message || '未知错误'));
    }
  };
  
  // 通过：订单状态置为“已完成”
  const handleApprove = async (order, remark) => {
    try {
      await reviewOrder(order.id, { review_result: 'approved', review_remark: remark || '通过验收' });
      setAcceptanceOpen(false);
      message.success(`订单 ${order.order_no} 已验收通过，订单完结`);
      fetchOrders();
    } catch (error) {
      message.error('审核失败: ' + (error.message || '未知错误'));
    }
  };

  const handleEvalOk = async (payload) => {
    try {
      const order = orders.find(o => o.id === payload.orderId);
      await submitEvaluation(payload.orderId, {
        evaluator_id: currentUser.id,
        evaluatee_id: order?.receiver_id,
        eval_type: 1, // 下单人评接单人
        score_completion: payload.score_completion || null,
        score_communication_creator: payload.score_communication || null,
        score_understanding: payload.score_understanding || null,
        score_technical: payload.score_technical || null,
        score_design: payload.score_design || null,
        overall_score: payload.overall_score,
        comment: payload.comment,
      });
      setEvalOpen(false);
      message.success('评价已提交');
      fetchOrders();
    } catch (error) {
      message.error('评价提交失败: ' + (error.message || '未知错误'));
    }
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
    // 修改单模式下只显示修改单，替换所有任务
    setTasks([newTask]);
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
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddTask}
                disabled={tasks.some(t => t.orderType === 2)}
              >
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
            {/* 视图切换 */}
            <Button.Group>
              <Button 
                icon={<UnorderedListOutlined />} 
                type={viewMode === 'table' ? 'primary' : 'default'}
                onClick={() => setViewMode('table')}
              >
                表格视图
              </Button>
              <Button 
                icon={<AppstoreOutlined />} 
                type={viewMode === 'board' ? 'primary' : 'default'}
                onClick={() => setViewMode('board')}
              >
                看板视图
              </Button>
            </Button.Group>
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
        {viewMode === 'table' ? (
          filteredOrders.length > 0 ? (
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
              onDeal={handleDeal}
              onCutInLineProcess={handleCutInLineProcess}
              onCutInLineRequest={handleCutInLineRequest}
              currentUserId={currentUser.id}
            />
          ) : (
            <Empty description={searchText || activeFilterCount > 0 ? '没有符合条件的订单' : '暂无订单数据'} />
          )
        ) : (
          <DealBoard 
            orders={filteredOrders} 
            onDealClick={handleDeal}
          />
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
      <DealStatusModal
        open={dealOpen}
        order={activeOrder}
        currentUser={currentUser}
        onCancel={() => setDealOpen(false)}
        onUpdate={handleDealUpdate}
      />
    </div>
  );
}

export default OrderManage;
