import { Modal, Select, message, Spin } from 'antd';
import { useState, useEffect } from 'react';
import axios from 'axios';

// 组长分配弹窗
// props:
//   open: boolean
//   order: 当前订单
//   leaderId: 组长ID
//   onCancel: 关闭回调
//   onSuccess: 分配成功回调
function AssignModal({ open, order, leaderId, onCancel, onSuccess }) {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // 获取组员列表
  useEffect(() => {
    if (open && leaderId) {
      setFetching(true);
      axios.get(`/api/orders/group-members?leader_id=${leaderId}`)
        .then(res => {
          if (res.data.success) {
            setMembers(res.data.data || []);
          }
        })
        .catch(err => {
          console.error('获取组员失败:', err);
          message.error('获取组员列表失败');
        })
        .finally(() => setFetching(false));
    }
  }, [open, leaderId]);

  // 确认分配
  const handleOk = async () => {
    if (!selectedMember) {
      message.warning('请选择接单人');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(`/api/orders/${order.id}/assign`, {
        receiver_id: selectedMember,
        leader_id: leaderId
      });
      if (res.data.success) {
        message.success('分配成功');
        onSuccess?.();
      } else {
        message.error(res.data.message || '分配失败');
      }
    } catch (err) {
      console.error('分配失败:', err);
      message.error(err.response?.data?.message || '分配失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成选项
  const options = members.map(m => ({
    value: m.id,
    label: `${m.real_name}（当前${m.current_orders}单）`
  }));

  return (
    <Modal
      title={`组长分配 · ${order?.task_name || ''}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认分配"
      okButtonProps={{ danger: true, loading }}
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{ marginBottom: 12, color: '#595959' }}>分配给组员：</div>
        {fetching ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin />
          </div>
        ) : (
          <Select
            style={{ width: '100%' }}
            placeholder="请选择接单人"
            value={selectedMember}
            onChange={setSelectedMember}
            options={options}
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
          />
        )}
      </div>
    </Modal>
  );
}

export default AssignModal;
