#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputDir = process.argv[3] || path.dirname(inputPath) || '.';

if (!inputPath) {
  console.error('Usage: node promote-adcode-to-id.js <input.geojson|input.json|directory> [output-directory]');
  process.exit(1);
}

function processFile(inputFile, outputFile) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    return false;
  }

  try {
    const geojsonData = fs.readFileSync(inputFile, 'utf8');
    const geojson = JSON.parse(geojsonData);

    if (geojson.type !== 'FeatureCollection') {
      console.warn(`Warning: ${inputFile} is not a FeatureCollection, skipping`);
      return false;
    }

    const processedFeatures = geojson.features.map((feature, index) => {
      if (feature.type !== 'Feature') {
        console.warn(`Warning: Skipping non-Feature at index ${index} in ${inputFile}`);
        return null;
      }

      if (!feature.properties || !feature.properties.adcode) {
        console.warn(`Warning: Feature at index ${index} missing properties.adcode in ${inputFile}`);
        return null;
      }

      const adcode = feature.properties.adcode;
      const featureId = String(adcode);

      return {
        ...feature,
        id: featureId,
        properties: {
          ...feature.properties
        }
      };
    }).filter(feature => feature !== null);

    const output = {
      type: 'FeatureCollection',
      features: processedFeatures
    };

    const absoluteOutputPath = path.resolve(outputFile);
    const outputDirPath = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    fs.writeFileSync(absoluteOutputPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✓ Processed ${processedFeatures.length} features: ${path.basename(inputFile)} → ${absoluteOutputPath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${inputFile}:`, error.message);
    return false;
  }
}

const stats = fs.statSync(inputPath);

if (stats.isDirectory()) {
  const files = fs.readdirSync(inputPath).filter(file => 
    file.endsWith('.json') || file.endsWith('.geojson')
  );

  if (files.length === 0) {
    console.error(`Error: No JSON/GeoJSON files found in directory: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Processing ${files.length} files from directory: ${inputPath}\n`);
  
  let successCount = 0;
  files.forEach(file => {
    const inputFile = path.join(inputPath, file);
    const outputFile = path.join(outputDir, file.replace(/\.(json|geojson)$/i, '-processed.geojson'));
    if (processFile(inputFile, outputFile)) {
      successCount++;
    }
  });

  console.log(`\n✓ Successfully processed ${successCount}/${files.length} files`);
  console.log(`Output directory: ${path.resolve(outputDir)}`);
} else {
  const outputFile = process.argv[3] || inputPath.replace(/\.(json|geojson)$/i, '-processed.geojson');
  if (processFile(inputPath, outputFile)) {
    const absoluteOutputPath = path.resolve(outputFile);
    console.log(`\nOutput written to: ${absoluteOutputPath}`);
  }
}
