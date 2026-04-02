import sharp from 'sharp';
import { writeFile, stat as fsStat } from 'fs/promises';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { ConvertResult } from './shared';

export interface GenerateImageOptions {
  width: number;
  height: number;
  background?: string;
  text?: string;
  format?: 'png' | 'jpeg' | 'webp';
  outputPath?: string;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function generateImage(opts: GenerateImageOptions): Promise<ConvertResult> {
  const { width, height, format = 'png' } = opts;
  const bg = opts.background || '#E0E0E0';

  if (width < 1 || width > 8192 || height < 1 || height > 8192) {
    throw new Error('이미지 크기는 1~8192 범위여야 합니다.');
  }

  // SVG로 배경 + 텍스트 오버레이 생성
  const label = opts.text ?? `${width}×${height}`;
  const fontSize = Math.max(12, Math.min(width, height) / 8);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
        font-family="sans-serif" font-size="${fontSize}" fill="#555">${escapeXml(label)}</text>
</svg>`;

  let pipeline = sharp(Buffer.from(svg));
  if (format === 'jpeg') pipeline = pipeline.jpeg({ quality: 90 });
  else if (format === 'webp') pipeline = pipeline.webp({ quality: 90 });
  else pipeline = pipeline.png();

  const buf = await pipeline.toBuffer();
  const out = opts.outputPath
    ? resolve(opts.outputPath)
    : join(tmpdir(), `sample-${width}x${height}-${Date.now()}.${format}`);

  await writeFile(out, buf);
  const info = await fsStat(out);
  return { outputPath: out, sizeBytes: info.size };
}
