// Generate small, optimized favicons from the 512px app icon.
// The full 512px icon (~350 KB) is far too heavy to serve as a tab favicon.
// Run: node scripts/gen-favicons.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const src = path.join(root, 'public', 'brand', 'logo-512.png');
const pub = path.join(root, 'public');

const targets = [
  { size: 32, out: 'favicon-32.png' },
  { size: 48, out: 'favicon-48.png' },
  { size: 180, out: 'apple-touch-icon.png' },
];

for (const { size, out } of targets) {
  await sharp(src)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(pub, out));
  console.log(`✓ ${out} (${size}x${size})`);
}
