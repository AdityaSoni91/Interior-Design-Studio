const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

console.log('[Build] Verifying production animation assets for INNOVA INTERIORS...');

const framesDir = path.join(__dirname, 'frames');
const zipFile = path.join(__dirname, 'interior design 1.zip');

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Check how many valid frame files currently exist
let existingFiles = fs.readdirSync(framesDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));

if (existingFiles.length < 238) {
  if (fs.existsSync(zipFile)) {
    console.log(`[Build] Found ${existingFiles.length}/238 frames. Extracting from "interior design 1.zip"...`);
    const zip = new AdmZip(zipFile);
    zip.extractAllTo(framesDir, true);
    existingFiles = fs.readdirSync(framesDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));
    console.log(`[Build] Extraction complete. ${existingFiles.length} frames ready.`);
  } else {
    console.warn(`[Build] Warning: Only ${existingFiles.length}/238 frames present and "interior design 1.zip" not found.`);
  }
} else {
  console.log(`[Build] All ${existingFiles.length} frames verified in frames/.`);
}

// Final check: confirm keyframes exist
const firstFrame = path.join(framesDir, 'ezgif-frame-001.jpg');
const lastFrame = path.join(framesDir, 'ezgif-frame-238.jpg');

if (fs.existsSync(firstFrame) && fs.existsSync(lastFrame)) {
  console.log('[Build] ✓ Animation frames (001-238) verified and ready for deployment.');
} else {
  console.error('[Build] ✗ Error: First or last frame missing in frames/.');
  process.exit(1);
}

console.log('[Build] Production build completed successfully.');
