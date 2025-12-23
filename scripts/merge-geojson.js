#!/usr/bin/env node

/**
 * 合并多个 GeoJSON 文件为一个 FeatureCollection
 * 
 * 用法:
 *   node merge-geojson.js <input1.geojson> <input2.geojson> ... <output.geojson>
 *   或
 *   node merge-geojson.js --dir <input-directory> <output.geojson>
 */

const fs = require('fs');
const path = require('path');

function readGeoJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(content);
    
    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      return geojson.features;
    } else if (geojson.type === 'Feature') {
      return [geojson];
    } else {
      console.error(`❌ Invalid GeoJSON type in ${filePath}: ${geojson.type}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return [];
  }
}

function mergeGeoJSONFiles(inputFiles, outputFile) {
  const allFeatures = [];
  const idSet = new Set();
  let duplicateCount = 0;

  console.log(`📂 Reading ${inputFiles.length} GeoJSON file(s)...`);

  inputFiles.forEach((filePath, index) => {
    const features = readGeoJSON(filePath);
    console.log(`  ✓ ${path.basename(filePath)}: ${features.length} feature(s)`);

    features.forEach((feature) => {
      // 检查 feature.id
      if (!feature.id) {
        console.warn(`  ⚠️  Feature in ${path.basename(filePath)} missing id, skipping`);
        return;
      }

      const featureId = String(feature.id);
      
      // 检查重复 ID
      if (idSet.has(featureId)) {
        duplicateCount++;
        console.warn(`  ⚠️  Duplicate feature.id: ${featureId} (from ${path.basename(filePath)})`);
        // 可以选择跳过或重命名
        // 这里选择跳过重复项
        return;
      }

      idSet.add(featureId);
      allFeatures.push(feature);
    });
  });

  if (duplicateCount > 0) {
    console.warn(`\n⚠️  Found ${duplicateCount} duplicate feature.id(s), skipped`);
  }

  const merged = {
    type: 'FeatureCollection',
    features: allFeatures
  };

  // 确保输出目录存在
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));

  console.log(`\n✅ Merged ${allFeatures.length} feature(s) into:`);
  console.log(`   ${outputFile}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Total features: ${allFeatures.length}`);
  console.log(`   - Duplicate IDs skipped: ${duplicateCount}`);
}

// 主程序
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage:');
  console.error('   node merge-geojson.js <input1.geojson> <input2.geojson> ... <output.geojson>');
  console.error('   或');
  console.error('   node merge-geojson.js --dir <input-directory> <output.geojson>');
  process.exit(1);
}

let inputFiles = [];
let outputFile = '';

if (args[0] === '--dir') {
  // 目录模式
  if (args.length < 3) {
    console.error('❌ Usage: node merge-geojson.js --dir <input-directory> <output.geojson>');
    process.exit(1);
  }

  const inputDir = args[1];
  outputFile = args[2];

  if (!fs.existsSync(inputDir)) {
    console.error(`❌ Directory not found: ${inputDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.geojson') || file.endsWith('.json'))
    .map(file => path.join(inputDir, file))
    .sort();

  if (files.length === 0) {
    console.error(`❌ No GeoJSON files found in ${inputDir}`);
    process.exit(1);
  }

  inputFiles = files;
} else {
  // 文件列表模式
  outputFile = args[args.length - 1];
  inputFiles = args.slice(0, -1);
}

// 验证输入文件
inputFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ File not found: ${file}`);
    process.exit(1);
  }
});

mergeGeoJSONFiles(inputFiles, outputFile);





