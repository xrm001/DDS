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
  const [dealStatus, setDealStatus] = useState(7);

  // 判断当前用户角色
  const userRole = currentUser?.roles?.[0]?.role_name;
  const isCreator = currentUser?.id === order?.creator_id; // 下单人
  const isReceiver = currentUser?.id === order?.receiver_id; // 接单人
  const isManager = userRole === '负责人' || userRole === '管理员'; // 管理员/负责人

  // 是否可编辑（仅下单人可编辑）
  const canEdit = isCreator;

  // deal_amount只在deal_status=9时可填写
  const canEditAmount = dealStatus === 9;

  useEffect(() => {
    if (open && order) {
      const status = order.deal_status || 7;
      setDealStatus(status);
      form.setFieldsValue({
        deal_status: status,
        deal_amount: order.deal_amount || null,
        currency: order.currency || 'CNY',
      });
    }
  }, [open, order, form]);

  const handleDealStatusChange = (value) => {
    setDealStatus(value);
    // deal_status≠9时，清空金额
    if (value !== 9) {
      form.setFieldsValue({ deal_amount: null });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证成交金额
      if (values.deal_status === 9 && (!values.deal_amount || values.deal_amount <= 0)) {
        message.error('已成交状态必须填写大于0的成交金额');
        return;
      }

      setLoading(true);
      
      if (onUpdate) {
        await onUpdate(order.id, {
          deal_status: values.deal_status,
          deal_amount: values.deal_status === 9 ? values.deal_amount : null,
          currency: values.currency,
        });
      }
      message.success('成交状态更新成功');
      onCancel();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.message) {
        message.error(error.message);
      }
    }
  };

  if (!order) return null;

  // 最后更新时间为completed_at值的后三天（更新截止时间）
  const completedAt = order.completed_at;
  const updateDeadline = completedAt ? dayjs(completedAt).add(3, 'day') : null;
  const isOverdue = updateDeadline && dayjs().isAfter(updateDeadline);

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

        {/* 当前成交金额展示（如果有） */}
        {order.deal_amount && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
            <Space size="large">
              <span style={{ fontWeight: 600, color: '#595959' }}>当前成交金额：</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                {order.currency === 'USD' ? '$' : '¥'}{Number(order.deal_amount).toFixed(2)}
              </span>
            </Space>
          </div>
        )}

        {/* 成交状态 */}
        <Form.Item
          label="成交状态"
          name="deal_status"
          rules={[{ required: true, message: '请选择成交状态' }]}
        >
          <Select disabled={!canEdit} placeholder="选择成交状态" onChange={handleDealStatusChange}>
            {Object.entries(DEAL_STATUS).map(([value, config]) => (
              <Option key={value} value={parseInt(value)}>
                <Tag color={config.color}>{config.label}</Tag>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 成交金额 - 仅deal_status=9(已成交)时可填写 */}
        <Form.Item
          label="成交金额"
          name="deal_amount"
          rules={canEditAmount ? [
            { required: true, message: '请输入成交金额' },
            { type: 'number', min: 0.01, message: '成交金额必须大于0' },
          ] : []}
        >
          <InputNumber
            disabled={!canEdit || !canEditAmount}
            style={{ width: '100%' }}
            placeholder={canEditAmount ? '请输入成交金额' : '仅"已成交"状态可填写金额'}
            precision={2}
            min={0.01}
            step={0.01}
            addonBefore={
              <Form.Item name="currency" noStyle>
                <Select disabled={!canEdit || !canEditAmount} style={{ width: 80 }}>
                  <Option value="CNY">¥</Option>
                  <Option value="USD">$</Option>
                </Select>
              </Form.Item>
            }
          />
        </Form.Item>

        {/* 最后更新时间 = completed_at + 3天 */}
        {updateDeadline && (
          <Form.Item label="更新截止时间">
            <div style={{ color: isOverdue ? '#ff4d4f' : '#8c8c8c' }}>
              {updateDeadline.format('YYYY-MM-DD HH:mm:ss')}
              {isOverdue && <Tag color="red" style={{ marginLeft: 8 }}>已超期</Tag>}
            </div>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default DealStatusModal;
