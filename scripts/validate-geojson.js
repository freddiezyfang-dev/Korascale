#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const input = process.argv[2];

if (!input) {
  console.error('❌ Please provide a GeoJSON file path');
  process.exit(1);
}

const filePath = path.resolve(input);

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

if (geojson.type !== 'FeatureCollection') {
  console.error('❌ Not a FeatureCollection');
  process.exit(1);
}

const idSet = new Set();
let errors = 0;

geojson.features.forEach((feature, index) => {
  const prefix = `Feature #${index}`;

  // 1. id existence
  if (feature.id === undefined || feature.id === null) {
    console.error(`❌ ${prefix}: missing feature.id`);
    errors++;
    return;
  }

  // 2. id must be string
  if (typeof feature.id !== 'string') {
    console.error(`❌ ${prefix}: feature.id is not string (${typeof feature.id})`);
    errors++;
  }

  // 3. id must be unique
  if (idSet.has(feature.id)) {
    console.error(`❌ ${prefix}: duplicate feature.id = ${feature.id}`);
    errors++;
  } else {
    idSet.add(feature.id);
  }

  // 4. geometry type
  const type = feature.geometry?.type;
  if (!['Polygon', 'MultiPolygon'].includes(type)) {
    console.error(`❌ ${prefix}: invalid geometry type = ${type}`);
    errors++;
  }

  // 5. basic coordinate sanity check
  const coords = feature.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length === 0) {
    console.error(`❌ ${prefix}: empty or invalid coordinates`);
    errors++;
  }
});

if (errors === 0) {
  console.log('✅ GeoJSON validation PASSED');
  console.log(`✔ Features: ${geojson.features.length}`);
  console.log(`✔ Unique IDs: ${idSet.size}`);
} else {
  console.error(`❌ GeoJSON validation FAILED with ${errors} error(s)`);
  process.exit(1);
}







