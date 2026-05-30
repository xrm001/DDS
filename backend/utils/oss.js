const OSS = require('ali-oss');

// 创建 OSS客户端实例
function createOSSClient(bucket) {
  // 使用公网 endpoint（1-前缀只是桶名命名，不是内网桶）
  const endpoint = process.env.OSS_ENDPOINT;

  console.log(`[OSS客户端] 桶: ${bucket}, Endpoint: ${endpoint}`);

  return new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: bucket,
    endpoint: endpoint,
    secure: true, // 使用 HTTPS
    timeout: 120000 // 120秒超时（大文件上传需要较长时间）
  });
}

// 根据文件类型获取对应的桶名
function getBucketByFileType(fileType) {
  switch (fileType) {
    case 1:
      return process.env.OSS_BUCKET_PROCESS || '1-dds-process-file';
    case 2:
      return process.env.OSS_BUCKET_FINISH || '1-dds-finish-file';
    case 3:
      return process.env.OSS_BUCKET_OTHERS || '1-dds-others-file';
    default:
      return process.env.OSS_BUCKET_PROCESS || '1-dds-process-file';
  }
}

/**
 * 上传文件到OSS（支持Base64）
 * @param {string|Buffer} fileData - 文件Base64字符串或Buffer
 * @param {string} ossKey - OSS存储路径
 * @param {number} fileType - 文件类型 (1=过程文件, 2=成果文件, 3=其他)
 * @returns {Promise<string>} OSS文件URL
 */
async function uploadFileToOSS(fileData, ossKey, fileType = 1) {
  try {
    const bucket = getBucketByFileType(fileType);
    const client = createOSSClient(bucket);

    console.log(`[OSS上传] 开始上传文件到桶: ${bucket}`);
    console.log(`[OSS上传] OSS Key: ${ossKey}`);

    // 如果是Base64字符串，转换为Buffer
    let buffer;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      // Base64 Data URL格式: data:image/jpeg;base64,/9j/4AAQ...
      const base64Data = fileData.split(',')[1]; // 去掉 data:xxx;base64, 前缀
      buffer = Buffer.from(base64Data, 'base64');
      console.log(`[OSS上传] Base64数据已转换, 大小: ${buffer.length} bytes`);
    } else if (typeof fileData === 'string') {
      // 纯Base64字符串
      buffer = Buffer.from(fileData, 'base64');
      console.log(`[OSS上传] Base64数据已转换, 大小: ${buffer.length} bytes`);
    } else {
      // 已经是Buffer
      buffer = fileData;
      console.log(`[OSS上传] Buffer数据, 大小: ${buffer.length} bytes`);
    }

    // 上传文件（带重试）
    let result;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[OSS上传] 第 ${attempt}/${maxRetries} 次尝试上传...`);
        result = await client.put(ossKey, buffer);
        break; // 上传成功，跳出重试循环
      } catch (retryError) {
        lastError = retryError;
        if (attempt < maxRetries) {
          console.log(`[OSS上传] 第 ${attempt} 次上传失败，2秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!result) {
      throw lastError;
    }

    console.log(`[OSS上传] 上传成功, URL: ${result.url}`);

    return result.url;
  } catch (error) {
    console.error('[OSS上传] 上传失败:', error);
    console.error('[OSS上传] 错误详情:', error.message);
    console.error('[OSS上传] 请求ID:', error.requestId);
    throw error;
  }
}

/**
 * 上传文件流到OSS
 * @param {ReadableStream} fileStream - 文件流
 * @param {string} ossKey - OSS存储路径
 * @param {number} fileType - 文件类型 (1=过程文件, 2=成果文件, 3=其他)
 * @returns {Promise<string>} OSS文件URL
 */
async function uploadFileStreamToOSS(fileStream, ossKey, fileType = 1) {
  try {
    const bucket = getBucketByFileType(fileType);
    const client = createOSSClient(bucket);

    console.log(`[OSS上传] 开始上传文件流到桶: ${bucket}`);
    console.log(`[OSS上传] OSS Key: ${ossKey}`);

    // 上传文件流
    const result = await client.putStream(ossKey, fileStream);

    console.log(`[OSS上传] 上传成功, URL: ${result.url}`);

    return result.url;
  } catch (error) {
    console.error('[OSS上传] 上传失败:', error);
    throw error;
  }
}

module.exports = {
  uploadFileToOSS,
  uploadFileStreamToOSS,
  getBucketByFileType,
  createOSSClient
};