import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

// 任务类型管理页面
function TaskTypeManage() {
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  const fetchTaskTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/task-types');
      if (res.data.success) {
        setTaskTypes(res.data.data || []);
      }
    } catch (error) {
      message.error('加载任务类型列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingType(record);
    form.setFieldsValue({
      type_name: record.type_name,
      type_code: record.type_code,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const url = editingType
        ? `/api/admin/task-types/${editingType.id}`
        : '/api/admin/task-types';
      const method = editingType ? 'put' : 'post';

      const res = await axios[method](url, values);
      if (res.data.success) {
        message.success(editingType ? '修改成功' : '新增成功');
        setModalOpen(false);
        fetchTaskTypes();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '类型名称',
      dataIndex: 'type_name',
      key: 'type_name',
      width: 140,
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '类型编码',
      dataIndex: 'type_code',
      key: 'type_code',
      width: 120,
      render: (v) => <code>{v}</code>,
    },
    {
      title: '派单角色',
      dataIndex: 'dispatch_roles',
      key: 'dispatch_roles',
      width: 200,
      render: (v) => v ? v.split(',').map((r, i) => <Tag key={i} color="green">{r.trim()}</Tag>) : <span style={{ color: '#bfbfbf' }}>未配置</span>,
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 90,
      render: (v) => <Tag>{v || 0}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="任务类型配置"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增类型
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={taskTypes}
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingType ? '编辑任务类型' : '新增任务类型'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="type_name"
            label="类型名称"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="如: 平面设计" />
          </Form.Item>
          <Form.Item
            name="type_code"
            label="类型编码"
            rules={[{ required: true, message: '请输入类型编码' }]}
          >
            <Input placeholder="如: graphic" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default TaskTypeManage;
