// 测试OSS配置和连接
require('dotenv').config({ path: '../.env' });
const OSS = require('ali-oss');

async function testOSS() {
  console.log('=== OSS配置测试 ===\n');
  
  // 打印配置
  console.log('当前配置:');
  console.log('Region:', process.env.OSS_REGION);
  console.log('Endpoint:', process.env.OSS_ENDPOINT);
  console.log('AccessKey ID:', process.env.OSS_ACCESS_KEY_ID?.substring(0, 10) + '...');
  console.log('桶名配置:');
  console.log('  - 过程文件:', process.env.OSS_BUCKET_PROCESS);
  console.log('  - 成果文件:', process.env.OSS_BUCKET_FINISH);
  console.log('  - 其他文件:', process.env.OSS_BUCKET_OTHERS);
  console.log();

  // 测试每个桶的连接 - 尝试多个endpoint
  const buckets = [
    { name: process.env.OSS_BUCKET_PROCESS, type: '过程文件' },
    { name: process.env.OSS_BUCKET_FINISH, type: '成果文件' },
    { name: process.env.OSS_BUCKET_OTHERS, type: '其他文件' }
  ];


  // 尝试不同的endpoint配置
  const endpoints = [
    { name: '标准公网', endpoint: process.env.OSS_ENDPOINT },
    { name: 'VPC内网', endpoint: process.env.OSS_ENDPOINT?.replace('.aliyuncs.com', '-internal.aliyuncs.com') },
    { name: '经典网络内网', endpoint: 'oss-cn-hangzhou.internal.aliyuncs.com' },
  ];

  for (const bucket of buckets) {
    console.log(`\n测试桶: ${bucket.name} (${bucket.type})`);
    console.log('-'.repeat(50));
    
    let success = false;
    for (const ep of endpoints) {
      console.log(`\n  尝试 Endpoint: ${ep.name} -> ${ep.endpoint}`);
      console.log('  ' + '-'.repeat(40));
      
      try {
        const client = new OSS({
          region: process.env.OSS_REGION,
          accessKeyId: process.env.OSS_ACCESS_KEY_ID,
          accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
          bucket: bucket.name,
          endpoint: ep.endpoint
        });

        // 测试列出文件
        const result = await client.list({ 'max-keys': 1 });
        console.log(`  ✅ 连接成功! (${ep.name})`);
        console.log(`     桶内文件数: ${result.objects ? result.objects.length : 0}`);
        
        // 测试上传一个小文件
        const testKey = 'test/test-connection.txt';
        const testContent = Buffer.from('OSS连接测试 - ' + new Date().toISOString());
        
        const uploadResult = await client.put(testKey, testContent);
        console.log(`  ✅ 上传测试成功!`);
        console.log(`     测试文件URL: ${uploadResult.url}`);
        
        // 清理测试文件
        await client.delete(testKey);
        console.log(`  ✅ 测试文件已清理`);
        
        success = true;
        break; // 成功就退出
        
      } catch (error) {
        console.log(`  ❌ 失败 (${ep.name}): ${error.code} - ${error.message}`);
      }
    }

    if (!success) {
      console.log(`\n💡 提示: 所有endpoint都失败，请检查:`);
      console.log(`   1. 桶所在区域是否与region匹配`);
      console.log(`   2. AccessKey是否有该桶的读写权限`);
      console.log(`   3. 桶的访问策略设置`);
    }
  }


  console.log('\n=== 测试完成 ===\n');
}

testOSS().catch(console.error);