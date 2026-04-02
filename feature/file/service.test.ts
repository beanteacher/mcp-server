import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, readFile, unlink } from 'fs/promises';
import { Document } from 'docx';
import { slugify, parseMd, mdToDocx, mdToPdf } from './service';

// ── slugify ──

describe('slugify', () => {
  it('한글 헤딩', () => expect(slugify('1. 서론')).toBe('1-서론'));
  it('영문', () => expect(slugify('Hello World')).toBe('hello-world'));
  it('한영 혼합', () => expect(slugify('KVKK 법제 및 분석')).toBe('kvkk-법제-및-분석'));
  it('마크다운 문법 제거', () => expect(slugify('**bold** `code`')).toBe('bold-code'));
  it('괄호 제거', () => expect(slugify('굴삭기(건설장비) 현황')).toBe('굴삭기건설장비-현황'));
  it('중복 하이픈 정리', () => expect(slugify('a  -  b')).toBe('a-b'));
  it('빈 문자열', () => expect(slugify('')).toBe(''));
});

// ── parseMd ──

describe('parseMd', () => {
  it('헤딩 파싱', () => {
    const blocks = parseMd('# 제목\n\n## 소제목');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: 'heading', level: 1, text: '제목' });
    expect(blocks[1]).toMatchObject({ type: 'heading', level: 2, text: '소제목' });
  });

  it('헤딩에 링크가 있으면 텍스트만 추출', () => {
    const blocks = parseMd('## [서론](#1-서론)');
    expect(blocks[0]).toMatchObject({ type: 'heading', text: '서론' });
  });

  it('헤딩에 bookmark ID 생성', () => {
    const blocks = parseMd('## 1. 서론');
    expect(blocks[0]).toMatchObject({ bid: '1-서론' });
  });

  it('불릿 목록 다단계', () => {
    const blocks = parseMd('- 항목1\n  - 하위항목');
    expect(blocks[0]).toMatchObject({ type: 'bullet', text: '항목1', level: 0 });
    expect(blocks[1]).toMatchObject({ type: 'bullet', text: '하위항목', level: 1 });
  });

  it('번호 목록', () => {
    const blocks = parseMd('1. 첫째\n2. 둘째');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: 'numbered', num: '1', text: '첫째' });
  });

  it('코드 블록', () => {
    const blocks = parseMd('```\nconst x = 1;\n```');
    expect(blocks[0]).toMatchObject({ type: 'code', text: 'const x = 1;' });
  });

  it('인용문', () => {
    const blocks = parseMd('> 인용문 테스트');
    expect(blocks[0]).toMatchObject({ type: 'blockquote', text: '인용문 테스트' });
  });

  it('테이블', () => {
    const md = '| 이름 | 값 |\n| --- | --- |\n| A | 1 |\n| B | 2 |';
    const blocks = parseMd(md);
    expect(blocks[0]).toMatchObject({
      type: 'table',
      headers: ['이름', '값'],
      rows: [['A', '1'], ['B', '2']],
    });
  });

  it('수평선 무시', () => {
    const blocks = parseMd('텍스트\n\n---\n\n다음');
    expect(blocks.every(b => b.type !== 'code')).toBe(true);
    expect(blocks).toHaveLength(2);
  });

  it('빈 입력', () => {
    expect(parseMd('')).toHaveLength(0);
  });
});

// ── mdToDocx (통합) ──

describe('mdToDocx', () => {
  const tmpMd = join(tmpdir(), `test-${Date.now()}.md`);
  const tmpDocx = join(tmpdir(), `test-${Date.now()}.docx`);

  it('목차 링크 → 내부 하이퍼링크, 헤딩 → 북마크', async () => {
    const md = [
      '## 목차',
      '',
      '1. [서론](#1-서론)',
      '',
      '---',
      '',
      '## 1. 서론',
      '',
      '본문입니다.',
    ].join('\n');

    await writeFile(tmpMd, md, 'utf-8');
    const result = await mdToDocx(tmpMd, tmpDocx);

    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.outputPath).toBe(tmpDocx);

    // DOCX는 ZIP → word/document.xml 내에 북마크/하이퍼링크가 포함되어야 함
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await readFile(tmpDocx));
    const docXml = await zip.file('word/document.xml')!.async('string');
    expect(docXml).toContain('1-서론'); // bookmark name or anchor

    await unlink(tmpMd).catch(() => {});
    await unlink(tmpDocx).catch(() => {});
  });

  it('테이블이 포함된 DOCX 생성', async () => {
    const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
    const mdPath = join(tmpdir(), `tbl-${Date.now()}.md`);
    const docxPath = join(tmpdir(), `tbl-${Date.now()}.docx`);

    await writeFile(mdPath, md, 'utf-8');
    const result = await mdToDocx(mdPath, docxPath);
    expect(result.sizeBytes).toBeGreaterThan(0);

    await unlink(mdPath).catch(() => {});
    await unlink(docxPath).catch(() => {});
  });

  it('코드 블록이 포함된 DOCX 생성', async () => {
    const md = '```\nconst x = 1;\n```';
    const mdPath = join(tmpdir(), `code-${Date.now()}.md`);
    const docxPath = join(tmpdir(), `code-${Date.now()}.docx`);

    await writeFile(mdPath, md, 'utf-8');
    const result = await mdToDocx(mdPath, docxPath);
    expect(result.sizeBytes).toBeGreaterThan(0);

    await unlink(mdPath).catch(() => {});
    await unlink(docxPath).catch(() => {});
  });
});

// ── mdToPdf (통합) ──

describe('mdToPdf', () => {
  it('목차 링크 + 헤딩 포함 PDF 생성', async () => {
    const md = [
      '## 목차',
      '',
      '1. [서론](#1-서론)',
      '',
      '## 1. 서론',
      '',
      '본문입니다.',
    ].join('\n');

    const mdPath = join(tmpdir(), `pdf-${Date.now()}.md`);
    const pdfPath = join(tmpdir(), `pdf-${Date.now()}.pdf`);

    await writeFile(mdPath, md, 'utf-8');
    const result = await mdToPdf(mdPath, pdfPath);

    expect(result.sizeBytes).toBeGreaterThan(0);

    // PDF 시그니처 확인
    const buf = await readFile(pdfPath);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');

    await unlink(mdPath).catch(() => {});
    await unlink(pdfPath).catch(() => {});
  });

  it('테이블 포함 PDF 생성', async () => {
    const md = '| 헤더1 | 헤더2 |\n| --- | --- |\n| A | B |';
    const mdPath = join(tmpdir(), `ptbl-${Date.now()}.md`);
    const pdfPath = join(tmpdir(), `ptbl-${Date.now()}.pdf`);

    await writeFile(mdPath, md, 'utf-8');
    const result = await mdToPdf(mdPath, pdfPath);
    expect(result.sizeBytes).toBeGreaterThan(0);

    await unlink(mdPath).catch(() => {});
    await unlink(pdfPath).catch(() => {});
  });

  it('빈 MD → PDF 생성 (크래시 없음)', async () => {
    const mdPath = join(tmpdir(), `empty-${Date.now()}.md`);
    const pdfPath = join(tmpdir(), `empty-${Date.now()}.pdf`);

    await writeFile(mdPath, '', 'utf-8');
    const result = await mdToPdf(mdPath, pdfPath);
    expect(result.sizeBytes).toBeGreaterThan(0);

    await unlink(mdPath).catch(() => {});
    await unlink(pdfPath).catch(() => {});
  });
});
