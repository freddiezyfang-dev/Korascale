#!/usr/bin/env node

/**
 * 验证 GeoJSON 文件中的 feature.id 是否与 regionMapping.ts 配置匹配
 * 
 * 用法:
 *   node scripts/validate-province-ids.js <geojson-file>
 */

const fs = require('fs');

// 从 regionMapping.ts 中需要的省份 ID
const REQUIRED_IDS = [
  '540000', // 西藏
  '630000', // 青海
  '530000', // 云南
  '520000', // 贵州
  '510000', // 四川
  '500000', // 重庆
];

function validateGeoJSON(filePath) {
  console.log(`📂 Validating ${filePath}...\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (geojson.type !== 'FeatureCollection') {
    console.error('❌ Invalid GeoJSON: expected FeatureCollection');
    process.exit(1);
  }

  console.log(`   Total features: ${geojson.features.length}\n`);

  // 收集所有 feature.id
  const foundIds = new Set();
  const idToName = new Map();
  const missingIds = [];
  const invalidIds = [];

  geojson.features.forEach((feature, index) => {
    const id = feature.id;
    
    if (!id) {
      missingIds.push({ index, properties: feature.properties });
      return;
    }

    const idStr = String(id);
    foundIds.add(idStr);
    
    const name = feature.properties?.name || 
                 feature.properties?.shapeName || 
                 feature.properties?.NAME_1 || 
                 'Unknown';
    idToName.set(idStr, name);

    // 检查是否是有效的 6 位数字 adcode
    if (!/^\d{6}$/.test(idStr)) {
      invalidIds.push({ id: idStr, name, index });
    }
  });

  // 检查必需的 ID
  console.log('📋 Required province IDs (from regionMapping.ts):');
  REQUIRED_IDS.forEach(id => {
    const found = foundIds.has(id);
    const name = idToName.get(id) || 'Not found';
    console.log(`   ${found ? '✅' : '❌'} ${id} - ${name}`);
  });

  // 检查缺失的 ID
  const missingRequired = REQUIRED_IDS.filter(id => !foundIds.has(id));
  if (missingRequired.length > 0) {
    console.log(`\n⚠️  Missing required IDs: ${missingRequired.join(', ')}`);
  }

  // 检查无效的 ID 格式
  if (invalidIds.length > 0) {
    console.log(`\n⚠️  Invalid ID format (should be 6-digit adcode):`);
    invalidIds.slice(0, 10).forEach(item => {
      console.log(`   - ${item.id} (${item.name})`);
    });
    if (invalidIds.length > 10) {
      console.log(`   ... and ${invalidIds.length - 10} more`);
    }
  }

  // 检查缺失的 feature.id
  if (missingIds.length > 0) {
    console.log(`\n⚠️  Features without id: ${missingIds.length}`);
    missingIds.slice(0, 5).forEach(item => {
      console.log(`   Feature ${item.index}:`, JSON.stringify(item.properties));
    });
    if (missingIds.length > 5) {
      console.log(`   ... and ${missingIds.length - 5} more`);
    }
  }

  // 总结
  console.log('\n📊 Summary:');
  console.log(`   Total features: ${geojson.features.length}`);
  console.log(`   Features with id: ${foundIds.size}`);
  console.log(`   Features without id: ${missingIds.length}`);
  console.log(`   Required IDs found: ${REQUIRED_IDS.length - missingRequired.length}/${REQUIRED_IDS.length}`);
  console.log(`   Invalid ID format: ${invalidIds.length}`);

  if (missingRequired.length === 0 && missingIds.length === 0 && invalidIds.length === 0) {
    console.log('\n✅ All checks passed! GeoJSON is ready to use.');
    return true;
  } else {
    console.log('\n❌ Some issues found. Please fix before using.');
    return false;
  }
}

// 主程序
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: node scripts/validate-province-ids.js <geojson-file>');
  process.exit(1);
}

validateGeoJSON(filePath);





