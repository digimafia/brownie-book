import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const any = readFileSync('public/icon.svg');
const mask = readFileSync('public/icon-maskable.svg');
await sharp(any).resize(192, 192).png().toFile('public/pwa-192.png');
await sharp(any).resize(512, 512).png().toFile('public/pwa-512.png');
await sharp(mask).resize(512, 512).png().toFile('public/pwa-512-maskable.png');
await sharp(any).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('icons written');
