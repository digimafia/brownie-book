import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const icon = readFileSync('public/icon.png');

await sharp(icon).resize(192, 192).png().toFile('public/pwa-192.png');
await sharp(icon).resize(512, 512).png().toFile('public/pwa-512.png');
await sharp(icon).resize(512, 512).png().toFile('public/pwa-512-maskable.png');
await sharp(icon).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('icons written');
