// 测试订单提交API
const axios = require('axios');

async function testSubmitOrder() {
  try {
    const response = await axios.post('http://localhost:3000/api/orders/submit', {
      task_name: '测试订单-宣传海报设计',
      customer_name: '测试客户',
      customer_region: '中国',
      task_type_id: 1,
      deadline: '2025-06-01 18:00:00',
      requirement_desc: '这是一个测试订单',
      creator_id: 2,
      receiver_id: null,
      attachments: [
        {
          file_name: 'test-image.jpg',
          mime_type: 'image/jpeg',
          file_type: 1
        }
      ]
    });

    console.log('✅ 订单提交成功！');
    console.log('响应数据:', response.data);
  } catch (error) {
    console.error('❌ 订单提交失败:', error.response?.data || error.message);
  }
}

testSubmitOrder();