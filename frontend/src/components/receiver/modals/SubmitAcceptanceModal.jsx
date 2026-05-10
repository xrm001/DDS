import { Modal, Input, Upload, Button, message, Descriptions, Space, Tag } from 'antd';
import { UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { TextArea } = Input;

// 提交验收弹框（接单人视角）
// props:
//   open, order, onCancel
//   onOk(order, payload) -> payload: { description, files }
function SubmitAcceptanceModal({ open, order, onCancel, onOk }) {
  const [description, setDescription] = useState('');
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (open) {
      setDescription('');
      setFileList([]);
    }
  }, [open]);

  if (!order) return null;

  // 已有的历史次数
  const historyCount = (order.acceptance_history || []).length;

  const handleSubmit = () => {
    if (!description.trim()) {
      message.warning('请填写提交说明');
      return;
    }
    if (fileList.length === 0) {
      message.warning('请上传至少一个成果文件');
      return;
    }
    // 转换为 { id, name, url } 格式
    const files = fileList.map((f, idx) => ({
      id: idx + 1,
      name: f.name,
      // 本地预览：如果有 originFileObj 则用 blob，否则用 thumbUrl/url
      url:
        f.url ||
        f.thumbUrl ||
        (f.originFileObj ? URL.createObjectURL(f.originFileObj) : ''),
    }));
    onOk(order, { description: description.trim(), files });
  };

  // 选择文件（本地模拟）
  const beforeUpload = (file) => {
    // 生成本地预览 URL
    const preview = URL.createObjectURL(file);
    setFileList((prev) => [
      ...prev,
      {
        uid: String(file.uid || Date.now() + Math.random()),
        name: file.name,
        status: 'done',
        url: preview,
        thumbUrl: preview,
        originFileObj: file,
      },
    ]);
    return false; // 阻止自动上传
  };

  const handleRemove = (file) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  return (
    <Modal
      title={
        <Space>
          <span>提交验收</span>
          <Tag color="blue">{order.order_no}</Tag>
          {historyCount > 0 && <Tag color="orange">第 {historyCount + 1} 次提交</Tag>}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="提交验收"
      cancelText="取消"
      width={680}
      destroyOnClose
    >
      <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
        <Descriptions.Item label="任务名称">{order.task_name}</Descriptions.Item>
        <Descriptions.Item label="客户">{order.customer_name}</Descriptions.Item>
        <Descriptions.Item label="截止时间">{order.deadline}</Descriptions.Item>
        <Descriptions.Item label="需求说明" span={2}>
          {order.requirement_desc}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginBottom: 6, color: '#262626', fontWeight: 500 }}>
        提交说明 <span style={{ color: '#ff4d4f' }}>*</span>
      </div>
      <TextArea
        rows={4}
        placeholder="请简要描述本次提交的内容、完成情况、注意事项等"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        showCount
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 6, color: '#262626', fontWeight: 500 }}>
        成果文件 <span style={{ color: '#ff4d4f' }}>*</span>
      </div>
      <Upload
        multiple
        beforeUpload={beforeUpload}
        fileList={fileList}
        onRemove={handleRemove}
        listType="picture"
        accept="image/*,.psd,.ai,.pdf,.zip"
      >
        <Button icon={<UploadOutlined />}>选择文件</Button>
        <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: 12 }}>
          支持图片 / PSD / AI / PDF / ZIP
        </span>
      </Upload>
    </Modal>
  );
}

export default SubmitAcceptanceModal;
