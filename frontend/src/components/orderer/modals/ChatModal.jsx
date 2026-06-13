import { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Upload, Image, Empty, message, Tag, Spin } from 'antd';
import { SendOutlined, FileImageOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getOrderMessages, sendMessage, markMessagesRead } from '../../../api/orders';

const { TextArea } = Input;

// 沟通消息弹框（下单人和接单人共用）
function ChatModal({ open, order, currentUser, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // 打开时从后端加载该订单的聊天记录
  useEffect(() => {
    if (open && order) {
      loadMessages();
      setInputText('');
      setPendingFiles([]);
      // 标记消息为已读
      if (currentUser?.id) {
        markMessagesRead(order.id, currentUser.id).catch(() => {});
      }
    }
  }, [open, order]);

  // 从后端加载消息列表
  const loadMessages = async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const result = await getOrderMessages(order.id);
      if (result.success) {
        setMessages(result.data || []);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      message.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  // 消息滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息（调用后端API）
  const handleSend = async () => {
    if (!inputText.trim() && pendingFiles.length === 0) return;
    
    try {
      // 调用后端API发送消息
      const result = await sendMessage(order.id, {
        sender_id: currentUser.id,
        receiver_id: order.creator_id === currentUser.id ? order.receiver_id : order.creator_id,
        content: inputText.trim(),
        attachment_id: null, // TODO: 附件上传后关联
      });

      if (result.success) {
        // 发送成功后重新加载消息列表
        await loadMessages();
        setInputText('');
        setPendingFiles([]);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败: ' + (error.message || '未知错误'));
    }
  };

  // 选择文件（支持多文件）
  const handlePickFiles = (file) => {
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    
    setPendingFiles((prev) => [
      ...prev,
      {
        uid: file.uid || Date.now() + Math.random(),
        name: file.name,
        type: isImage ? 'image' : 'file',
        url: url,
        thumbUrl: isImage ? url : null,
        file: file,
      },
    ]);
    return false;
  };

  // 移除文件
  const handleRemoveFile = (fileUid) => {
    setPendingFiles((prev) => {
      const newFiles = prev.filter(f => f.uid !== fileUid);
      return newFiles;
    });
  };

  // 处理粘贴事件（支持图片和文件）
  useEffect(() => {
    const handlePaste = (e) => {
      if (!open) return; // 只在弹框打开时响应
      
      const items = Array.from(e.clipboardData.items);
      
      items.forEach((item) => {
        // 处理图片
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          const url = URL.createObjectURL(file);
          setPendingFiles((prev) => [
            ...prev,
            {
              uid: Date.now() + Math.random(),
              name: file.name || '粘贴的图片.png',
              type: 'image',
              url: url,
              thumbUrl: url,
              file: file,
            },
          ]);
          message.success('图片已粘贴');
        }
        // 处理文件（如果浏览器支持）
        else if (item.kind === 'file') {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const url = URL.createObjectURL(file);
            const isImage = file.type.startsWith('image/');
            setPendingFiles((prev) => [
              ...prev,
              {
                uid: Date.now() + Math.random(),
                name: file.name || '粘贴的文件',
                type: isImage ? 'image' : 'file',
                url: url,
                thumbUrl: isImage ? url : null,
                file: file,
              },
            ]);
            message.success('文件已粘贴');
          }
        }
      });
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open]);

  // 判断是否为当前用户发的消息
  const isMine = (msg) => {
    return msg.sender_id === currentUser?.id;
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载消息中..." /></div>
        ) : messages.length === 0 ? (
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
                    {msg.sender_name || '未知用户'} · {dayjs(msg.created_at).format('YYYY-MM-DD HH:mm')}
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
                    {/* 附件（后端返回单个 attachment_url） */}
                    {msg.attachment_url && (
                      <div style={{ marginTop: msg.content ? 8 : 0 }}>
                        <Image
                          src={msg.attachment_url}
                          width={180}
                          style={{ borderRadius: 4 }}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F/PQAJpAN4lMq8LAAAAABJRU5ErkJggg=="
                        />
                        {msg.attachment_name && (
                          <div style={{ fontSize: 11, color: mine ? 'rgba(255,255,255,0.7)' : '#8c8c8c', marginTop: 4 }}>
                            {msg.attachment_name}
                          </div>
                        )}
                      </div>
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
        {pendingFiles.length > 0 && (
          <div style={{ marginBottom: 8, padding: 8, background: '#f5f7fa', borderRadius: 6 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pendingFiles.map((file) => (
                <div key={file.uid} style={{ position: 'relative', display: 'inline-block' }}>
                  {file.type === 'image' ? (
                    <Image src={file.url} width={60} height={60} style={{ borderRadius: 4, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: '#e6f7ff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileImageOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                    </div>
                  )}
                  <Button
                    type="text"
                    size="small"
                    danger
                    onClick={() => handleRemoveFile(file.uid)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 20,
                      height: 20,
                      padding: 0,
                      fontSize: 12,
                      borderRadius: '50%',
                    }}
                  >
                    ×
                  </Button>
                  <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <TextArea
          ref={inputRef}
          rows={2}
          placeholder="输入消息内容，Ctrl+Enter 发送，支持 Ctrl+V 粘贴图片和文件"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={(e) => {
            if (e.ctrlKey) handleSend();
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Upload 
              beforeUpload={handlePickFiles} 
              showUploadList={false} 
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.psd,.ai"
              multiple
            >
              <Button icon={<PaperClipOutlined />}>添加文件</Button>
            </Upload>
          </div>
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
            发送
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ChatModal;
