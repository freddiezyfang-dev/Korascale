#!/usr/bin/env node

/**
 * 处理 geoBoundaries 数据，提取省级数据并添加正确的 feature.id
 * 
 * 用法:
 *   node scripts/process-geoboundaries.js <input.geojson> <output.geojson>
 */

const fs = require('fs');
const path = require('path');

// 省份名称到 adcode 的映射（用于匹配）
const PROVINCE_ADCODE_MAP = {
  // 西南地区
  '四川省': '510000',
  '四川': '510000',
  'Sichuan': '510000',
  '重庆': '500000',
  '重庆市': '500000',
  'Chongqing': '500000',
  '云南省': '530000',
  '云南': '530000',
  'Yunnan': '530000',
  '贵州省': '520000',
  '贵州': '520000',
  'Guizhou': '520000',
  '西藏自治区': '540000',
  '西藏': '540000',
  'Tibet': '540000',
  'Xizang': '540000',
  '青海省': '630000',
  '青海': '630000',
  'Qinghai': '630000',
  
  // 其他省份（如果需要）
  '新疆维吾尔自治区': '650000',
  '新疆': '650000',
  'Xinjiang': '650000',
  '甘肃省': '620000',
  '甘肃': '620000',
  'Gansu': '620000',
  '陕西省': '610000',
  '陕西': '610000',
  'Shaanxi': '610000',
};

function findProvinceAdcode(properties) {
  // 尝试从各种可能的字段中提取省份名称
  const nameFields = [
    properties.shapeName,
    properties.NAME_1,
    properties.NAME_0,
    properties.province,
    properties.provinceName,
    properties.省,
  ].filter(Boolean);

  for (const name of nameFields) {
    // 检查是否包含省份名称
    for (const [provinceName, adcode] of Object.entries(PROVINCE_ADCODE_MAP)) {
      if (name.includes(provinceName) || provinceName.includes(name)) {
        return adcode;
      }
    }
  }

  return null;
}

function processGeoBoundaries(inputFile, outputFile) {
  console.log(`📂 Reading ${inputFile}...`);
  
  const geojson = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  
  if (geojson.type !== 'FeatureCollection') {
    console.error('❌ Invalid GeoJSON: expected FeatureCollection');
    process.exit(1);
  }

  console.log(`   Total features: ${geojson.features.length}`);
  console.log(`   Data level: ${geojson.features[0]?.properties?.shapeType || 'Unknown'}`);

  // 检查数据级别
  const dataLevel = geojson.features[0]?.properties?.shapeType;
  
  if (dataLevel === 'ADM1') {
    // 省级数据，直接处理
    console.log('\n✅ Data is already ADM1 (province level)');
    processProvinceLevel(geojson, outputFile);
  } else if (dataLevel === 'ADM3') {
    // 县级数据，需要聚合到省级
    console.log('\n⚠️  Data is ADM3 (county level), need to aggregate to ADM1');
    console.log('   This script will extract unique provinces and create province-level features.');
    aggregateToProvinceLevel(geojson, outputFile);
  } else {
    console.error(`❌ Unsupported data level: ${dataLevel}`);
    process.exit(1);
  }
}

function processProvinceLevel(geojson, outputFile) {
  const processedFeatures = [];
  const idSet = new Set();
  let fixedCount = 0;
  let skippedCount = 0;

  geojson.features.forEach((feature, index) => {
    let featureId = feature.id;
    let adcode = null;

    // 如果已有 id，检查格式
    if (featureId) {
      featureId = String(featureId);
      // 检查是否是 6 位数字（标准 adcode）
      if (/^\d{6}$/.test(featureId)) {
        adcode = featureId;
      }
    }

    // 如果没有有效的 adcode，尝试从 properties 中提取
    if (!adcode) {
      adcode = feature.properties?.adcode || 
               feature.properties?.ADM1_CODE ||
               findProvinceAdcode(feature.properties);
    }

    // 如果仍然没有，尝试从 shapeID 或其他字段推断
    if (!adcode && feature.properties?.shapeID) {
      // 这里可以根据实际数据格式调整
      console.warn(`  ⚠️  Feature ${index}: Cannot determine adcode from properties:`, 
        JSON.stringify(feature.properties));
    }

    if (!adcode) {
      skippedCount++;
      return;
    }

    // 检查重复
    if (idSet.has(adcode)) {
      console.warn(`  ⚠️  Duplicate adcode ${adcode}, skipping`);
      skippedCount++;
      return;
    }

    idSet.add(adcode);
    
    // 创建处理后的 feature
    const processedFeature = {
      type: 'Feature',
      id: adcode, // 使用 adcode 作为 feature.id
      properties: {
        ...feature.properties,
        adcode: adcode,
        name: feature.properties?.name || 
              feature.properties?.shapeName || 
              feature.properties?.NAME_1 || 
              'Unknown'
      },
      geometry: feature.geometry
    };

    processedFeatures.push(processedFeature);
    
    if (!feature.id || String(feature.id) !== adcode) {
      fixedCount++;
    }
  });

  const output = {
    type: 'FeatureCollection',
    features: processedFeatures
  };

  // 确保输出目录存在
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\n✅ Processed ${processedFeatures.length} province-level features`);
  console.log(`   Fixed IDs: ${fixedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`\n📊 Output written to: ${outputFile}`);
  
  // 列出处理后的省份
  console.log('\n📋 Processed provinces:');
  processedFeatures.forEach(f => {
    console.log(`   ${f.id} - ${f.properties.name}`);
  });
}

function aggregateToProvinceLevel(geojson, outputFile) {
  // 按省份分组
  const provinceGroups = new Map();
  
  geojson.features.forEach((feature, index) => {
    const adcode = findProvinceAdcode(feature.properties);
    
    if (!adcode) {
      // 尝试从 shapeName 中提取省份信息
      const shapeName = feature.properties?.shapeName || '';
      // 这里需要根据实际数据格式调整提取逻辑
      return;
    }

    if (!provinceGroups.has(adcode)) {
      provinceGroups.set(adcode, {
        adcode,
        features: [],
        properties: feature.properties
      });
    }

    provinceGroups.get(adcode).features.push(feature);
  });

  console.log(`\n   Found ${provinceGroups.size} unique provinces`);

  // 聚合每个省份的几何
  const processedFeatures = [];
  
  provinceGroups.forEach((group, adcode) => {
    // 合并所有县的几何为 MultiPolygon
    const coordinates = [];
    
    group.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        coordinates.push(feature.geometry.coordinates);
      } else if (feature.geometry.type === 'MultiPolygon') {
        coordinates.push(...feature.geometry.coordinates);
      }
    });

    const geometry = coordinates.length === 1 
      ? { type: 'Polygon', coordinates: coordinates[0] }
      : { type: 'MultiPolygon', coordinates };

    processedFeatures.push({
      type: 'Feature',
      id: adcode,
      properties: {
        adcode,
        name: group.properties?.shapeName || `Province ${adcode}`,
        level: 'province',
        countyCount: group.features.length
      },
      geometry
    });
  });

  const output = {
    type: 'FeatureCollection',
    features: processedFeatures
  };

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\n✅ Aggregated to ${processedFeatures.length} province-level features`);
  console.log(`\n📊 Output written to: ${outputFile}`);
  
  console.log('\n📋 Aggregated provinces:');
  processedFeatures.forEach(f => {
    console.log(`   ${f.id} - ${f.properties.name} (${f.properties.countyCount} counties)`);
  });
}

// 主程序
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage:');
  console.error('   node scripts/process-geoboundaries.js <input.geojson> <output.geojson>');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`);
  process.exit(1);
}

processGeoBoundaries(inputFile, outputFile);





