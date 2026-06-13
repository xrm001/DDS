import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Select, Button, Space, Tag, DatePicker, Row, Col, Modal, Form, Input, message, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, SaveOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const { Option } = Select;

// 班次类型定义
const SHIFT_TYPES = {
  morning: { label: '早班', color: '#52c41a', short: '早' },
  afternoon: { label: '中班', color: '#1890ff', short: '中' },
  night: { label: '晚班', color: '#722ed1', short: '晚' },
  off: { label: '休息', color: '#f5222d', short: '休' },
};

// 人员排班表页面
function PersonnelSchedule() {
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('isoWeek')); // 当前周一
  const [persons, setPersons] = useState([]);
  const [schedules, setSchedules] = useState({}); // { personId: { 'YYYY-MM-DD': shiftType } }
  const [loading, setLoading] = useState(false);
  const [deptFilter, setDeptFilter] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [editDate, setEditDate] = useState(null);
  const [editForm] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);

  // 获取当前周的7天
  const weekDays = Array.from({ length: 7 }, (_, i) => currentWeek.add(i, 'day'));
  const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const fetchPersons = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data.success) {
        setPersons(res.data.data || []);
      }
    } catch (e) {
      message.error('加载人员列表失败');
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const weekStart = currentWeek.format('YYYY-MM-DD');
      const weekEnd = currentWeek.add(6, 'day').format('YYYY-MM-DD');
      const res = await axios.get('/api/admin/schedules', {
        params: { start_date: weekStart, end_date: weekEnd }
      });
      if (res.data.success) {
        // 转换为 { personId: { date: shiftType } } 格式
        const map = {};
        (res.data.data || []).forEach(item => {
          if (!map[item.person_id]) map[item.person_id] = {};
          map[item.person_id][dayjs(item.schedule_date).format('YYYY-MM-DD')] = item.shift_type;
        });
        setSchedules(map);
      }
    } catch (e) {
      // 接口不存在时使用空数据
      setSchedules({});
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    fetchPersons();
    fetchDepartments();
  }, [fetchPersons, fetchDepartments]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 筛选人员
  const filteredPersons = persons.filter(p => {
    if (!deptFilter) return true;
    return p.dept_id === deptFilter;
  });

  // 切换周
  const prevWeek = () => setCurrentWeek(prev => prev.subtract(7, 'day'));
  const nextWeek = () => setCurrentWeek(prev => prev.add(7, 'day'));
  const goToday = () => setCurrentWeek(dayjs().startOf('isoWeek'));

  // 点击单元格编辑班次
  const handleCellClick = (person, date) => {
    setEditPerson(person);
    setEditDate(date);
    const dateStr = date.format('YYYY-MM-DD');
    const currentShift = schedules[person.id]?.[dateStr] || '';
    editForm.setFieldsValue({ shift_type: currentShift || undefined });
    setEditModalOpen(true);
  };

  // 保存单个班次修改
  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
      const dateStr = editDate.format('YYYY-MM-DD');
      const personId = editPerson.id;

      // 更新本地状态
      const newSchedules = { ...schedules };
      if (!newSchedules[personId]) newSchedules[personId] = {};
      if (values.shift_type) {
        newSchedules[personId][dateStr] = values.shift_type;
      } else {
        delete newSchedules[personId][dateStr];
      }
      setSchedules(newSchedules);
      setHasChanges(true);
      setEditModalOpen(false);
    } catch (e) { /* ignore */ }
  };

  // 批量保存排班到后端
  const handleSaveAll = async () => {
    try {
      setLoading(true);
      const items = [];
      Object.entries(schedules).forEach(([personId, dateMap]) => {
        Object.entries(dateMap).forEach(([date, shiftType]) => {
          items.push({ person_id: parseInt(personId), schedule_date: date, shift_type: shiftType });
        });
      });
      const weekStart = currentWeek.format('YYYY-MM-DD');
      const weekEnd = currentWeek.add(6, 'day').format('YYYY-MM-DD');
      const res = await axios.post('/api/admin/schedules', {
        week_start: weekStart,
        week_end: weekEnd,
        items,
      });
      if (res.data.success) {
        message.success('排班保存成功');
        setHasChanges(false);
      } else {
        message.error(res.data.message || '保存失败');
      }
    } catch (e) {
      message.error('保存失败：' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  // 统计某人本周班次
  const getShiftSummary = (personId) => {
    const dateMap = schedules[personId] || {};
    const counts = { morning: 0, afternoon: 0, night: 0, off: 0 };
    weekDays.forEach(day => {
      const shift = dateMap[day.format('YYYY-MM-DD')];
      if (shift && counts[shift] !== undefined) counts[shift]++;
    });
    return counts;
  };

  // 表格列定义
  const columns = [
    {
      title: '人员',
      key: 'person',
      width: 120,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.real_name}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{record.department_name || '未分配'}</div>
        </div>
      ),
    },
    ...weekDays.map((day, i) => {
      const dateStr = day.format('YYYY-MM-DD');
      const isToday = day.isSame(dayjs(), 'day');
      return {
        title: (
          <div style={{ textAlign: 'center', background: isToday ? '#e6f7ff' : undefined }}>
            <div style={{ fontWeight: 500 }}>{WEEK_LABELS[i]}</div>
            <div style={{ fontSize: 11, color: isToday ? '#1890ff' : '#999' }}>
              {day.format('MM/DD')}
            </div>
          </div>
        ),
        key: dateStr,
        width: 80,
        align: 'center',
        render: (_, record) => {
          const shift = schedules[record.id]?.[dateStr];
          const shiftInfo = shift ? SHIFT_TYPES[shift] : null;
          return (
            <Tooltip title={shiftInfo ? shiftInfo.label : '点击设置班次'}>
              <div
                onClick={() => handleCellClick(record, day)}
                style={{
                  cursor: 'pointer',
                  padding: '4px 0',
                  borderRadius: 4,
                  background: shiftInfo ? shiftInfo.color + '20' : '#fafafa',
                  border: `1px solid ${shiftInfo ? shiftInfo.color + '50' : '#f0f0f0'}`,
                  transition: 'all 0.2s',
                }}
              >
                {shiftInfo ? (
                  <Tag color={shiftInfo.color} style={{ margin: 0, fontSize: 12 }}>{shiftInfo.short}</Tag>
                ) : (
                  <span style={{ color: '#bfbfbf', fontSize: 12 }}>-</span>
                )}
              </div>
            </Tooltip>
          );
        },
      };
    }),
    {
      title: '本周统计',
      key: 'summary',
      width: 180,
      render: (_, record) => {
        const s = getShiftSummary(record.id);
        return (
          <Space size={4} wrap>
            {s.morning > 0 && <Tag color="#52c41a" style={{ margin: 0 }}>早{s.morning}</Tag>}
            {s.afternoon > 0 && <Tag color="#1890ff" style={{ margin: 0 }}>中{s.afternoon}</Tag>}
            {s.night > 0 && <Tag color="#722ed1" style={{ margin: 0 }}>晚{s.night}</Tag>}
            {s.off > 0 && <Tag color="#f5222d" style={{ margin: 0 }}>休{s.off}</Tag>}
            {s.morning + s.afternoon + s.night + s.off === 0 && <span style={{ color: '#bfbfbf' }}>未排班</span>}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 顶部工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space>
              <Button icon={<LeftOutlined />} onClick={prevWeek} />
              <Button onClick={goToday} icon={<ReloadOutlined />}>本周</Button>
              <Button icon={<RightOutlined />} onClick={nextWeek} />
              <span style={{ fontWeight: 500, fontSize: 15 }}>
                {currentWeek.format('YYYY年MM月DD日')} - {currentWeek.add(6, 'day').format('MM月DD日')}
              </span>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="筛选部门"
                allowClear
                style={{ width: 160 }}
                value={deptFilter}
                onChange={setDeptFilter}
              >
                {departments.map(d => (
                  <Option key={d.id} value={d.id}>{d.name}</Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveAll}
                loading={loading}
                disabled={!hasChanges}
              >
                保存排班
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 班次图例 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <span style={{ color: '#666' }}>班次说明：</span>
          {Object.entries(SHIFT_TYPES).map(([key, val]) => (
            <Tag key={key} color={val.color}>{val.label}</Tag>
          ))}
          <span style={{ color: '#999', marginLeft: 8 }}>点击单元格可设置班次</span>
        </Space>
      </Card>

      {/* 排班表格 */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredPersons}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
          bordered
        />
      </Card>

      {/* 编辑班次弹窗 */}
      <Modal
        title={`设置班次 - ${editPerson?.real_name || ''} ${editDate ? editDate.format('MM月DD日') : ''}`}
        open={editModalOpen}
        onOk={handleEditSave}
        onCancel={() => setEditModalOpen(false)}
        width={360}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="shift_type" label="班次类型">
            <Select placeholder="选择班次（清空则取消排班）" allowClear>
              {Object.entries(SHIFT_TYPES).map(([key, val]) => (
                <Option key={key} value={key}>
                  <Tag color={val.color}>{val.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PersonnelSchedule;
