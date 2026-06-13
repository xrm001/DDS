import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Popconfirm, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Search } = Input;

// 人员管理页面
function UserManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users');
      if (res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (error) {
      message.error('加载人员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (error) {
      console.error('加载部门失败:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/admin/roles');
      if (res.data.success) {
        setRoles(res.data.data || []);
      }
    } catch (error) {
      console.error('加载角色失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      real_name: record.real_name,
      dept_id: record.dept_id,
      phone: record.phone,
      email: record.email,
      status: record.status ?? 1,
      class: record.class,
      job: record.job,
      super_id: record.super_id,
      role_ids: record.roles?.map(r => r.id) || [],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      const method = editingUser ? 'put' : 'post';
      
      const res = await axios[method](url, values);
      if (res.data.success) {
        message.success(editingUser ? '修改成功' : '新增成功');
        setModalOpen(false);
        fetchUsers();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('操作失败');
      }
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/reset-password`);
      if (res.data.success) {
        message.success('密码已重置为: 123456');
      }
    } catch (error) {
      message.error('重置密码失败');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/status`, {
        status: currentStatus === 1 ? 0 : 1
      });
      if (res.data.success) {
        message.success(currentStatus === 1 ? '已禁用' : '已启用');
        fetchUsers();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 筛选后的用户列表
  const filteredUsers = users.filter(u => {
    if (!searchText) return true;
    const kw = searchText.toLowerCase();
    return (
      u.username?.toLowerCase().includes(kw) ||
      u.real_name?.toLowerCase().includes(kw) ||
      u.department_name?.toLowerCase().includes(kw) ||
      u.roles?.some(r => r.role_name?.toLowerCase().includes(kw))
    );
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 120,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>未分配</span>,
    },
    {
      title: '角色',
      key: 'roles',
      width: 200,
      render: (_, record) => (
        <Space wrap size={4}>
          {record.roles?.map(r => (
            <Tag key={r.id} color="blue">{r.role_name}</Tag>
          )) || <span style={{ color: '#bfbfbf' }}>未分配</span>}
        </Space>
      ),
    },
    {
      title: '手机',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (v) => v || '-',
    },
    {
      title: '班级/组别',
      dataIndex: 'class',
      key: 'class',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '职位',
      dataIndex: 'job',
      key: 'job',
      width: 100,
      render: (v) => v || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '上级人员',
      dataIndex: 'super_name',
      key: 'super_name',
      width: 100,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>-</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v) => (
        <Tag color={v === 1 ? 'success' : 'error'}>
          {v === 1 ? '启用' : '禁用'}
        </Tag>
      ),
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
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认重置密码为 123456？"
            onConfirm={() => handleResetPassword(record.id)}
          >
            <Button type="link" size="small" icon={<LockOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
          <Popconfirm
            title={`确认${record.status === 1 ? '禁用' : '启用'}该用户？`}
            onConfirm={() => handleToggleStatus(record.id, record.status)}
          >
            <Button
              type="link"
              size="small"
              danger={record.status === 1}
              icon={<UserOutlined />}
            >
              {record.status === 1 ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="人员管理"
      extra={
        <Space>
          <Search
            placeholder="搜索用户名/姓名/部门/角色"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增人员
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredUsers}
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          defaultPageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingUser ? '编辑人员' : '新增人员'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="用户名（登录账号）"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[{ required: true, message: '请输入初始密码' }]}
              initialValue="123456"
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}
          <Form.Item
            name="real_name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="dept_id" label="部门">
                <Select
                  placeholder="选择部门"
                  allowClear
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue={1}>
                <Select
                  options={[
                    { value: 1, label: '启用' },
                    { value: 0, label: '禁用' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="class" label="班级/组别">
                <Input placeholder="如: A组" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="job" label="职位">
                <Input placeholder="如: 设计师" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="super_id" label="上级人员">
                <Select
                  placeholder="选择上级人员"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={users
                    .filter(u => !editingUser || u.id !== editingUser.id)
                    .map(u => ({ value: u.id, label: u.real_name || u.username }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="role_ids" label="角色（可多选）">
            <Select
              mode="multiple"
              placeholder="选择角色"
              options={roles.map(r => ({ value: r.id, label: r.role_name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default UserManage;
