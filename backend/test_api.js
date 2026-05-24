// 测试订单提交API
const axios = require('axios');

async function testSubmitOrder() {
  try {
    console.log('开始测试订单提交...\n');
    
    const response = await axios.post('http://localhost:3000/api/orders/submit', {
      task_name: 'JARSKING香水宣传图',
      customer_name: 'JARSKING',
      customer_region: '中国',
      task_type_id: 1,
      deadline: '2025-06-01 18:00:00',
      requirement_desc: '设计一款高级感香水宣传海报',
      creator_id: 2,
      receiver_id: null,
      attachments: [
        {
          file_name: 'perfume-design.jpg',
          mime_type: 'image/jpeg',
          file_type: 1
        }
      ]
    });

    console.log('✅ 订单提交成功！');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 订单提交失败:');
    console.error('状态码:', error.response?.status);
    console.error('错误信息:', error.response?.data);
    console.error('原始错误:', error.message);
  }
}

testSubmitOrder();