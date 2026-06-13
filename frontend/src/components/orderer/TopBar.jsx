import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Tag, Button, Space, Modal, Popover, List, Avatar, Empty, message } from 'antd';
import { BellOutlined, LogoutOutlined, UserOutlined, NotificationOutlined, MessageOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE = '/api';

// 顶部标题栏组件（通知中心自包含）
// props:
//   user: 当前用户信息 { id, username, realName, roles }
//   onOpenChat: 可选，点击聊天通知时的回调 (orderId) => void
function TopBar({ user, onOpenChat }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(dayjs());
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [notifyList, setNotifyList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [detailModal, setDetailModal] = useState(null); // { title, content, created_at, sender_name }
  const timerRef = useRef(null);
  const suppressPopoverRef = useRef(false); // 点击后短暂禁止popover重开

  // 每秒刷新当前时间
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取未读计数
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_BASE}/notify/unread-count`, {
        headers: { 'x-user-id': user.id }
      });
      if (res.data.success) {
        setUnreadCount(res.data.data.total);
      }
    } catch { /* ignore */ }
  }, [user?.id]);

  // 获取通知列表
  const fetchNotifyList = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_BASE}/notify/list`, {
        headers: { 'x-user-id': user.id }
      });
      if (res.data.success) {
        setNotifyList(res.data.data || []);
      }
    } catch { /* ignore */ }
  }, [user?.id]);

  // 初始加载 + 轮询（每30秒）
  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadCount();
    fetchNotifyList();
    timerRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [user?.id, fetchUnreadCount, fetchNotifyList]);

  // Popover打开时刷新列表
  const handlePopoverChange = (visible) => {
    // 如果刚点击了通知项，短暂禁止popover重新打开
    if (visible && suppressPopoverRef.current) return;
    setPopoverOpen(visible);
    if (visible) {
      fetchNotifyList();
    }
  };

  // 标记单条已读
  const markRead = useCallback(async (source_type, source_id) => {
    if (!user?.id) return;
    try {
      await axios.put(`${API_BASE}/notify/read`,
        { source_type, source_id },
        { headers: { 'x-user-id': user.id } }
      );
    } catch { /* ignore */ }
  }, [user?.id]);

  // 全部标记已读
  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await axios.put(`${API_BASE}/notify/read-all`, {}, {
        headers: { 'x-user-id': user.id }
      });
      setNotifyList(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      message.success('全部已标记为已读');
    } catch { /* ignore */ }
  }, [user?.id]);

  // 退出登录
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '退出',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('dds_user');
        navigate('/login');
      },
    });
  };

  // 根据用户角色获取订单管理页路径
  const getOrderManagePath = () => {
    const roles = user?.roles || [];
    const hasRole = (kw) => roles.some(r => new RegExp(kw).test(r?.role_name || ''));
    if (hasRole('负责人|经理|主管')) return '/manager/orderer';
    if (hasRole('接单人|接单组长')) return '/receiver';
    return '/orderer';
  };

  // 判断当前是否在订单管理页
  const isOnOrderPage = () => {
    const path = window.location.pathname;
    return path === '/orderer' || path === '/receiver' ||
           path === '/manager/orderer' || path === '/manager/receiver';
  };

  // 点击通知项
  const handleItemClick = async (item) => {
    // 标记已读
    await markRead(item.source_type, item.source_id);

    // 更新本地状态
    setNotifyList(prev => prev.map(n => n.id === item.id ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // 禁止popover在关闭后重新打开（hover仍在区域内）
    suppressPopoverRef.current = true;
    setTimeout(() => { suppressPopoverRef.current = false; }, 500);
    setPopoverOpen(false);

    if (item.source_type === 'notification') {
      // 系统通知 → 弹窗显示详情
      setDetailModal({
        title: item.title,
        content: item.content,
        created_at: item.created_at,
        sender_name: item.sender_name,
      });
    } else if (item.source_type === 'message') {
      // 聊天消息 → 打开聊天框 + 订单滚动置顶
      const action = { type: 'chat', orderId: item.order_id, orderNo: item.order_no };
      localStorage.setItem('dds_pending_action', JSON.stringify(action));

      if (isOnOrderPage()) {
        // 已在订单页：直接派发事件
        window.dispatchEvent(new CustomEvent('dds-open-chat', { detail: action }));
        localStorage.removeItem('dds_pending_action');
      } else {
        // 不在订单页：跳转到订单管理页（页面加载后会检查pending action）
        navigate(getOrderManagePath());
      }
      // 从列表中移除已处理的消息
      setNotifyList(prev => prev.filter(n => n.id !== item.id));
    } else if (item.source_type === 'order') {
      // 订单状态变更 → 滚动到该订单置顶
      const action = { type: 'scroll', orderId: item.order_id };
      localStorage.setItem('dds_pending_action', JSON.stringify(action));

      if (isOnOrderPage()) {
        window.dispatchEvent(new CustomEvent('dds-scroll-to-order', { detail: action }));
        localStorage.removeItem('dds_pending_action');
      } else {
        navigate(getOrderManagePath());
      }
      // 从列表中移除已处理的订单
      setNotifyList(prev => prev.filter(n => n.id !== item.id));
    }
  };

  // 获取通知类型图标
  const getIcon = (sourceType) => {
    switch (sourceType) {
      case 'notification':
        return <NotificationOutlined style={{ color: '#667eea' }} />;
      case 'message':
        return <MessageOutlined style={{ color: '#52c41a' }} />;
      case 'order':
        return <ShoppingCartOutlined style={{ color: '#faad14' }} />;
      default:
        return <BellOutlined style={{ color: '#595959' }} />;
    }
  };

  // 获取头像背景色
  const getAvatarBg = (sourceType) => {
    switch (sourceType) {
      case 'notification': return '#f0f2ff';
      case 'message': return '#f0fff4';
      case 'order': return '#fffbe6';
      default: return '#f0f2f5';
    }
  };

  // 列表显示规则：notification保留（已读去红点），message/order已读后移除
  const displayItems = notifyList.filter(n =>
    n.source_type === 'notification' || !n.is_read
  );
  const unreadItems = displayItems.filter(n => !n.is_read);

  // 通知列表内容
  const notificationContent = (
    <div style={{ width: 420, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>
          通知中心 {unreadCount > 0 && `(${unreadCount}条未读)`}
        </span>
        {unreadItems.length > 0 && (
          <Button type="link" size="small" onClick={markAllRead}>
            全部已读
          </Button>
        )}
      </div>
      {displayItems.length > 0 ? (
        <List
          dataSource={displayItems}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{
                padding: '10px 8px',
                background: item.is_read ? '#fff' : '#f6f8ff',
                borderRadius: 6,
                marginBottom: 6,
                cursor: 'pointer',
                border: item.is_read ? '1px solid #f0f0f0' : '1px solid #d6e4ff',
                transition: 'all 0.2s',
              }}
              onClick={() => handleItemClick(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: getAvatarBg(item.source_type) }}>
                    {getIcon(item.source_type)}
                  </Avatar>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {!item.is_read && (
                        <span style={{
                          display: 'inline-block',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#ff4d4f',
                          marginRight: 6,
                          verticalAlign: 'middle',
                        }} />
                      )}
                      {item.title}
                    </span>
                  </div>
                }
                description={
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                    <span>{item.sender_name || ''}</span>
                    {item.status_text && <Tag color="processing" style={{ marginLeft: 4, fontSize: 11 }}>{item.status_text}</Tag>}
                    {item.order_no && <span style={{ marginLeft: 4 }}>{item.order_no}</span>}
                    <span style={{ marginLeft: 8 }}>{dayjs(item.created_at).format('MM-DD HH:mm')}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          height: 60,
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.04)',
        }}
      >
        {/* 左：系统名称 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            DDS
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: '#262626' }}>
            视觉设计派单管理系统
          </span>
        </div>

        {/* 右：时间 + 用户信息 + 铃铛 + 退出 */}
        <Space size={20} align="center">
          <span style={{ color: '#595959', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
            {now.format('YYYY-MM-DD HH:mm:ss')}
          </span>

          <Space size={8}>
            <UserOutlined style={{ color: '#667eea' }} />
            <span style={{ color: '#262626', fontWeight: 500 }}>
              {user?.realName || user?.username}
            </span>
            {user?.roles?.map((role) => (
              <Tag key={role.id} color="processing">
                {role.role_name}
              </Tag>
            ))}
          </Space>

          <Popover
            content={notificationContent}
            title={null}
            trigger="hover"
            open={popoverOpen}
            onOpenChange={handlePopoverChange}
            placement="bottomRight"
            overlayStyle={{ width: 440 }}
          >
            <Badge count={unreadCount} size="small" offset={[-2, 2]} showZero>
              <BellOutlined
                style={{
                  fontSize: 18,
                  color: unreadCount > 0 ? '#1677ff' : '#595959',
                  cursor: 'pointer'
                }}
              />
            </Badge>
          </Popover>

          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
            退出
          </Button>
        </Space>
      </div>

      {/* 通知详情弹窗 */}
      <Modal
        title={detailModal?.title || '通知详情'}
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setDetailModal(null)}>知道了</Button>
        ]}
        width={500}
      >
        {detailModal && (
          <div>
            <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 13 }}>
              <span>发送人：{detailModal.sender_name}</span>
              <span style={{ marginLeft: 16 }}>{dayjs(detailModal.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
            <div style={{
              padding: '16px',
              background: '#f6f8ff',
              borderRadius: 8,
              border: '1px solid #e8edff',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
            }}>
              {detailModal.content}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default TopBar;
