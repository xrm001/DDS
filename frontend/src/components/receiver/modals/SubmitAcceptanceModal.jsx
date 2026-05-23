import { Modal, Input, Upload, Button, message, Descriptions, Space, Tag } from 'antd';
import { UploadOutlined, PictureOutlined, RollbackOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

const { TextArea } = Input;

// 提交验收弹框（接单人视角）
// props:
//   open, order, onCancel
//   onOk(order, payload) -> payload: { description, files }
//   onReturn(order, reason) -> 退单处理
function SubmitAcceptanceModal({ open, order, onCancel, onOk, onReturn }) {
  const [description, setDescription] = useState('');
  const [fileList, setFileList] = useState([]);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    if (open) {
      setDescription('');
      setFileList([]);
      setReturnModalVisible(false);
      setReturnReason('');
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

  const handleReturnOrder = () => {
    if (!returnReason.trim()) {
      message.warning('请填写退单理由');
      return;
    }
    if (onReturn) {
      onReturn(order, returnReason.trim());
    }
    setReturnModalVisible(false);
    setReturnReason('');
    onCancel();
  };

  return (
    <>
      {/* 主弹框：提交验收 */}
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
        footer={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0 24px 16px 0'
          }}>
            <Button
              danger
              icon={<RollbackOutlined />}
              onClick={() => setReturnModalVisible(true)}
              size="large"
            >
              退单
            </Button>
            <Space size="middle">
              <Button onClick={onCancel} size="large">
                取消
              </Button>
              <Button type="primary" onClick={handleSubmit} size="large">
                提交验收
              </Button>
            </Space>
          </div>
        }
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

      {/* 退单确认弹框 */}
      <Modal
        title={
          <Space>
            <span style={{ color: '#ff4d4f' }}>退单确认</span>
            <Tag color="blue">{order.order_no}</Tag>
          </Space>
        }
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        onOk={handleReturnOrder}
        okText="确认退单"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={520}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: '#8c8c8c', fontSize: 14 }}>
            订单信息：
          </div>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
            <Descriptions.Item label="任务名称">{order.task_name}</Descriptions.Item>
            <Descriptions.Item label="客户">{order.customer_name}</Descriptions.Item>
          </Descriptions>
        </div>

        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
          <div style={{ color: '#faad14', fontWeight: 500, marginBottom: 4 }}>
            ⚠️ 退单说明
          </div>
          <div style={{ color: '#595959', fontSize: 13, lineHeight: 1.6 }}>
            退单后，订单状态将变更为“待接单”，该订单将返回待接单池。请确认是否继续操作。
          </div>
        </div>

        <div style={{ marginBottom: 6, color: '#262626', fontWeight: 500 }}>
          退单理由 <span style={{ color: '#ff4d4f' }}>*</span>
        </div>
        <TextArea
          rows={4}
          placeholder="请说明退单原因，例如：技术实现困难、需求不明确、时间不足等"
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </>
  );
}

export default SubmitAcceptanceModal;
