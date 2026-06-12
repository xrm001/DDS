import { useMemo } from 'react';
import { Card, Form, Input, Select, DatePicker, Upload, Row, Col, Button, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { BUSINESS_TASK_TYPES, OPERATION_TASK_TYPES } from '../../constants/enums';
import { REGIONS } from '../../constants/regions';

const { TextArea } = Input;

// 业务角色
const BUSINESS_ROLE_NAMES = ['业务下单人', '业务主管下单人', '业务部门经理', '销售中心经理'];
const BUSINESS_ROLE_CODES = ['business_orderer', 'business_supervisor', 'business_dept_manager', 'sales_center_manager'];

/**
 * 单个任务表单组件
 * props: task, index, onChange, onRemove, showRemove, firstInputRef, userRoles
 */
function TaskForm({ task, index, onChange, onRemove, showRemove, firstInputRef, userRoles }) {
  const update = (partial) => onChange(index, partial);

  // 角色判断
  const isBusiness = useMemo(() => {
    return userRoles?.some(r =>
      BUSINESS_ROLE_NAMES.includes(r.role_name) || BUSINESS_ROLE_CODES.includes(r.role_code)
    );
  }, [userRoles]);

  // 任务类型选项
  const businessOptions = useMemo(() =>
    BUSINESS_TASK_TYPES.map(t => ({ value: t.value, label: t.label })), []);

  const operationOptions = useMemo(() =>
    OPERATION_TASK_TYPES.map(t => ({ value: t.value, label: t.label })), []);

  // 文件上传处理
  const beforeUpload = () => false; // 阻止自动上传

  const handleFileChange = ({ fileList }) => {
    update({ fileList });
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 12, background: task.orderType === 2 ? '#fff7e6' : undefined }}
      title={
        <span style={{ fontSize: 13 }}>
          {task.orderType === 2 ? `修改单（原单号：${task.originalOrderNo}）` : `任务 ${index + 1}`}
        </span>
      }
      extra={
        showRemove && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
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

        {/* 业务角色显示客户名称和客户国籍 */}
        {isBusiness && (
          <>
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
          </>
        )}

        {/* 任务类型（业务/运营角色各自独立的选项） */}
        <Col span={8}>
          <Form.Item label="任务类型" required style={{ marginBottom: 12 }}>
            <Select
              placeholder="请选择任务类型"
              value={task.task_type_id || undefined}
              onChange={(v) => update({ task_type_id: v })}
              options={isBusiness ? businessOptions : operationOptions}
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

        <Col span={8}>
          <Form.Item
            label={<span style={{ color: task.is_special_order === 1 ? '#ff4d4f' : undefined, fontWeight: task.is_special_order === 1 ? 600 : undefined }}>特殊订单</span>}
            style={{ marginBottom: 12 }}
          >
            <Select
              value={task.is_special_order ?? 0}
              onChange={(v) => update({ is_special_order: v })}
              options={[
                { value: 0, label: '否' },
                { value: 1, label: <span style={{ color: '#ff4d4f', fontWeight: 600 }}>是</span> },
              ]}
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
