import { Form, Input, Select, DatePicker, Upload, Tag, Button, Row, Col, Card, Space, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { TASK_TYPES, PRIORITIES } from '../../constants/enums';
import { REGIONS } from '../../constants/regions';

const { TextArea } = Input;

// 单个任务下单表单卡片
// props:
//   task: 任务对象 { id, task_name, customer_name, ... orderType: 1|2 }
//   index: 序号
//   onChange(index, partial): 字段变更
//   onRemove(index): 删除此任务
//   showRemove: 是否显示删除按钮（仅 1 项时隐藏）
function TaskForm({ task, index, onChange, onRemove, showRemove, firstInputRef }) {
  // 通用字段修改
  const update = (partial) => onChange(index, partial);

  const isModify = task.orderType === 2;

  // 文件上传（仅前端展示，不做真实上传）
  const beforeUpload = () => false;

  const handleFileChange = ({ fileList }) => {
    update({ fileList });
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 12,
        border: isModify ? '1.5px solid #ff4d4f' : '1px solid #e8e8e8',
        boxShadow: isModify ? '0 0 0 3px rgba(255,77,79,0.08)' : 'none',
      }}
      title={
        <Space>
          <span style={{ color: '#8c8c8c' }}>任务 {index + 1}</span>
          {isModify ? (
            <Tag color="red" style={{ fontWeight: 600 }}>
              修改单
            </Tag>
          ) : (
            <Tag color="blue">原始订单</Tag>
          )}
          {isModify && task.originalOrderNo && (
            <span style={{ color: '#ff4d4f', fontSize: 12 }}>
              关联原单：{task.originalOrderNo}
            </span>
          )}
        </Space>
      }
      extra={
        showRemove && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => onRemove(index)}
          >
            删除
          </Button>
        )
      }
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="任务名称" required style={{ marginBottom: 12 }}>
            <Input
              ref={index === 0 ? firstInputRef : null}
              placeholder="请输入任务名称"
              value={task.task_name}
              onChange={(e) => update({ task_name: e.target.value })}
              maxLength={200}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="客户名称" required style={{ marginBottom: 12 }}>
            <Input
              placeholder="请输入客户名称"
              value={task.customer_name}
              onChange={(e) => update({ customer_name: e.target.value })}
              maxLength={100}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="客户国籍/地区" required style={{ marginBottom: 12 }}>
            <Select
              showSearch
              placeholder="请选择国家或地区"
              value={task.customer_region || undefined}
              onChange={(v) => update({ customer_region: v })}
              options={REGIONS.map((r) => ({ value: r, label: r }))}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="任务类型" required style={{ marginBottom: 12 }}>
            <Select
              placeholder="请选择任务类型"
              value={task.task_type_id || undefined}
              onChange={(v) => update({ task_type_id: v })}
              options={TASK_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="优先级" required style={{ marginBottom: 12 }}>
            <Select
              placeholder="请选择优先级"
              value={task.priority || undefined}
              onChange={(v) => update({ priority: v })}
              options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="截止日期" required style={{ marginBottom: 12 }}>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择截止日期"
              value={task.deadline || null}
              onChange={(v) => update({ deadline: v })}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="需求描述" style={{ marginBottom: 12 }}>
            <TextArea
              rows={3}
              placeholder="请输入详细需求描述"
              value={task.requirement_desc}
              onChange={(e) => update({ requirement_desc: e.target.value })}
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label="上传文件（参考图 / 设计文件）"
            style={{ marginBottom: 0 }}
            extra="支持多文件上传，图片自动显示缩略图"
          >
            <Upload
              listType="picture-card"
              fileList={task.fileList || []}
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              multiple
              itemRender={(originNode, file) => (
                <Tooltip title={file.name} placement="top">
                  {originNode}
                </Tooltip>
              )}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 6 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}

export default TaskForm;
