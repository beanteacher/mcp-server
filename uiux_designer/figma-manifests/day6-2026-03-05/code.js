// MCP Dashboard - Sprint4 Day6 Theme & Animation
// 2026-03-05
// 생성 프레임:
//   1. Sprint4 / Header Dark        — 다크 모드 헤더 (ThemeToggle 달 아이콘)
//   2. Sprint4 / Header Light       — 라이트 모드 헤더 (ThemeToggle 해 아이콘)
//   3. Sprint4 / ThemeToggle States — 달/해 아이콘 상태 클로즈업
//   4. Sprint4 / CommitCard Stagger — 커밋 카드 stagger 진입 애니메이션 (3단계)

figma.showUI(__html__, { width: 340, height: 620 });

// ─── Design Tokens ────────────────────────────────────────────────────────────
const DARK = {
  bgPage:        { r: 0.039, g: 0.059, b: 0.118 },   // #0A0F1E
  bgCard:        { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
  bgInput:       { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
  border:        { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
  borderHeader:  { r: 1, g: 1, b: 1 },               // white (opacity 0.1)
  textPrimary:   { r: 0.973, g: 0.980, b: 0.988 },   // #F8FAFC
  textSecondary: { r: 0.580, g: 0.635, b: 0.722 },   // #94A3B8
  textMuted:     { r: 0.278, g: 0.337, b: 0.412 },   // #475569
  primary500:    { r: 0.231, g: 0.510, b: 0.965 },   // #3B82F6
  primary300:    { r: 0.576, g: 0.773, b: 0.992 },   // #93C5FD
  neutral800:    { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
};

const LIGHT = {
  bgPage:        { r: 0.973, g: 0.980, b: 0.988 },   // #F8FAFC
  bgCard:        { r: 1.000, g: 1.000, b: 1.000 },   // #FFFFFF
  bgInput:       { r: 0.945, g: 0.953, b: 0.961 },   // neutral-100 ~#F1F5F9
  border:        { r: 0.886, g: 0.910, b: 0.941 },   // #E2E8F0
  textPrimary:   { r: 0.039, g: 0.059, b: 0.118 },   // #0A0F1E
  textSecondary: { r: 0.353, g: 0.416, b: 0.498 },   // neutral-500 ~#475569
  textMuted:     { r: 0.580, g: 0.635, b: 0.722 },   // neutral-400
  primary500:    { r: 0.231, g: 0.510, b: 0.965 },   // #3B82F6
  primary300:    { r: 0.576, g: 0.773, b: 0.992 },   // #93C5FD
  neutral100:    { r: 0.945, g: 0.953, b: 0.961 },   // #F1F5F9
};

// ─── Primitive Helpers ────────────────────────────────────────────────────────
function makeRect(x, y, w, h, color, opts) {
  const node = figma.createRectangle();
  node.x = x; node.y = y;
  node.resize(w, h);
  const fill = { type: 'SOLID', color };
  if (opts && opts.opacity !== undefined) fill.opacity = opts.opacity;
  node.fills = [fill];
  if (opts && opts.radius !== undefined) node.cornerRadius = opts.radius;
  if (opts && opts.stroke) {
    node.strokes = [{ type: 'SOLID', color: opts.stroke, opacity: opts.strokeOpacity || 1 }];
    node.strokeWeight = opts.strokeWeight || 1;
  }
  return node;
}

async function makeText(content, x, y, size, color, style, opts) {
  const fontStyle = style || 'Regular';
  await figma.loadFontAsync({ family: 'Inter', style: fontStyle });
  const node = figma.createText();
  node.fontName = { family: 'Inter', style: fontStyle };
  node.characters = content;
  node.fontSize = size;
  node.fills = [{ type: 'SOLID', color, opacity: opts && opts.opacity !== undefined ? opts.opacity : 1 }];
  node.x = x; node.y = y;
  return node;
}

function appendAll(parent, nodes) {
  nodes.forEach(n => parent.appendChild(n));
}

// ─── Frame: Header Dark ───────────────────────────────────────────────────────
async function buildHeaderDark(offsetX, offsetY) {
  const frame = figma.createFrame();
  frame.name = 'Sprint4 / Header Dark';
  frame.x = offsetX; frame.y = offsetY;
  frame.resize(800, 120);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: DARK.bgPage }];
  figma.currentPage.appendChild(frame);

  // Header bar (h-16 = 64px)
  const bar = makeRect(0, 0, 800, 64, DARK.bgCard);
  bar.strokes = [{ type: 'SOLID', color: DARK.borderHeader, opacity: 0.1 }];
  bar.strokeWeight = 1;
  frame.appendChild(bar);

  // Logo
  const logo = await makeText('MCP Tools', 24, 20, 15, DARK.primary500, 'Bold');
  frame.appendChild(logo);

  // Nav links
  const NAV = ['홈', '커밋 타임라인', '오늘의 요약', '유저 레포'];
  let nx = 260;
  for (let i = 0; i < NAV.length; i++) {
    const isActive = i === 1;
    if (isActive) {
      const pill = makeRect(nx - 8, 16, 110, 32, DARK.neutral800, { radius: 8 });
      frame.appendChild(pill);
    }
    const color = isActive ? DARK.primary300 : DARK.textSecondary;
    const t = await makeText(NAV[i], nx, 22, 12, color, isActive ? 'SemiBold' : 'Regular');
    frame.appendChild(t);
    nx += 120;
  }

  // ThemeToggle (달 아이콘)
  const toggleBg = makeRect(724, 18, 28, 28, DARK.neutral800, { radius: 9999 });
  frame.appendChild(toggleBg);
  const moonIcon = await makeText('🌙', 727, 19, 14, DARK.textSecondary, 'Regular');
  frame.appendChild(moonIcon);
  const toggleLabel = await makeText('ThemeToggle (dark)', 718, 50, 8, DARK.textMuted, 'Regular');
  frame.appendChild(toggleLabel);

  // Avatar
  const avatar = makeRect(760, 18, 28, 28, DARK.primary500, { radius: 9999 });
  frame.appendChild(avatar);

  // Annotations
  const ann = await makeText(
    '● bg-white dark:bg-surface-card  |  border-neutral-200 dark:border-neutral-200/10  |  defaultTheme="dark"',
    16, 76, 9, DARK.textMuted, 'Regular'
  );
  frame.appendChild(ann);

  return frame;
}

// ─── Frame: Header Light ──────────────────────────────────────────────────────
async function buildHeaderLight(offsetX, offsetY) {
  const frame = figma.createFrame();
  frame.name = 'Sprint4 / Header Light';
  frame.x = offsetX; frame.y = offsetY;
  frame.resize(800, 120);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: LIGHT.bgPage }];
  figma.currentPage.appendChild(frame);

  // Header bar
  const bar = makeRect(0, 0, 800, 64, LIGHT.bgCard);
  bar.strokes = [{ type: 'SOLID', color: LIGHT.border }];
  bar.strokeWeight = 1;
  frame.appendChild(bar);

  // Logo
  const logo = await makeText('MCP Tools', 24, 20, 15, LIGHT.primary500, 'Bold');
  frame.appendChild(logo);

  // Nav links
  const NAV = ['홈', '커밋 타임라인', '오늘의 요약', '유저 레포'];
  let nx = 260;
  for (let i = 0; i < NAV.length; i++) {
    const isActive = i === 1;
    if (isActive) {
      const pill = makeRect(nx - 8, 16, 110, 32, LIGHT.bgInput, { radius: 8 });
      frame.appendChild(pill);
    }
    const color = isActive ? LIGHT.primary300 : LIGHT.textSecondary;
    const t = await makeText(NAV[i], nx, 22, 12, color, isActive ? 'SemiBold' : 'Regular');
    frame.appendChild(t);
    nx += 120;
  }

  // ThemeToggle (해 아이콘, rotate 12deg 표현)
  const toggleBg = makeRect(724, 18, 28, 28, LIGHT.bgInput, { radius: 9999 });
  frame.appendChild(toggleBg);
  const sunIcon = await makeText('☀️', 727, 19, 14, LIGHT.textSecondary, 'Regular');
  frame.appendChild(sunIcon);
  const toggleLabel = await makeText('ThemeToggle (light, rotate 12deg)', 694, 50, 8, LIGHT.textMuted, 'Regular');
  frame.appendChild(toggleLabel);

  // Avatar
  const avatar = makeRect(760, 18, 28, 28, LIGHT.primary500, { radius: 9999 });
  frame.appendChild(avatar);

  // Annotations
  const ann = await makeText(
    '● bg-white dark:bg-surface-card  |  body: bg-#F8FAFC color-#0A0F1E  |  transition: 0.3s',
    16, 76, 9, LIGHT.textMuted, 'Regular'
  );
  frame.appendChild(ann);

  return frame;
}

// ─── Frame: ThemeToggle States ────────────────────────────────────────────────
async function buildThemeToggleStates(offsetX, offsetY) {
  const frame = figma.createFrame();
  frame.name = 'Sprint4 / ThemeToggle States';
  frame.x = offsetX; frame.y = offsetY;
  frame.resize(480, 200);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: DARK.bgPage }];
  figma.currentPage.appendChild(frame);

  const title = await makeText('ThemeToggle — 상태별 스펙', 20, 16, 13, DARK.textPrimary, 'Bold');
  frame.appendChild(title);

  // Dark state
  const darkBg = makeRect(20, 48, 160, 100, DARK.bgCard, { radius: 12 });
  frame.appendChild(darkBg);
  const darkLabel = await makeText('DARK MODE', 36, 56, 9, DARK.textMuted, 'Regular');
  frame.appendChild(darkLabel);
  const moonBg = makeRect(56, 76, 32, 32, DARK.neutral800, { radius: 9999 });
  frame.appendChild(moonBg);
  const moon = await makeText('🌙', 60, 78, 18, DARK.textSecondary, 'Regular');
  frame.appendChild(moon);
  const darkSpec = await makeText('rotate(0deg)', 38, 116, 9, DARK.textMuted, 'Regular');
  frame.appendChild(darkSpec);

  // Light state
  const lightBg = makeRect(200, 48, 160, 100, LIGHT.bgCard, { radius: 12 });
  lightBg.strokes = [{ type: 'SOLID', color: LIGHT.border }];
  lightBg.strokeWeight = 1;
  frame.appendChild(lightBg);
  const lightLabel = await makeText('LIGHT MODE', 216, 56, 9, LIGHT.textMuted, 'Regular');
  frame.appendChild(lightLabel);
  const sunBg = makeRect(236, 76, 32, 32, LIGHT.bgInput, { radius: 9999 });
  frame.appendChild(sunBg);
  const sun = await makeText('☀️', 240, 78, 18, LIGHT.textSecondary, 'Regular');
  frame.appendChild(sun);
  const lightSpec = await makeText('rotate(12deg)', 218, 116, 9, LIGHT.textMuted, 'Regular');
  frame.appendChild(lightSpec);

  // Spec annotations
  const spec1 = await makeText('● useTheme() → setTheme("dark"|"light")', 20, 162, 9, DARK.textSecondary, 'Regular');
  const spec2 = await makeText('● mounted 가드로 SSR hydration mismatch 방지', 20, 176, 9, DARK.textSecondary, 'Regular');
  appendAll(frame, [spec1, spec2]);

  return frame;
}

// ─── Frame: CommitCard Stagger ────────────────────────────────────────────────
// 3개 카드가 순차적으로 등장하는 상태를 정지 화면으로 표현
async function buildCommitCardStagger(offsetX, offsetY) {
  const frame = figma.createFrame();
  frame.name = 'Sprint4 / CommitCard Stagger';
  frame.x = offsetX; frame.y = offsetY;
  frame.resize(480, 360);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: DARK.bgPage }];
  figma.currentPage.appendChild(frame);

  const title = await makeText('CommitCard — Stagger 애니메이션 (animate-fade-up)', 20, 16, 12, DARK.textPrimary, 'Bold');
  frame.appendChild(title);

  const CARDS = [
    { delay: '0s',    opacity: 1.0, y: 0,   msg: 'feat: ThemeToggle 컴포넌트 추가', sha: 'a1b2c3d', author: 'beanteacher' },
    { delay: '0.04s', opacity: 0.6, y: 4,   msg: 'fix: hydration mismatch 방지',     sha: 'e4f5a6b', author: 'beanteacher' },
    { delay: '0.08s', opacity: 0.2, y: 8,   msg: 'style: dark: prefix 전체 컴포넌트', sha: 'c7d8e9f', author: 'beanteacher' },
  ];

  const cardBg = makeRect(20, 44, 440, 230, DARK.bgCard, {
    radius: 12,
    stroke: DARK.border,
    strokeWeight: 1,
  });
  frame.appendChild(cardBg);

  let cardY = 52;
  for (let i = 0; i < CARDS.length; i++) {
    const card = CARDS[i];

    // Dot
    const dot = makeRect(36, cardY + 6, 12, 12, DARK.primary500, { radius: 9999 });
    dot.opacity = card.opacity;
    frame.appendChild(dot);

    // Timeline line
    if (i < CARDS.length - 1) {
      const line = makeRect(41, cardY + 20, 2, 50, DARK.neutral800);
      line.opacity = card.opacity;
      frame.appendChild(line);
    }

    // Message
    const msg = await makeText(card.msg, 60, cardY + 2, 13, DARK.textPrimary, 'Medium');
    msg.opacity = card.opacity;
    frame.appendChild(msg);

    // SHA badge bg
    const shaBg = makeRect(60, cardY + 20, 52, 18, DARK.neutral800, { radius: 4 });
    shaBg.opacity = card.opacity;
    frame.appendChild(shaBg);
    const sha = await makeText(card.sha, 64, cardY + 23, 10, DARK.primary300, 'Regular');
    sha.opacity = card.opacity;
    frame.appendChild(sha);

    // Author
    const author = await makeText(card.author, 120, cardY + 23, 10, DARK.textSecondary, 'Regular');
    author.opacity = card.opacity;
    frame.appendChild(author);

    // Delay annotation
    const delayLabel = await makeText(`delay: ${card.delay}  opacity: ${card.opacity}  translateY: ${card.y}px → 0`, 340, cardY + 10, 8, DARK.textMuted, 'Regular');
    frame.appendChild(delayLabel);

    cardY += 70;
  }

  // Spec annotations
  const spec1 = await makeText('● animate-fade-up: opacity 0→1, translateY 8px→0, duration 0.3s', 20, 296, 9, DARK.textSecondary, 'Regular');
  const spec2 = await makeText('● stagger: index × 0.04s  (0s / 0.04s / 0.08s ...)', 20, 310, 9, DARK.textSecondary, 'Regular');
  const spec3 = await makeText('● break-words: 긴 커밋 메시지 줄바꿈 (truncate 제거)', 20, 324, 9, DARK.textSecondary, 'Regular');
  appendAll(frame, [spec1, spec2, spec3]);

  return frame;
}

// ─── Build All ────────────────────────────────────────────────────────────────
async function buildAll() {
  const built = [];
  built.push(await buildHeaderDark(0, 0));
  built.push(await buildHeaderLight(840, 0));
  built.push(await buildThemeToggleStates(0, 160));
  built.push(await buildCommitCardStagger(520, 160));
  figma.viewport.scrollAndZoomIntoView(built);
}

// ─── Message Handler ──────────────────────────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'build-all':
        figma.notify('Day6 프레임 생성 중...', { timeout: 2000 });
        await buildAll();
        figma.notify('완료! 4개 프레임이 생성되었습니다.', { timeout: 3000 });
        break;
      case 'build-header-dark':
        await buildHeaderDark(0, 0);
        figma.notify('Header Dark 프레임 생성 완료');
        break;
      case 'build-header-light':
        await buildHeaderLight(0, 0);
        figma.notify('Header Light 프레임 생성 완료');
        break;
      case 'build-toggle-states':
        await buildThemeToggleStates(0, 0);
        figma.notify('ThemeToggle States 프레임 생성 완료');
        break;
      case 'build-commit-stagger':
        await buildCommitCardStagger(0, 0);
        figma.notify('CommitCard Stagger 프레임 생성 완료');
        break;
      case 'close':
        figma.closePlugin();
        break;
    }
  } catch (err) {
    figma.notify('오류: ' + err.message, { error: true });
  }
};
