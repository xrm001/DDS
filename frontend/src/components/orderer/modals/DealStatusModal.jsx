import { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Space, Tag, message, Alert } from 'antd';
import { DollarOutlined, EuroOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { DEAL_STATUS } from '../../../constants/enums';

const { Option } = Select;

// 成交状态管理弹窗
// 权限说明：
// - 下单人：可修改成交状态和金额
// - 管理员/负责人：只读查看
// - 接单人：仅可见成交金额（用于KPI统计）
function DealStatusModal({ open, order, currentUser, onCancel, onUpdate }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 判断当前用户角色
  const userRole = currentUser?.roles?.[0]?.role_name;
  const isCreator = currentUser?.userId === order?.creator_id; // 下单人
  const isReceiver = currentUser?.userId === order?.receiver_id; // 接单人
  const isManager = userRole === '负责人' || userRole === '管理员'; // 管理员/负责人

  // 是否可编辑（仅下单人可编辑）
  const canEdit = isCreator;

  useEffect(() => {
    if (open && order) {
      form.setFieldsValue({
        deal_status: order.deal_status || 7, // 默认待确认
        deal_amount: order.deal_amount || null,
        currency: order.currency || 'CNY',
      });
    }
  }, [open, order, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证成交金额
      if (values.deal_status === 9 && (!values.deal_amount || values.deal_amount <= 0)) {
        message.error('已成交状态必须填写大于0的成交金额');
        return;
      }

      setLoading(true);
      
      // 模拟更新
      setTimeout(() => {
        if (onUpdate) {
          onUpdate(order.id, {
            deal_status: values.deal_status,
            deal_amount: values.deal_amount,
            currency: values.currency,
            deal_updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          });
        }
        message.success('成交状态更新成功');
        onCancel();
        setLoading(false);
      }, 500);
    } catch (error) {
      setLoading(false);
    }
  };

  if (!order) return null;

  // 计算是否超过3天未更新
  const dealUpdatedAt = order.deal_updated_at || order.completed_at;
  const isOverdue = dealUpdatedAt && dayjs().diff(dayjs(dealUpdatedAt), 'day') > 3;

  return (
    <Modal
      title={`成交状态管理 - ${order.order_no}`}
      open={open}
      onCancel={onCancel}
      onOk={canEdit ? handleSubmit : undefined}
      okText={canEdit ? '保存' : '关闭'}
      cancelText="关闭"
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      {/* 权限提示 */}
      {!canEdit && (
        <Alert
          message={
            isManager
              ? '您有查看权限，但无法修改成交状态。请联系下单人进行更新。'
              : isReceiver
              ? '您仅可查看成交金额，无法修改成交状态。'
              : '您没有权限查看或修改此订单的成交状态。'
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 超期警告 */}
      {isOverdue && (
        <Alert
          message="此订单成交状态已超过3天未更新"
          description="请尽快更新成交状态，以便进行统计分析。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical">
        {/* 订单基本信息 */}
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 6 }}>
          <Space>
            <span style={{ fontWeight: 600 }}>订单编号：</span>
            <Tag color="blue">{order.order_no}</Tag>
            <span style={{ fontWeight: 600 }}>任务名称：</span>
            <span>{order.task_name}</span>
          </Space>
        </div>

        {/* 成交状态 */}
        <Form.Item
          label="成交状态"
          name="deal_status"
          rules={[{ required: true, message: '请选择成交状态' }]}
        >
          <Select disabled={!canEdit} placeholder="选择成交状态">
            {Object.entries(DEAL_STATUS).map(([value, config]) => (
              <Option key={value} value={parseInt(value)}>
                <Tag color={config.color}>{config.label}</Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 成交金额 */}
        <Form.Item
          label="成交金额"
          name="deal_amount"
          rules={[
            { required: true, message: '请输入成交金额' },
            { type: 'number', min: 0.01, message: '成交金额必须大于0' },
          ]}
        >
          <InputNumber
            disabled={!canEdit}
            style={{ width: '100%' }}
            placeholder="请输入成交金额"
            precision={2}
            min={0.01}
            step={0.01}
            addonBefore={
              <Form.Item name="currency" noStyle>
                <Select disabled={!canEdit} style={{ width: 80 }}>
                  <Option value="CNY">¥</Option>
                  <Option value="USD">$</Option>
                </Select>
              </Form.Item>
            }
          />
        </Form.Item>

        {/* 最后更新时间 */}
        {dealUpdatedAt && (
          <Form.Item label="最后更新时间">
            <div style={{ color: isOverdue ? '#ff4d4f' : '#8c8c8c' }}>
              {dealUpdatedAt}
              {isOverdue && ' (已超期)'}
            </div>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default DealStatusModal;
