import { useState, useEffect, useRef } from 'react';
import { Modal, Input, Button, Upload, Image, Empty, message, Tag } from 'antd';
import { SendOutlined, PictureOutlined, FileImageOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { MOCK_MESSAGES } from '../../../mock/messages';

const { TextArea } = Input;

// 沟通消息弹框
function ChatModal({ open, order, currentUser, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // 打开时加载该订单的聊天记录
  useEffect(() => {
    if (open && order) {
      const list = MOCK_MESSAGES[order.id] || [];
      setMessages([...list]);
      setInputText('');
      setPendingFiles([]);
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
    if (!inputText.trim() && pendingFiles.length === 0) return;
    
    // 处理多个附件
    const attachmentUrls = pendingFiles.map(file => file.url || file.thumbUrl);
    
    const newMsg = {
      id: Date.now(),
      sender_id: currentUser?.userId || 0,
      sender_name: currentUser?.realName || currentUser?.username || '我',
      content: inputText.trim() || null,
      attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
      attachment_types: pendingFiles.map(file => file.type || 'file'),
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setPendingFiles([]);
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
                    {msg.attachment_urls && msg.attachment_urls.length > 0 && (
                      <div style={{ marginTop: msg.content ? 8 : 0 }}>
                        {msg.attachment_urls.map((url, index) => {
                          const isImage = msg.attachment_types && msg.attachment_types[index] === 'image';
                          return isImage ? (
                            <Image
                              key={index}
                              src={url}
                              width={180}
                              style={{ marginTop: index > 0 ? 8 : 0, borderRadius: 4, display: 'block' }}
                            />
                          ) : (
                            <div key={index} style={{ marginTop: index > 0 ? 8 : 0, padding: '8px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileImageOutlined />
                              <span style={{ fontSize: 12, wordBreak: 'break-all' }}>附件文件</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* 兼容旧数据格式 */}
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
              <Button icon={<PaperClipOutlined />}>添加附件</Button>
            </Upload>
            <Upload 
              beforeUpload={handlePickFiles} 
              showUploadList={false} 
              accept="image/*"
              multiple
            >
              <Button icon={<PictureOutlined />}>图片</Button>
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
