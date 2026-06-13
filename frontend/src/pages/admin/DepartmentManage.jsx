import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

// 部门管理页面
function DepartmentManage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (error) {
      message.error('加载部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDept(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingDept(record);
    form.setFieldsValue({
      name: record.name,
      level: record.level,
      parent_id: record.parent_id,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const url = editingDept
        ? `/api/admin/departments/${editingDept.id}`
        : '/api/admin/departments';
      const method = editingDept ? 'put' : 'post';

      const res = await axios[method](url, values);
      if (res.data.success) {
        message.success(editingDept ? '修改成功' : '新增成功');
        setModalOpen(false);
        fetchDepartments();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (deptId) => {
    try {
      const res = await axios.delete(`/api/admin/departments/${deptId}`);
      if (res.data.success) {
        message.success('删除成功');
        fetchDepartments();
      } else {
        message.error(res.data.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，该部门可能还有关联人员');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '部门名称', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>-</span>,
    },
    {
      title: '上级部门ID',
      dataIndex: 'parent_id',
      key: 'parent_id',
      width: 100,
      render: (v) => {
        if (!v) return <span style={{ color: '#bfbfbf' }}>顶级部门</span>;
        const parent = departments.find(d => d.id === v);
        return parent ? parent.name : v;
      },
    },
    {
      title: '部门人数',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 100,
      render: (v) => <Tag>{v || 0} 人</Tag>,
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
      width: 150,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该部门？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={record.user_count > 0}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="部门管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增部门
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={departments}
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingDept ? '编辑部门' : '新增部门'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="如: 设计部" />
          </Form.Item>
          <Form.Item name="level" label="层级">
            <Select
              allowClear
              placeholder="选择层级"
              options={[
                { value: 1, label: '一级部门' },
                { value: 2, label: '二级部门' },
                { value: 3, label: '三级部门' },
              ]}
            />
          </Form.Item>
          <Form.Item name="parent_id" label="上级部门">
            <Select
              allowClear
              placeholder="选择上级部门（留空为顶级部门）"
              options={departments
                .filter(d => !editingDept || d.id !== editingDept.id)
                .map(d => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default DepartmentManage;
