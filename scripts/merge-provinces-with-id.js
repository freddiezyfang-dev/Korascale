#!/usr/bin/env node

/**
 * 合并省级 GeoJSON 文件，并确保 feature.id 正确设置
 * 
 * 用法:
 *   node scripts/merge-provinces-with-id.js <input-dir> <output-file>
 * 
 * 示例:
 *   node scripts/merge-provinces-with-id.js public/data/output-2 public/data/china-provinces.geojson
 */

const fs = require('fs');
const path = require('path');

// 中国所有省级行政区 adcode（34 个）
const REQUIRED_PROVINCES = [
  // 直辖市
  '110000', // 北京
  '120000', // 天津
  '310000', // 上海
  '500000', // 重庆
  // 省份
  '130000', // 河北
  '140000', // 山西
  '150000', // 内蒙古
  '210000', // 辽宁
  '220000', // 吉林
  '230000', // 黑龙江
  '320000', // 江苏
  '330000', // 浙江
  '340000', // 安徽
  '350000', // 福建
  '360000', // 江西
  '370000', // 山东
  '410000', // 河南
  '420000', // 湖北
  '430000', // 湖南
  '440000', // 广东
  '450000', // 广西
  '460000', // 海南
  '510000', // 四川
  '520000', // 贵州
  '530000', // 云南
  '540000', // 西藏
  '610000', // 陕西
  '620000', // 甘肃
  '630000', // 青海
  '640000', // 宁夏
  '650000', // 新疆
  // 特别行政区
  '810000', // 香港
  '820000', // 澳门
];

function aggregateProvinceFeatures(features, provinceAdcode) {
  // 如果只有一个 feature 且它的 adcode 就是省份 adcode，直接返回
  if (features.length === 1 && String(features[0].properties?.adcode) === provinceAdcode) {
    return features[0];
  }

  // 否则，聚合所有市级 features 为省级 MultiPolygon
  const coordinates = [];
  let provinceName = null;

  features.forEach(feature => {
    // 尝试获取省份名称（通常第一个 feature 的父级名称）
    if (!provinceName && feature.properties?.name) {
      // 这里可能需要根据实际数据结构调整
      provinceName = feature.properties.name;
    }

    if (feature.geometry.type === 'Polygon') {
      coordinates.push(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'MultiPolygon') {
      coordinates.push(...feature.geometry.coordinates);
    }
  });

  const geometry = coordinates.length === 1
    ? { type: 'Polygon', coordinates: coordinates[0] }
    : { type: 'MultiPolygon', coordinates };

  return {
    type: 'Feature',
    id: String(provinceAdcode), // 确保 id 是字符串
    properties: {
      adcode: String(provinceAdcode), // 确保 adcode 是字符串，与 Mapbox filter 匹配
      name: provinceName || `Province ${provinceAdcode}`,
      level: 'province',
      cityCount: features.length
    },
    geometry
  };
}

function processProvinceFile(filePath, provinceAdcode) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filePath}`);
    return null;
  }

  const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (geojson.type !== 'FeatureCollection' || !geojson.features || geojson.features.length === 0) {
    console.warn(`  ⚠️  Invalid GeoJSON or empty: ${filePath}`);
    return null;
  }

  // 检查是否已经是省级数据（只有一个 feature 且 adcode 匹配）
  const isProvinceLevel = geojson.features.length === 1 && 
    String(geojson.features[0].properties?.adcode) === provinceAdcode;

  if (isProvinceLevel) {
    // 已经是省级数据，只需要确保 id 和 adcode 正确
    const feature = geojson.features[0];
    return {
      type: 'Feature',
      id: String(provinceAdcode), // 确保 id 是字符串
      properties: {
        ...feature.properties,
        adcode: String(provinceAdcode) // 确保 adcode 是字符串，与 Mapbox filter 匹配
      },
      geometry: feature.geometry
    };
  } else {
    // 市级数据，需要聚合
    console.log(`  📦 Aggregating ${geojson.features.length} city-level features to province ${provinceAdcode}`);
    return aggregateProvinceFeatures(geojson.features, provinceAdcode);
  }
}

function mergeProvinces(inputDir, outputFile) {
  console.log(`📂 Processing provinces from ${inputDir}...\n`);

  const features = [];
  const processed = new Set();

  REQUIRED_PROVINCES.forEach(provinceAdcode => {
    const filePath = path.join(inputDir, `${provinceAdcode}.json`);
    console.log(`Processing ${provinceAdcode}...`);

    const feature = processProvinceFile(filePath, provinceAdcode);

    if (feature) {
      // 确保 id 是字符串格式
      feature.id = String(provinceAdcode);
      
      // 检查重复
      if (processed.has(provinceAdcode)) {
        console.warn(`  ⚠️  Duplicate province ${provinceAdcode}, skipping`);
        return;
      }

      processed.add(provinceAdcode);
      features.push(feature);
      console.log(`  ✅ Added province ${provinceAdcode} (${feature.properties.name || 'Unknown'})`);
    } else {
      console.error(`  ❌ Failed to process ${provinceAdcode}`);
    }
    console.log('');
  });

  if (features.length === 0) {
    console.error('❌ No features processed. Please check input files.');
    process.exit(1);
  }

  const output = {
    type: 'FeatureCollection',
    features: features
  };

  // 确保输出目录存在
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`\n✅ Successfully merged ${features.length} provinces`);
  console.log(`📊 Output written to: ${outputFile}\n`);

  console.log('📋 Processed provinces:');
  features.forEach(f => {
    console.log(`   ${f.id} - ${f.properties.name || 'Unknown'} (${f.properties.cityCount || 1} cities)`);
  });

  return outputFile;
}

// 主程序
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage:');
  console.error('   node scripts/merge-provinces-with-id.js <input-dir> <output-file>');
  console.error('');
  console.error('Example:');
  console.error('   node scripts/merge-provinces-with-id.js public/data/output-2 public/data/china-provinces.geojson');
  process.exit(1);
}

const inputDir = args[0];
const outputFile = args[1];

if (!fs.existsSync(inputDir)) {
  console.error(`❌ Directory not found: ${inputDir}`);
  process.exit(1);
}

mergeProvinces(inputDir, outputFile);





