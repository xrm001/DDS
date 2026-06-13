import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, UndoOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;

const STATUS_MAP = {
  0: { label: '草稿', color: 'default' },
  1: { label: '已发送', color: 'success' },
  2: { label: '已撤回', color: 'warning' },
};

// 通知管理页面
function NotificationManage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/notifications');
      if (res.data.success) setNotifications(res.data.data || []);
    } catch { message.error('加载通知列表失败'); }
    finally { setLoading(false); }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      target_roles: record.target_roles ? record.target_roles.split(',') : [],
    });
    setModalOpen(true);
  };

  // 保存（发送或草稿）
  const handleSave = async (asDraft = false) => {
    try {
      const values = await form.validateFields();
      const status = asDraft ? 0 : 1;
      const payload = {
        ...values,
        target_roles: Array.isArray(values.target_roles) ? values.target_roles.join(',') : values.target_roles,
        status,
      };

      const url = editingItem
        ? `/api/admin/notifications/${editingItem.id}`
        : '/api/admin/notifications';
      const method = editingItem ? 'put' : 'post';

      const res = await axios[method](url, payload);
      if (res.data.success) {
        message.success(res.data.message || '操作成功');
        setModalOpen(false);
        fetchNotifications();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch (error) {
      if (error.errorFields) return; // 表单校验失败
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/admin/notifications/${id}`);
      if (res.data.success) { message.success('删除成功'); fetchNotifications(); }
    } catch { message.error('删除失败'); }
  };

  const handleSend = async (id) => {
    try {
      const res = await axios.put(`/api/admin/notifications/${id}/send`);
      if (res.data.success) { message.success('发送成功'); fetchNotifications(); }
    } catch { message.error('发送失败'); }
  };

  const handleRecall = async (id) => {
    try {
      const res = await axios.put(`/api/admin/notifications/${id}/recall`);
      if (res.data.success) { message.success('撤回成功'); fetchNotifications(); }
    } catch { message.error('撤回失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '目标角色', dataIndex: 'target_roles', key: 'target_roles', width: 200,
      render: (v) => v ? v.split(',').map((r, i) => <Tag key={i}>{r.trim()}</Tag>) : <Tag color="green">全部</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v) => {
        const s = STATUS_MAP[v] || STATUS_MAP[0];
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作', key: 'actions', width: 180,
      render: (_, record) => {
        const s = record.status;
        return (
          <Space size={4}>
            {/* status=0 草稿：修改 + 发送 */}
            {s === 0 && (
              <>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>修改</Button>
                <Popconfirm title="确认发送该通知？" onConfirm={() => handleSend(record.id)}>
                  <Button type="link" size="small" icon={<SendOutlined />}>发送</Button>
                </Popconfirm>
              </>
            )}
            {/* status=1 已发送：撤回 */}
            {s === 1 && (
              <Popconfirm title="确认撤回该通知？" onConfirm={() => handleRecall(record.id)}>
                <Button type="link" size="small" icon={<UndoOutlined />}>撤回</Button>
              </Popconfirm>
            )}
            {/* status=2 已撤回：修改 */}
            {s === 2 && (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>修改</Button>
            )}
            <Popconfirm title="确认删除该通知？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title="通知管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建通知</Button>}
    >
      <Table rowKey="id" columns={columns} dataSource={notifications} loading={loading}
        pagination={{ defaultPageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />

      <Modal
        title={editingItem ? '编辑通知' : '新建通知'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={520}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>取消</Button>,
          <Button key="draft" onClick={() => handleSave(true)}>存为草稿</Button>,
          <Button key="send" type="primary" onClick={() => handleSave(false)}>发送</Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="通知标题" rules={[{ required: true, message: '请输入通知标题' }]}>
            <Input placeholder="请输入通知标题" maxLength={100} />
          </Form.Item>
          <Form.Item name="content" label="通知内容" rules={[{ required: true, message: '请输入通知内容' }]}>
            <TextArea rows={5} placeholder="请输入通知内容" maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="target_roles" label="目标角色（留空表示全部用户）">
            <Select mode="multiple" placeholder="选择目标角色（可多选）" allowClear
              options={[
                { value: '业务下单人', label: '业务下单人' },
                { value: '运营下单人', label: '运营下单人' },
                { value: '新媒体运营下单人', label: '新媒体运营下单人' },
                { value: '3D接单人', label: '3D接单人' },
                { value: '平面接单人', label: '平面接单人' },
                { value: '品牌接单人', label: '品牌接单人' },
                { value: '摄影接单人', label: '摄影接单人' },
                { value: '负责人', label: '负责人' },
                { value: '系统管理员', label: '系统管理员' },
              ]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default NotificationManage;
