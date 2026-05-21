import { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Upload, Image, Empty, message } from 'antd';
import { SendOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { MOCK_MESSAGES } from '../../../mock/messages';

const { TextArea } = Input;

// 沟通消息弹框
function ChatModal({ open, order, currentUser, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // 打开时加载该订单的聊天记录
  useEffect(() => {
    if (open && order) {
      const list = MOCK_MESSAGES[order.id] || [];
      setMessages([...list]);
      setInputText('');
      setPendingImage(null);
    }
  }, [open, order]);

  // 消息滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息（本地模拟）
  const handleSend = () => {
    if (!inputText.trim() && !pendingImage) return;
    const newMsg = {
      id: Date.now(),
      sender_id: currentUser?.userId || 0,
      sender_name: currentUser?.realName || currentUser?.username || '我',
      content: inputText.trim() || null,
      attachment_url: pendingImage,
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setPendingImage(null);
  };

  // 选择图片（转为本地 blob url 预览）
  const handlePickImage = (file) => {
    const url = URL.createObjectURL(file);
    setPendingImage(url);
    return false;
  };

  // 处理粘贴事件
  useEffect(() => {
    const handlePaste = (e) => {
      if (!open) return; // 只在弹框打开时响应
      
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        const url = URL.createObjectURL(file);
        setPendingImage(url);
        message.success('图片已粘贴');
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open]);

  // 判断是否为当前用户（下单人）发的消息
  // 逻辑：如果发送人是订单的接单人（receiver_id），则显示在左侧；否则（下单人、自己）显示在右侧
  const isMine = (msg) => {
    if (order?.receiver_id && msg.sender_id === order.receiver_id) return false;
    return true;
  };

  return (
    <Modal
      title={`沟通消息 - ${order?.order_no || ''}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      {/* 聊天记录区 */}
      <div
        ref={scrollRef}
        style={{
          height: 360,
          overflowY: 'auto',
          padding: 12,
          background: '#f5f7fa',
          borderRadius: 6,
          marginBottom: 12,
        }}
      >
        {messages.length === 0 ? (
          <Empty description="暂无聊天记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          messages.map((msg) => {
            const mine = isMine(msg);
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: mine ? 'row-reverse' : 'row',
                  marginBottom: 14,
                }}
              >
                <div style={{ maxWidth: '70%' }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#8c8c8c',
                      textAlign: mine ? 'right' : 'left',
                      marginBottom: 4,
                    }}
                  >
                    {msg.sender_name} · {msg.created_at}
                  </div>
                  <div
                    style={{
                      background: mine ? '#667eea' : '#fff',
                      color: mine ? '#fff' : '#262626',
                      padding: '8px 12px',
                      borderRadius: 8,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content && <div>{msg.content}</div>}
                    {msg.attachment_url && (
                      <Image
                        src={msg.attachment_url}
                        width={180}
                        style={{ marginTop: msg.content ? 8 : 0, borderRadius: 4 }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 输入区 */}
      <div>
        {pendingImage && (
          <div style={{ marginBottom: 8 }}>
            <Image src={pendingImage} width={80} style={{ borderRadius: 4 }} />
            <Button type="link" size="small" danger onClick={() => setPendingImage(null)}>
              移除图片
            </Button>
          </div>
        )}
        <TextArea
          ref={inputRef}
          rows={2}
          placeholder="输入消息内容，Ctrl+Enter 发送"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={(e) => {
            if (e.ctrlKey) handleSend();
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Upload beforeUpload={handlePickImage} showUploadList={false} accept="image/*">
            <Button icon={<PictureOutlined />}>图片附件</Button>
          </Upload>
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
            发送
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ChatModal;
