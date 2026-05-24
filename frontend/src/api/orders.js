import axios from 'axios';

const API_BASE = '/api';

/**
 * 提交订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise} 提交结果
 */
export const submitOrder = async (orderData) => {
  try {
    const response = await axios.post(`${API_BASE}/orders/submit`, orderData);
    return response.data;
  } catch (error) {
    // 优先获取后端返回的错误信息
    if (error.response?.data) {
      const errorData = error.response.data;
      // 如果后端返回 { success: false, message: '...' } 格式
      if (errorData.message) {
        throw new Error(errorData.message);
      }
      throw errorData;
    }
    throw error;
  }
};