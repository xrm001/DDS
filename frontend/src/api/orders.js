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
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.message) {
        throw new Error(errorData.message);
      }
      throw errorData;
    }
    throw error;
  }
};

/**
 * 获取订单列表
 * @param {number} creatorId - 下单人ID
 * @returns {Promise} 订单列表
 */
export const getOrderList = async (creatorId) => {
  try {
    const response = await axios.get(`${API_BASE}/orders/list`, {
      params: { creator_id: creatorId }
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 获取订单沟通消息
 * @param {number} orderId - 订单ID
 * @returns {Promise} 消息列表
 */
export const getOrderMessages = async (orderId) => {
  try {
    const response = await axios.get(`${API_BASE}/orders/${orderId}/messages`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 发送沟通消息
 * @param {number} orderId - 订单ID
 * @param {Object} messageData - 消息数据
 * @returns {Promise} 发送结果
 */
export const sendMessage = async (orderId, messageData) => {
  try {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/messages`, messageData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 标记消息为已读
 * @param {number} orderId - 订单ID
 * @param {number} userId - 用户ID
 * @returns {Promise}
 */
export const markMessagesRead = async (orderId, userId) => {
  try {
    const response = await axios.put(`${API_BASE}/orders/${orderId}/messages/read`, { user_id: userId });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 获取订单评价
 * @param {number} orderId - 订单ID
 * @returns {Promise} 评价列表
 */
export const getOrderEvaluations = async (orderId) => {
  try {
    const response = await axios.get(`${API_BASE}/orders/${orderId}/evaluations`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 提交评价
 * @param {number} orderId - 订单ID
 * @param {Object} evalData - 评价数据
 * @returns {Promise}
 */
export const submitEvaluation = async (orderId, evalData) => {
  try {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/evaluate`, evalData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 更新成交状态
 * @param {number} orderId - 订单ID
 * @param {Object} dealData - 成交数据 { deal_status, deal_amount, currency }
 * @returns {Promise}
 */
export const updateDealStatus = async (orderId, dealData) => {
  try {
    const response = await axios.put(`${API_BASE}/orders/${orderId}/deal-status`, dealData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 撤回订单
 * @param {number} orderId - 订单ID
 * @param {string} reason - 撤回原因
 * @returns {Promise}
 */
export const recallOrder = async (orderId, reason) => {
  try {
    const response = await axios.put(`${API_BASE}/orders/${orderId}/recall`, { cancel_reason: reason });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 修改订单信息
 * @param {number} orderId - 订单ID
 * @param {Object} orderData - 订单数据
 * @returns {Promise}
 */
export const updateOrder = async (orderId, orderData) => {
  try {
    const response = await axios.put(`${API_BASE}/orders/${orderId}`, orderData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * 订单审核（通过/驳回）
 * @param {number} orderId - 订单ID
 * @param {Object} reviewData - { review_result: 'approved'|'rejected', review_remark }
 * @returns {Promise}
 */
export const reviewOrder = async (orderId, reviewData) => {
  try {
    const response = await axios.post(`${API_BASE}/orders/${orderId}/review`, reviewData);
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};