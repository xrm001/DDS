import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Modal, Form, Select, message, Descriptions } from 'antd';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';

// 派单规则配置页面
function DispatchRuleManage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [roles, setRoles] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRules();
    fetchRoles();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/dispatch-rules');
      if (res.data.success) {
        setRules(res.data.data || []);
      }
    } catch (error) {
      message.error('加载派单规则失败');
    } finally {
      setLoading(false);
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

  const handleEdit = (record) => {
    setEditingRule(record);
    form.setFieldsValue({
      dispatch_roles: record.dispatch_roles?.split(',').map(r => r.trim()) || [],
      dispatch_mode: record.dispatch_mode || 'group',
      status_range: record.status_range || '2,3',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const res = await axios.put(`/api/admin/dispatch-rules/${editingRule.id}`, {
        ...values,
        dispatch_roles: Array.isArray(values.dispatch_roles) ? values.dispatch_roles.join(',') : values.dispatch_roles,
      });
      if (res.data.success) {
        message.success('修改成功');
        setModalOpen(false);
        fetchRules();
      } else {
        message.error(res.data.message || '修改失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '任务类型',
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
      width: 220,
      render: (v) => v ? v.split(',').map((r, i) => <Tag key={i} color="green">{r.trim()}</Tag>) : <span style={{ color: '#bfbfbf' }}>未配置</span>,
    },
    {
      title: '派发模式',
      dataIndex: 'dispatch_mode',
      key: 'dispatch_mode',
      width: 120,
      render: (v) => (
        <Tag color={v === 'person' ? 'purple' : 'cyan'}>
          {v === 'person' ? '按个人' : '按组'}
        </Tag>
      ),
    },
    {
      title: '统计口径',
      dataIndex: 'status_range',
      key: 'status_range',
      width: 120,
      render: (v) => <code>status IN ({v || '2,3'})</code>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          配置
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="派单规则配置"
      extra={
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="负载均衡模式">
            <Tag color="blue">按组/按个人</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="默认统计口径">
            <code>status IN (2, 3)</code>
          </Descriptions.Item>
        </Descriptions>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rules}
        loading={loading}
        pagination={false}
      />

      <Modal
        title={`配置派单规则 - ${editingRule?.type_name || ''}`}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="dispatch_roles"
            label="派单角色（可多选）"
            rules={[{ required: true, message: '请选择派单角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择接单人角色"
              options={roles
                .filter(r => r.role_name?.includes('接单人') || r.role_name === '接单组长')
                .map(r => ({ value: r.role_name, label: r.role_name }))}
            />
          </Form.Item>
          <Form.Item
            name="dispatch_mode"
            label="派发模式"
            initialValue="group"
          >
            <Select
              options={[
                { value: 'group', label: '按组负载均衡' },
                { value: 'person', label: '按个人负载均衡' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="status_range"
            label="负载均衡统计口径"
            initialValue="2,3"
          >
            <Select
              options={[
                { value: '2,3', label: 'status IN (2, 3) - 进行中+待验收' },
                { value: '1,2', label: 'status IN (1, 2) - 待接单+进行中' },
                { value: '1,2,3', label: 'status IN (1, 2, 3) - 待接单+进行中+待验收' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default DispatchRuleManage;
