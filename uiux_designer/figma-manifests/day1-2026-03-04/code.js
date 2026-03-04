// MCP Tools Design System — Figma Plugin
// Day 1: 2026-03-04
// Figma Plugin API로 디자인 시스템 프레임 생성

figma.showUI(__html__, { width: 320, height: 480 });

// ── 토큰 정의 ──────────────────────────────────────────
const COLORS = {
  primary: [
    { name: 'primary-50',  hex: 0xEFF6FF },
    { name: 'primary-300', hex: 0x93C5FD },
    { name: 'primary-500', hex: 0x3B82F6 },
    { name: 'primary-700', hex: 0x1D4ED8 },
    { name: 'primary-900', hex: 0x1E3A8A },
  ],
  neutral: [
    { name: 'neutral-50',  hex: 0xF8FAFC },
    { name: 'neutral-200', hex: 0xE2E8F0 },
    { name: 'neutral-400', hex: 0x94A3B8 },
    { name: 'neutral-600', hex: 0x475569 },
    { name: 'neutral-800', hex: 0x1E293B },
    { name: 'neutral-950', hex: 0x0A0F1E },
  ],
  semantic: [
    { name: 'success', hex: 0x22C55E },
    { name: 'warning', hex: 0xF59E0B },
    { name: 'error',   hex: 0xEF4444 },
    { name: 'info',    hex: 0x38BDF8 },
  ],
};

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 30];
const SPACINGS   = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

// ── 헬퍼: hex → RGB (0~1) ──────────────────────────────
function hexToRgb(hex) {
  return {
    r: ((hex >> 16) & 0xff) / 255,
    g: ((hex >> 8)  & 0xff) / 255,
    b: (hex         & 0xff) / 255,
  };
}

// ── 헬퍼: 사각형 노드 생성 ─────────────────────────────
function makeRect(x, y, w, h, hex) {
  const node = figma.createRectangle();
  node.x = x; node.y = y;
  node.resize(w, h);
  node.fills = [{ type: 'SOLID', color: hexToRgb(hex) }];
  node.cornerRadius = 8;
  return node;
}

// ── 헬퍼: 텍스트 노드 생성 ────────────────────────────
async function makeText(content, x, y, size, hex, weight) {
  await figma.loadFontAsync({ family: 'Inter', style: weight || 'Regular' });
  const node = figma.createText();
  node.fontName   = { family: 'Inter', style: weight || 'Regular' };
  node.characters = content;
  node.fontSize   = size || 14;
  node.fills      = [{ type: 'SOLID', color: hexToRgb(hex || 0xF8FAFC) }];
  node.x = x; node.y = y;
  return node;
}

// ── 헬퍼: 섹션 제목 ───────────────────────────────────
async function makeSectionTitle(label, x, y) {
  return makeText(label, x, y, 18, 0x93C5FD, 'Semi Bold');
}

// ── 프레임 생성 헬퍼 ──────────────────────────────────
function createFrame(name, x, y, w, h, bgHex) {
  const frame = figma.createFrame();
  frame.name   = name;
  frame.x      = x; frame.y = y;
  frame.resize(w, h);
  frame.fills  = [{ type: 'SOLID', color: hexToRgb(bgHex || 0x0A0F1E) }];
  frame.cornerRadius = 12;
  return frame;
}

// ── 1. Design System / Colors ─────────────────────────
async function buildColorsFrame() {
  const frame = createFrame('Design System / Colors', 0, 0, 880, 600, 0x0A0F1E);
  figma.currentPage.appendChild(frame);

  let curX = 40;
  let curY = 40;

  for (const [groupName, swatches] of Object.entries(COLORS)) {
    const title = await makeSectionTitle(groupName.toUpperCase(), curX, curY);
    frame.appendChild(title);
    curY += 36;

    for (const swatch of swatches) {
      const rect = makeRect(curX, curY, 100, 64, swatch.hex);
      frame.appendChild(rect);
      const label = await makeText(swatch.name, curX, curY + 70, 11, 0x94A3B8);
      frame.appendChild(label);
      curX += 120;
    }

    curX  = 40;
    curY += 120;
  }

  return frame;
}

// ── 2. Design System / Typography ─────────────────────
async function buildTypographyFrame() {
  const frame = createFrame('Design System / Typography', 920, 0, 600, 500, 0x0A0F1E);
  figma.currentPage.appendChild(frame);

  const labels = ['xs','sm','base','lg','xl','2xl','3xl'];
  let curY = 40;

  for (let i = 0; i < FONT_SIZES.length; i++) {
    const size = FONT_SIZES[i];
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    const label = await makeText(`${labels[i]} / ${size}px  — Aa`, 40, curY, size, 0xF8FAFC);
    frame.appendChild(label);
    curY += size + 20;
  }

  return frame;
}

// ── 3. Design System / Spacing ────────────────────────
async function buildSpacingFrame() {
  const frame = createFrame('Design System / Spacing', 0, 640, 880, 300, 0x0A0F1E);
  figma.currentPage.appendChild(frame);

  let curX = 40;
  const baseY = 80;

  for (const sp of SPACINGS) {
    const bar = makeRect(curX, baseY, sp, sp, 0x3B82F6);
    frame.appendChild(bar);
    const label = await makeText(`${sp}px`, curX, baseY + sp + 8, 11, 0x94A3B8);
    frame.appendChild(label);
    curX += sp + 32;
  }

  return frame;
}

// ── 4. Design System / Components / Header ────────────
async function buildHeaderFrame() {
  const frame = createFrame('Design System / Components / Header', 0, 980, 1200, 120, 0x1E293B);
  figma.currentPage.appendChild(frame);

  // 로고
  const logo = await makeText('MCP Tools', 24, 28, 20, 0x3B82F6, 'Bold');
  frame.appendChild(logo);

  // 내비게이션 링크
  const navItems = ['홈', '커밋 타임라인', '오늘 요약', '유저 레포'];
  let navX = 200;
  for (const item of navItems) {
    const navLink = await makeText(item, navX, 32, 14, 0x94A3B8, 'Medium');
    frame.appendChild(navLink);
    navX += 140;
  }

  // 활성 링크 표시 (홈)
  const activeTab = makeRect(195, 22, 80, 36, 0x1E3A8A);
  activeTab.cornerRadius = 8;
  frame.appendChild(activeTab);
  const activeLabel = await makeText('홈', 219, 32, 14, 0x93C5FD, 'Semi Bold');
  frame.appendChild(activeLabel);

  // 아바타
  const avatar = makeRect(1148, 24, 32, 32, 0x3B82F6);
  avatar.cornerRadius = 9999;
  frame.appendChild(avatar);

  return frame;
}

// ── 5. Design System / Components / Navigation ────────
async function buildNavigationFrame() {
  const frame = createFrame('Design System / Components / Navigation', 0, 1140, 800, 280, 0x0A0F1E);
  figma.currentPage.appendChild(frame);

  const states = [
    { label: '기본', bg: 0x0A0F1E, textHex: 0x94A3B8, weight: 'Medium' },
    { label: 'hover', bg: 0x1E293B, textHex: 0xF8FAFC, weight: 'Medium' },
    { label: 'active', bg: 0x1E3A8A, textHex: 0x93C5FD, weight: 'Semi Bold' },
  ];

  let curX = 40;

  for (const state of states) {
    // 상태 라벨
    const stateLabel = await makeText(state.label, curX, 20, 12, 0x94A3B8);
    frame.appendChild(stateLabel);

    // 아이템 배경
    const bg = makeRect(curX, 50, 160, 40, state.bg);
    bg.cornerRadius = 8;
    frame.appendChild(bg);

    // 아이템 텍스트
    const text = await makeText('커밋 타임라인', curX + 16, 62, 14, state.textHex, state.weight);
    frame.appendChild(text);

    curX += 200;
  }

  // 전체 네비 목업
  const navItems = ['홈', '커밋 타임라인', '오늘 요약', '유저 레포'];
  let navX = 40;
  const navY = 140;

  const stateLabel = await makeText('전체 네비게이션 — 기본 상태', 40, navY - 24, 12, 0x94A3B8);
  frame.appendChild(stateLabel);

  for (const item of navItems) {
    const bg = makeRect(navX, navY, 140, 40, 0x0A0F1E);
    bg.cornerRadius = 8;
    frame.appendChild(bg);
    const text = await makeText(item, navX + 16, navY + 12, 14, 0x94A3B8, 'Medium');
    frame.appendChild(text);
    navX += 160;
  }

  return frame;
}

// ── 메시지 핸들러 ─────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'build-all') {
      figma.notify('디자인 시스템 프레임 생성 중...', { timeout: 2000 });
      await buildColorsFrame();
      await buildTypographyFrame();
      await buildSpacingFrame();
      await buildHeaderFrame();
      await buildNavigationFrame();
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
      figma.notify('완료! 5개 프레임이 생성되었습니다.', { timeout: 3000 });
    } else if (msg.type === 'build-colors') {
      await buildColorsFrame();
      figma.notify('Colors 프레임 생성 완료');
    } else if (msg.type === 'build-typography') {
      await buildTypographyFrame();
      figma.notify('Typography 프레임 생성 완료');
    } else if (msg.type === 'build-spacing') {
      await buildSpacingFrame();
      figma.notify('Spacing 프레임 생성 완료');
    } else if (msg.type === 'build-header') {
      await buildHeaderFrame();
      figma.notify('Header 컴포넌트 프레임 생성 완료');
    } else if (msg.type === 'build-navigation') {
      await buildNavigationFrame();
      figma.notify('Navigation 컴포넌트 프레임 생성 완료');
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (err) {
    figma.notify('오류: ' + err.message, { error: true });
  }
};
