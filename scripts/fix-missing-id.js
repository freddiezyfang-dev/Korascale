// scripts/fix-missing-id.js
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
const output = process.argv[3] || input.replace('.geojson', '-fixed.geojson');

const geojson = JSON.parse(fs.readFileSync(input, 'utf8'));

geojson.features.forEach((feature, index) => {
  if (feature.id == null) {
    if (feature.properties?.adcode != null) {
      feature.id = String(feature.properties.adcode);
    } else {
      feature.id = `__auto_${index}`;
    }
  }
});

const outputDir = path.dirname(output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(output, JSON.stringify(geojson, null, 2));
console.log('✅ Fixed missing feature.id');
console.log('→ Output:', path.resolve(output));

