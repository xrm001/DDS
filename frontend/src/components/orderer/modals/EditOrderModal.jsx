import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { TASK_TYPES } from '../../../constants/enums';
import { REGIONS } from '../../../constants/regions';

const { TextArea } = Input;

// 读取文件为 Base64 字符串
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 修改订单弹框：任务名称、需求描述、任务类型、客户名称、国籍地区、附件文件
function EditOrderModal({ open, order, onCancel, onOk }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 打开时填充初值
  useEffect(() => {
    if (open && order) {
      form.setFieldsValue({
        task_name: order.task_name,
        requirement_desc: order.requirement_desc,
        task_type_id: order.task_type_id,
        customer_name: order.customer_name,
        customer_region: order.customer_region,
        fileList: [],
      });
    }
  }, [open, order, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 处理附件：将文件转为 Base64
      const attachments = [];
      if (values.fileList && values.fileList.length > 0) {
        for (const file of values.fileList) {
          if (file.originFileObj) {
            try {
              const fileBase64 = await readFileAsBase64(file.originFileObj);
              attachments.push({
                file_name: file.name,
                mime_type: file.type || 'application/octet-stream',
                file_type: 1, // 过程文件
                file_buffer: fileBase64,
              });
            } catch (readError) {
              console.error(`读取文件 ${file.name} 失败:`, readError);
              attachments.push({
                file_name: file.name,
                mime_type: file.type || 'application/octet-stream',
                file_type: 1,
              });
            }
          }
        }
      }

      // 传递给父组件：订单字段 + 附件数据
      await onOk({
        id: order.id,
        task_name: values.task_name,
        requirement_desc: values.requirement_desc,
        task_type_id: values.task_type_id,
        customer_name: values.customer_name,
        customer_region: values.customer_region,
        attachments,
      });

      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return; // 表单校验失败，不处理
      message.error('保存失败：' + (err.message || '未知错误'));
    } finally {
      setSubmitting(false);
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
      confirmLoading={submitting}
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
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item
          name="customer_region"
          label="客户国籍/地区"
        >
          <Select
            showSearch
            allowClear
            options={REGIONS.map((r) => ({ value: r, label: r }))}
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
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
