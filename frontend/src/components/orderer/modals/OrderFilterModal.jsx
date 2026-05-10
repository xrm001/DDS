import { Modal, Form, Input, Select, DatePicker, Row, Col, Button, Space } from 'antd';
import { useEffect } from 'react';
import { TASK_TYPES, PRIORITIES, ORDER_STATUS } from '../../../constants/enums';
import { REGIONS } from '../../../constants/regions';

const { RangePicker } = DatePicker;

// 订单筛选弹框：对订单全字段进行筛选
// props:
//   open, initialValues, onCancel
//   onOk(filterValues) 点击确定时回传筛选条件
//   onReset() 清空筛选
function OrderFilterModal({ open, initialValues, onCancel, onOk, onReset }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues || {});
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onOk(values);
  };

  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };

  // 订单状态 options
  const statusOptions = Object.entries(ORDER_STATUS).map(([value, meta]) => ({
    value: Number(value),
    label: meta.label,
  }));

  return (
    <Modal
      title="订单筛选"
      open={open}
      onCancel={onCancel}
      width={760}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={handleReset}>重置</Button>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleOk}>
            确定筛选
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" size="middle">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="order_no" label="订单编号">
              <Input placeholder="包含匹配，例如 DDS2025" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="task_name" label="任务名称">
              <Input placeholder="包含匹配" allowClear />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="customer_name" label="客户名称">
              <Input placeholder="包含匹配" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customer_region" label="国籍/地区">
              <Select
                mode="multiple"
                allowClear
                placeholder="可多选"
                showSearch
                options={REGIONS.map((r) => ({ value: r, label: r }))}
                maxTagCount={4}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="receiver_name" label="接单人">
              <Input placeholder="包含匹配" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="order_type" label="订单类型">
              <Select allowClear placeholder="全部">
                <Select.Option value={1}>原始订单</Select.Option>
                <Select.Option value={2}>修改单</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="task_type_id" label="任务类型">
              <Select
                mode="multiple"
                allowClear
                placeholder="可多选"
                options={TASK_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="priority" label="优先级">
              <Select
                mode="multiple"
                allowClear
                placeholder="可多选"
                options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="status" label="订单状态">
              <Select mode="multiple" allowClear placeholder="可多选" options={statusOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="is_evaluated_by_creator" label="评价情况">
              <Select allowClear placeholder="全部">
                <Select.Option value={1}>已评价</Select.Option>
                <Select.Option value={0}>未评价</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="created_at_range" label="下单时间">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="deadline_range" label="截止日期">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="completed_at_range" label="结束时间">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default OrderFilterModal;
