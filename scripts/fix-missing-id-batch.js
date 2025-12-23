// scripts/fix-missing-id-batch.js
const fs = require('fs');
const path = require('path');

const inputDir = process.argv[2];
const outputDir = process.argv[3] || path.join(inputDir, 'fixed');

if (!inputDir) {
  console.error('Usage: node fix-missing-id-batch.js <input-directory> [output-directory]');
  process.exit(1);
}

if (!fs.existsSync(inputDir)) {
  console.error('❌ Input directory not found:', inputDir);
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('📁 Created output directory:', outputDir);
}

function fixFile(inputFile, outputFile) {
  try {
    const geojson = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    if (geojson.type !== 'FeatureCollection') {
      console.warn(`⚠️  Skipping ${path.basename(inputFile)}: Not a FeatureCollection`);
      return false;
    }

    let fixedCount = 0;
    geojson.features.forEach((feature, index) => {
      if (feature.id == null) {
        if (feature.properties?.adcode != null) {
          feature.id = String(feature.properties.adcode);
          fixedCount++;
        } else {
          feature.id = `__auto_${index}`;
          fixedCount++;
        }
      }
    });

    fs.writeFileSync(outputFile, JSON.stringify(geojson, null, 2));
    console.log(`✅ ${path.basename(inputFile)} → ${path.basename(outputFile)} (fixed ${fixedCount} features)`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${path.basename(inputFile)}:`, error.message);
    return false;
  }
}

const files = fs.readdirSync(inputDir).filter(file => 
  file.endsWith('.json') || file.endsWith('.geojson')
);

if (files.length === 0) {
  console.error('❌ No JSON/GeoJSON files found in directory');
  process.exit(1);
}

console.log(`\n🔄 Processing ${files.length} files...\n`);

let successCount = 0;
files.forEach(file => {
  const inputFile = path.join(inputDir, file);
  const outputFile = path.join(outputDir, file.replace(/\.(json|geojson)$/i, '-fixed.geojson'));
  if (fixFile(inputFile, outputFile)) {
    successCount++;
  }
});

console.log(`\n✨ Completed: ${successCount}/${files.length} files processed successfully`);
console.log(`📂 Output directory: ${path.resolve(outputDir)}`);







