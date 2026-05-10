import { useEffect } from 'react';
import { Modal, Form, Input, Select, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TASK_TYPES, PRIORITIES } from '../../../constants/enums';
import { REGIONS } from '../../../constants/regions';

const { TextArea } = Input;

// 修改订单弹框：任务名称、需求描述、任务类型、附件、客户名称、国籍地区、任务优先度
function EditOrderModal({ open, order, onCancel, onOk }) {
  const [form] = Form.useForm();

  // 打开时填充初值
  useEffect(() => {
    if (open && order) {
      form.setFieldsValue({
        task_name: order.task_name,
        requirement_desc: order.requirement_desc,
        task_type_id: order.task_type_id,
        customer_name: order.customer_name,
        customer_region: order.customer_region,
        priority: order.priority,
        fileList: [],
      });
    }
  }, [open, order, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({ ...order, ...values });
      form.resetFields();
    } catch {
      /* 校验失败 */
    }
  };

  return (
    <Modal
      title={`修改订单 - ${order?.order_no || ''}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="保存修改"
      cancelText="取消"
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="task_name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="requirement_desc" label="需求描述">
          <TextArea rows={3} maxLength={1000} showCount />
        </Form.Item>
        <Form.Item
          name="task_type_id"
          label="任务类型"
          rules={[{ required: true, message: '请选择任务类型' }]}
        >
          <Select
            options={TASK_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </Form.Item>
        <Form.Item
          name="customer_name"
          label="客户名称"
          rules={[{ required: true, message: '请输入客户名称' }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item
          name="customer_region"
          label="客户国籍/地区"
          rules={[{ required: true, message: '请选择国家或地区' }]}
        >
          <Select
            showSearch
            options={REGIONS.map((r) => ({ value: r, label: r }))}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item
          name="priority"
          label="任务优先度"
          rules={[{ required: true, message: '请选择优先级' }]}
        >
          <Select
            options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
          />
        </Form.Item>
        <Form.Item name="fileList" label="附件文件" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
          <Upload listType="picture-card" beforeUpload={() => false} multiple>
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 6 }}>上传</div>
            </div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditOrderModal;
