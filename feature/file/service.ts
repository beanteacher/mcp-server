import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  BookmarkStart, BookmarkEnd, InternalHyperlink,
  WidthType, AlignmentType, BorderStyle, ShadingType, UnderlineType,
} from 'docx';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { readFile, writeFile, stat as fsStat } from 'fs/promises';
import { createWriteStream } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

// ── Constants ──

const FONT = '맑은 고딕';
const CODE = 'Consolas';
const CM25 = 1418; // 2.5cm in twips

const FONT_DIR = 'C:/Windows/Fonts';
const MALGUN = `${FONT_DIR}/malgun.ttf`;
const MALGUN_B = `${FONT_DIR}/malgunbd.ttf`;
const CONSOLA = `${FONT_DIR}/consola.ttf`;

// ── Types ──

export interface ConvertResult {
  outputPath: string;
  sizeBytes: number;
}

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string; bid: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string; level: number }
  | { type: 'numbered'; num: string; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

// ── Shared Parser ──

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[*`[\]()]+/g, '')
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripLinks(t: string) { return t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); }
function stripBold(t: string) { return t.replace(/\*\*(.+?)\*\*/g, '$1'); }
function stripCode(t: string) { return t.replace(/`(.+?)`/g, '$1'); }
function stripAll(t: string) { return stripCode(stripBold(stripLinks(t))); }

function parseTableLines(lines: string[], start: number) {
  const hs = lines[start].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  let sep = start + 1;
  if (sep < lines.length && /^\s*\|[\s\-:|]+\|/.test(lines[sep])) sep++;
  const rows: string[][] = [];
  let i = sep;
  while (i < lines.length) {
    const l = lines[i].trim();
    if (!l.startsWith('|')) break;
    const r = l.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    while (r.length < hs.length) r.push('');
    rows.push(r.slice(0, hs.length));
    i++;
  }
  return { headers: hs, rows, endIdx: i };
}

export function parseMd(text: string): MdBlock[] {
  const lines = text.split('\n');
  const blocks: MdBlock[] = [];
  let i = 0, inCode = false;
  const codeBuf: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', text: codeBuf.join('\n') });
        codeBuf.length = 0;
        inCode = false;
      } else inCode = true;
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    const s = line.trim();
    if (!s) { i++; continue; }
    if (/^-{3,}$/.test(s) || /^\*{3,}$/.test(s)) { i++; continue; }

    const hm = s.match(/^(#{1,4})\s*(.+)/);
    if (hm) {
      const lv = hm[1].length as 1 | 2 | 3 | 4;
      const t = stripLinks(hm[2].trim());
      blocks.push({ type: 'heading', level: lv, text: t, bid: slugify(t) });
      i++; continue;
    }

    if (s.startsWith('|') && i + 1 < lines.length && /^\s*\|[\s\-:|]+\|/.test(lines[i + 1])) {
      const { headers, rows, endIdx } = parseTableLines(lines, i);
      blocks.push({ type: 'table', headers: headers.map(stripBold), rows });
      i = endIdx; continue;
    }

    if (s.startsWith('>')) {
      let qt = s.replace(/^>+/, '').trim();
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++;
        const nl = lines[i].trim().replace(/^>+/, '').trim();
        if (nl) qt += '\n' + nl;
      }
      blocks.push({ type: 'blockquote', text: qt });
      i++; continue;
    }

    const nm = s.match(/^(\d+)\.\s+(.+)/);
    if (nm) { blocks.push({ type: 'numbered', num: nm[1], text: nm[2] }); i++; continue; }

    const bm = line.match(/^(\s*)([-*])\s+(.+)/);
    if (bm) {
      const indent = bm[1].length;
      const lv = indent < 2 ? 0 : indent < 4 ? 1 : Math.min(Math.floor(indent / 2), 3);
      blocks.push({ type: 'bullet', text: bm[3], level: lv });
      i++; continue;
    }

    blocks.push({ type: 'paragraph', text: s });
    i++;
  }
  return blocks;
}

// ── DOCX Renderer ──

type DocxChild = TextRun | InternalHyperlink;

function inlineDocx(text: string, size: number, color: string): DocxChild[] {
  const out: DocxChild[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m: RegExpExecArray | null;

  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) out.push(...boldCodeRuns(text.slice(last, m.index), size, color));
    const [, lt, href] = m;
    if (href.startsWith('#')) {
      out.push(new InternalHyperlink({
        anchor: href.slice(1),
        children: [new TextRun({ text: lt, font: FONT, size: size * 2, color: '005AB5', underline: { type: UnderlineType.SINGLE } })],
      }));
    } else {
      out.push(...boldCodeRuns(lt, size, color));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...boldCodeRuns(text.slice(last), size, color));
  return out;
}

function boldCodeRuns(text: string, size: number, color: string): TextRun[] {
  const out: TextRun[] = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0, m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), font: FONT, size: size * 2, color }));
    if (m[2]) out.push(new TextRun({ text: m[2], font: FONT, size: size * 2, color, bold: true }));
    else if (m[3]) out.push(new TextRun({ text: m[3], font: CODE, size: Math.max(size - 1, 8) * 2, color: 'B43232' }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), font: FONT, size: size * 2, color }));
  return out;
}

function blockToDocx(block: MdBlock, bid: { n: number }): (Paragraph | Table)[] {
  switch (block.type) {
    case 'heading': {
      const sz = [0, 18, 14, 12, 11][block.level];
      const cl = ['', '1E1E1E', '282828', '323232', '3C3C3C'][block.level];
      bid.n++;
      const children: (BookmarkStart | TextRun | BookmarkEnd)[] = [
        new BookmarkStart(block.bid, bid.n),
        new TextRun({ text: block.text, font: FONT, size: sz * 2, color: cl, bold: true }),
        new BookmarkEnd(bid.n),
      ];
      const opts: Record<string, unknown> = {
        children,
        spacing: { after: block.level <= 2 ? 120 : 80 },
      };
      if (block.level >= 2) (opts.spacing as Record<string, number>).before = block.level === 2 ? 320 : block.level === 3 ? 200 : 160;
      if (block.level === 2) opts.border = { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC', space: 1 } };
      return [new Paragraph(opts as ConstructorParameters<typeof Paragraph>[0])];
    }
    case 'paragraph':
      return [new Paragraph({ children: inlineDocx(block.text, 10, '323232'), spacing: { after: 80 } })];
    case 'bullet': {
      const indent = 0.8 + block.level * 0.8;
      const markers = ['\u2022', '-', '\u25E6'];
      return [new Paragraph({
        children: [
          new TextRun({ text: `${markers[Math.min(block.level, 2)]} `, font: FONT, size: 20, color: '323232' }),
          ...inlineDocx(block.text, 10, '323232'),
        ],
        indent: { left: Math.round(indent * 567), hanging: Math.round(0.4 * 567) },
        spacing: { after: 40 },
      })];
    }
    case 'numbered':
      return [new Paragraph({
        children: [
          new TextRun({ text: `${block.num}. `, font: FONT, size: 20, color: '323232' }),
          ...inlineDocx(block.text, 10, '323232'),
        ],
        indent: { left: Math.round(0.8 * 567), hanging: Math.round(0.4 * 567) },
        spacing: { after: 40 },
      })];
    case 'blockquote':
      return [new Paragraph({
        children: inlineDocx(block.text, 10, '505050'),
        border: { left: { style: BorderStyle.SINGLE, size: 3, color: 'B0B0B0', space: 8 } },
        shading: { fill: 'F5F5F5', type: ShadingType.CLEAR, color: 'auto' },
        spacing: { after: 120 },
      })];
    case 'code':
      return [new Paragraph({
        children: [new TextRun({ text: block.text, font: CODE, size: 18, color: '3C3C3C' })],
        shading: { fill: 'F0F0F0', type: ShadingType.CLEAR, color: 'auto' },
        spacing: { after: 120 },
      })];
    case 'table': {
      const bdr = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
      const hdrRow = new TableRow({
        children: block.headers.map(h => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: h, font: FONT, size: 18, color: 'FFFFFF', bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
          })],
          shading: { fill: '373F51', type: ShadingType.CLEAR, color: 'auto' },
        })),
      });
      const dataRows = block.rows.map((row, ri) => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({
            children: inlineDocx(cell, 9, '323232'),
            spacing: { before: 60, after: 60 },
          })],
          shading: { fill: ri % 2 === 1 ? 'F8F9FA' : 'FFFFFF', type: ShadingType.CLEAR, color: 'auto' },
        })),
      }));
      const colCount = block.headers.length;
      const contentTwips = 9070; // A4 - 2.5cm margins
      const colW = Array(colCount).fill(Math.floor(contentTwips / colCount));
      return [
        new Table({
          rows: [hdrRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: colW,
          borders: { top: bdr, bottom: bdr, left: bdr, right: bdr, insideHorizontal: bdr, insideVertical: bdr },
        }),
        new Paragraph({ spacing: { after: 80 } }),
      ];
    }
  }
}

export async function mdToDocx(sourcePath: string, outputPath?: string): Promise<ConvertResult> {
  const src = resolve(sourcePath);
  const out = outputPath ? resolve(outputPath) : src.replace(/\.md$/i, '.docx');
  const md = await readFile(src, 'utf-8');
  const blocks = parseMd(md);
  const bid = { n: 0 };
  const children = blocks.flatMap(b => blockToDocx(b, bid));

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: CM25, bottom: CM25, left: CM25, right: CM25 } } },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  await writeFile(out, buffer);
  const info = await fsStat(out);
  return { outputPath: out, sizeBytes: info.size };
}

// ── PDF Renderer ──

export async function mdToPdf(sourcePath: string, outputPath?: string): Promise<ConvertResult> {
  const src = resolve(sourcePath);
  const out = outputPath ? resolve(outputPath) : src.replace(/\.md$/i, '.pdf');
  const md = await readFile(src, 'utf-8');
  const blocks = parseMd(md);

  const doc = new PDFDocument({ margin: 72, size: 'A4' });
  doc.registerFont('malgun', MALGUN);
  doc.registerFont('malgun-bold', MALGUN_B);
  doc.registerFont('consolas', CONSOLA);

  const pageW = doc.page.width;
  const margin = 72;
  const contentW = pageW - 2 * margin;

  // 한글 앵커 → ASCII ID 매핑 (pdfkit goTo 호환성)
  const anchorMap = new Map<string, string>();
  let hIdx = 0;
  for (const b of blocks) {
    if (b.type === 'heading') anchorMap.set(b.bid, `h${++hIdx}`);
  }

  for (const block of blocks) {
    if (doc.y > doc.page.height - 100) doc.addPage();
    doc.x = margin; // 매 블록마다 x 위치 초기화

    switch (block.type) {
      case 'heading': {
        const sizes = [0, 18, 14, 12, 11];
        doc.moveDown(block.level <= 2 ? 0.8 : 0.5);
        doc.addNamedDestination(anchorMap.get(block.bid) || block.bid);
        doc.font('malgun-bold').fontSize(sizes[block.level]).fillColor('#1E1E1E');
        doc.text(block.text, { width: contentW });
        if (block.level === 2) {
          const ly = doc.y + 2;
          doc.moveTo(margin, ly).lineTo(pageW - margin, ly)
            .strokeColor('#CCCCCC').lineWidth(0.5).stroke();
          doc.moveDown(0.3);
        }
        doc.moveDown(0.2);
        break;
      }
      case 'paragraph':
        doc.font('malgun').fontSize(10).fillColor('#323232');
        doc.text(stripAll(block.text), { width: contentW });
        doc.moveDown(0.3);
        break;
      case 'bullet': {
        const ind = 8 + block.level * 8;
        const markers = ['\u2022', '-', '\u25E6'];
        doc.font('malgun').fontSize(10).fillColor('#323232');
        doc.text(`${markers[Math.min(block.level, 2)]} ${stripAll(block.text)}`, margin + ind, undefined, { width: contentW - ind });
        doc.moveDown(0.1);
        break;
      }
      case 'numbered': {
        const linkMatch = block.text.match(/^\[([^\]]+)\]\(#([^)]+)\)$/);
        if (linkMatch) {
          const destId = anchorMap.get(linkMatch[2]) || linkMatch[2];
          doc.font('malgun').fontSize(10).fillColor('#005AB5');
          doc.text(`${block.num}. ${linkMatch[1]}`, margin + 8, undefined, { width: contentW - 8, goTo: destId, underline: true });
        } else {
          doc.font('malgun').fontSize(10).fillColor('#323232');
          doc.text(`${block.num}. ${stripAll(block.text)}`, margin + 8, undefined, { width: contentW - 8 });
        }
        doc.moveDown(0.1);
        break;
      }
      case 'blockquote': {
        doc.font('malgun').fontSize(10).fillColor('#505050');
        // 페이지 넘김 시 바가 깨지지 않도록 텍스트 높이 사전 계산
        const qHeight = doc.heightOfString(stripAll(block.text), { width: contentW - 15 });
        if (doc.y + qHeight + 10 > doc.page.height - 72) doc.addPage();
        const yBefore = doc.y;
        doc.text(stripAll(block.text), margin + 15, undefined, { width: contentW - 15 });
        const yAfter = doc.y;
        // 같은 페이지에서만 세로 바 그리기
        if (yAfter > yBefore) {
          doc.save();
          doc.moveTo(margin + 10, yBefore).lineTo(margin + 10, yAfter)
            .strokeColor('#B0B0B0').lineWidth(2).stroke();
          doc.restore();
        }
        doc.moveDown(0.3);
        break;
      }
      case 'code': {
        doc.font('consolas').fontSize(9);
        const codeH = doc.heightOfString(block.text, { width: contentW - 10 }) + 10;
        const codeY = doc.y;
        if (codeY + codeH > doc.page.height - 72) { doc.addPage(); }
        const cy = doc.y;
        doc.save();
        doc.rect(margin, cy, contentW, codeH).fill('#F0F0F0');
        doc.restore();
        doc.fillColor('#3C3C3C');
        doc.text(block.text, margin + 5, cy + 5, { width: contentW - 10 });
        doc.moveDown(0.3);
        break;
      }
      case 'table': {
        const colW = contentW / block.headers.length;
        const pad = 4;
        let y = doc.y;

        // Helper: calculate row height based on content
        const rowHeight = (cells: string[], font: string, fontSize: number): number => {
          doc.font(font).fontSize(fontSize);
          let maxH = 0;
          for (const cell of cells) {
            const h = doc.heightOfString(stripAll(cell), { width: colW - pad * 2 });
            if (h > maxH) maxH = h;
          }
          return maxH + pad * 2;
        };

        // Header
        const hdrH = Math.max(rowHeight(block.headers, 'malgun-bold', 9), 20);
        if (y + hdrH > doc.page.height - 72) { doc.addPage(); y = 72; }
        doc.save();
        block.headers.forEach((_, ci) => {
          doc.rect(margin + ci * colW, y, colW, hdrH).fillAndStroke('#373F51', '#CCCCCC');
        });
        doc.restore();
        doc.font('malgun-bold').fontSize(9).fillColor('#FFFFFF');
        block.headers.forEach((h, ci) => {
          doc.text(h, margin + ci * colW + pad, y + pad, { width: colW - pad * 2, align: 'center' });
        });
        y += hdrH;

        // Rows
        block.rows.forEach((row, ri) => {
          const rH = Math.max(rowHeight(row, 'malgun', 9), 18);
          if (y + rH > doc.page.height - 72) { doc.addPage(); y = 72; }
          const bg = ri % 2 === 1 ? '#F8F9FA' : '#FFFFFF';
          doc.save();
          row.forEach((_, ci) => {
            doc.rect(margin + ci * colW, y, colW, rH).fillAndStroke(bg, '#CCCCCC');
          });
          doc.restore();
          doc.font('malgun').fontSize(9).fillColor('#323232');
          row.forEach((cell, ci) => {
            doc.text(stripAll(cell), margin + ci * colW + pad, y + pad, { width: colW - pad * 2 });
          });
          y += rH;
        });

        doc.x = margin;
        doc.y = y + 5;
        break;
      }
    }
  }

  return new Promise<ConvertResult>((res, rej) => {
    const stream = createWriteStream(out);
    doc.pipe(stream);
    doc.end();
    stream.on('finish', async () => {
      const info = await fsStat(out);
      res({ outputPath: out, sizeBytes: info.size });
    });
    stream.on('error', rej);
  });
}

// ── Image Generator ──

export interface GenerateImageOptions {
  width: number;
  height: number;
  background?: string;
  text?: string;
  format?: 'png' | 'jpeg' | 'webp';
  outputPath?: string;
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

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
