// MCP Tools UI Design — Figma Plugin Day 2
// 2026-03-04
// 생성 프레임:
//   1. Home / Desktop (1280px)
//   2. Home / Mobile (375px)
//   3. Components / McpToolCard (기본 / hover / disabled)

figma.showUI(__html__, { width: 320, height: 520 });

// ── 토큰 ──────────────────────────────────────────────
const T = {
  bgPage:     { r: 0.039, g: 0.059, b: 0.118 }, // #0A0F1E
  bgCard:     { r: 0.118, g: 0.161, b: 0.239 }, // #1E293B
  bgCardHover:{ r: 0.141, g: 0.196, b: 0.290 }, // #243351
  bgNeutral800:{ r: 0.118, g: 0.161, b: 0.239 },
  primary500: { r: 0.231, g: 0.510, b: 0.965 }, // #3B82F6
  neutral50:  { r: 0.973, g: 0.980, b: 0.988 }, // #F8FAFC
  neutral400: { r: 0.580, g: 0.635, b: 0.722 }, // #94A3B8
  neutral600: { r: 0.278, g: 0.337, b: 0.412 }, // #475569
  neutral200: { r: 0.886, g: 0.910, b: 0.941 }, // #E2E8F0
};

// ── 헬퍼: RGB → Figma color ───────────────────────────
function rgb(r, g, b) { return { r, g, b }; }

// ── 헬퍼: 사각형 ──────────────────────────────────────
function rect(x, y, w, h, color, opacity) {
  const node = figma.createRectangle();
  node.x = x; node.y = y;
  node.resize(w, h);
  const fill = { type: 'SOLID', color };
  if (opacity !== undefined) fill.opacity = opacity;
  node.fills = [fill];
  return node;
}

// ── 헬퍼: 텍스트 ──────────────────────────────────────
async function text(content, x, y, size, color, style) {
  const fontStyle = style || 'Regular';
  await figma.loadFontAsync({ family: 'Inter', style: fontStyle });
  const node = figma.createText();
  node.fontName   = { family: 'Inter', style: fontStyle };
  node.characters = content;
  node.fontSize   = size;
  node.fills      = [{ type: 'SOLID', color }];
  node.x = x; node.y = y;
  return node;
}

// ── 헬퍼: 프레임 ──────────────────────────────────────
function frame(name, x, y, w, h, bg, opacity) {
  const f = figma.createFrame();
  f.name = name;
  f.x = x; f.y = y;
  f.resize(w, h);
  const fill = { type: 'SOLID', color: bg };
  if (opacity !== undefined) fill.opacity = opacity;
  f.fills = [fill];
  f.cornerRadius = 12;
  return f;
}

// ── McpToolCard 단일 카드 빌더 ────────────────────────
async function buildCard(parentFrame, x, y, state) {
  // state: 'default' | 'hover' | 'disabled'
  const w = 260, h = 160;

  const cardFrame = figma.createFrame();
  cardFrame.name   = `McpToolCard / ${state}`;
  cardFrame.x      = x; cardFrame.y = y;
  cardFrame.resize(w, h);
  cardFrame.cornerRadius = 12;

  if (state === 'disabled') {
    cardFrame.fills  = [{ type: 'SOLID', color: T.bgPage }];
    cardFrame.strokes = [{ type: 'SOLID', color: T.neutral200, opacity: 0.20 }];
    cardFrame.strokeWeight = 2;
    cardFrame.dashPattern = [6, 4];
  } else {
    cardFrame.fills = [{ type: 'SOLID', color: T.bgCard }];
    cardFrame.strokes = [{
      type: 'SOLID',
      color: state === 'hover' ? T.primary500 : T.neutral200,
      opacity: state === 'hover' ? 0.50 : 0.10,
    }];
    cardFrame.strokeWeight = 1;
  }

  if (state === 'disabled') {
    // 플레이스홀더
    const plus = await text('+', x + 110, y + 40, 30, T.neutral600);
    parentFrame.appendChild(plus);
    const lbl  = await text('도구 추가 예정', x + 80, y + 90, 13, T.neutral600, 'Medium');
    parentFrame.appendChild(lbl);
  } else {
    // 아이콘 배경
    const iconBg = rect(x + 96, y + 20, 48, 48, T.bgNeutral800, 0.6);
    iconBg.cornerRadius = 12;
    parentFrame.appendChild(iconBg);
    // 아이콘
    const iconTxt = await text('🛠', x + 108, y + 28, 24, T.neutral50);
    parentFrame.appendChild(iconTxt);
    // 제목
    const title = await text('GitHub Commits', x + 50, y + 80, 16, T.neutral50, 'Semi Bold');
    parentFrame.appendChild(title);
    // 설명
    const desc = await text('커밋 히스토리 조회', x + 60, y + 106, 13, T.neutral400);
    parentFrame.appendChild(desc);

    if (state === 'hover') {
      // 그림자 효과 표현 (Figma: effects)
      cardFrame.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.5 },
        offset: { x: 0, y: 4 },
        radius: 6,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  }

  parentFrame.appendChild(cardFrame);
  return cardFrame;
}

// ── 1. Components / McpToolCard ───────────────────────
async function buildCardStatesFrame() {
  const f = frame('Components / McpToolCard', 0, 0, 960, 280, T.bgPage);
  figma.currentPage.appendChild(f);

  // 상태 라벨
  const states = ['default', 'hover', 'disabled'];
  const labels = ['기본 (Default)', 'hover', '추가 예정 (Disabled)'];
  for (let i = 0; i < states.length; i++) {
    const labelNode = await text(labels[i], 40 + i * 300, 20, 12, T.neutral400);
    f.appendChild(labelNode);
    await buildCard(f, 40 + i * 300, 50, states[i]);
  }

  return f;
}

// ── 2. Home / Desktop (1280px) ────────────────────────
async function buildHomeDesktop() {
  const f = figma.createFrame();
  f.name   = 'Home / Desktop (1280px)';
  f.x      = 0; f.y = 320;
  f.resize(1280, 900);
  f.fills  = [{ type: 'SOLID', color: T.bgPage }];
  figma.currentPage.appendChild(f);

  // Header
  const header = rect(0, 0, 1280, 64, T.bgCard);
  f.appendChild(header);
  const logoText = await text('MCP Tools', 24, 20, 20, T.primary500, 'Bold');
  f.appendChild(logoText);

  // Nav items
  const navItems = ['홈', '커밋 타임라인', '오늘 요약', '유저 레포'];
  let navX = 180;
  for (const item of navItems) {
    const navBg = rect(navX - 8, 14, item === '홈' ? 52 : item.length * 14, 36, T.bgPage, 0);
    f.appendChild(navBg);
    const isActive = item === '홈';
    const navNode = await text(item, navX, 24, 14, isActive ? T.neutral50 : T.neutral400, isActive ? 'Semi Bold' : 'Medium');
    f.appendChild(navNode);
    if (isActive) {
      const activeBg = rect(navX - 8, 14, 52, 36, T.primary500, 0.15);
      activeBg.cornerRadius = 8;
      f.appendChild(activeBg);
    }
    navX += 140;
  }

  // Content area
  const contentX = 40, contentY = 96;

  // 섹션 제목
  const sectionTitle = await text('My Tools', contentX, contentY, 24, T.neutral50, 'Bold');
  f.appendChild(sectionTitle);
  const sectionDesc = await text('사용 가능한 MCP 도구를 선택하세요', contentX, contentY + 36, 14, T.neutral400);
  f.appendChild(sectionDesc);

  // 카드 그리드 (3열)
  const tools = [
    { icon: '📊', title: 'GitHub Commits', desc: '커밋 히스토리 조회' },
    { icon: '📅', title: '오늘 요약', desc: 'Gemini AI 기반 일일 요약' },
    { icon: '📁', title: '유저 레포', desc: '저장소 목록 탐색' },
  ];

  const cardW = 368, cardH = 160, cardGap = 16;
  const gridY = contentY + 80;

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const cx = contentX + i * (cardW + cardGap);
    const cy = gridY;

    const cardBg = rect(cx, cy, cardW, cardH, T.bgCard);
    cardBg.cornerRadius = 12;
    f.appendChild(cardBg);

    const iconBg = rect(cx + cardW / 2 - 24, cy + 20, 48, 48, T.bgNeutral800, 0.6);
    iconBg.cornerRadius = 12;
    f.appendChild(iconBg);

    const iconTxt = await text(tool.icon, cx + cardW / 2 - 12, cy + 28, 24, T.neutral50);
    f.appendChild(iconTxt);

    const titleNode = await text(tool.title, cx + cardW / 2 - 50, cy + 82, 16, T.neutral50, 'Semi Bold');
    f.appendChild(titleNode);

    const descNode = await text(tool.desc, cx + cardW / 2 - 50, cy + 108, 13, T.neutral400);
    f.appendChild(descNode);
  }

  // 플레이스홀더 카드
  const phX = contentX + 3 * (cardW + cardGap);
  const phBg = rect(phX, gridY, cardW, cardH, T.bgPage, 0);
  phBg.cornerRadius = 12;
  phBg.strokes = [{ type: 'SOLID', color: T.neutral200, opacity: 0.20 }];
  phBg.strokeWeight = 2;
  phBg.dashPattern = [6, 4];
  f.appendChild(phBg);
  const phPlus = await text('+', phX + cardW / 2 - 8, gridY + 44, 30, T.neutral600);
  f.appendChild(phPlus);
  const phLabel = await text('도구 추가 예정', phX + cardW / 2 - 44, gridY + 90, 13, T.neutral600, 'Medium');
  f.appendChild(phLabel);

  return f;
}

// ── 3. Home / Mobile (375px) ──────────────────────────
async function buildHomeMobile() {
  const f = figma.createFrame();
  f.name   = 'Home / Mobile (375px)';
  f.x      = 1320; f.y = 320;
  f.resize(375, 700);
  f.fills  = [{ type: 'SOLID', color: T.bgPage }];
  figma.currentPage.appendChild(f);

  // Header
  const header = rect(0, 0, 375, 56, T.bgCard);
  f.appendChild(header);
  const logoText = await text('MCP Tools', 16, 16, 18, T.primary500, 'Bold');
  f.appendChild(logoText);

  // 햄버거 (간략 표현)
  for (let i = 0; i < 3; i++) {
    const bar = rect(330, 18 + i * 8, 24, 2, T.neutral400);
    f.appendChild(bar);
  }

  // 섹션 제목
  const sectionTitle = await text('My Tools', 16, 76, 20, T.neutral50, 'Bold');
  f.appendChild(sectionTitle);
  const sectionDesc = await text('사용 가능한 MCP 도구를 선택하세요', 16, 104, 13, T.neutral400);
  f.appendChild(sectionDesc);

  // 카드 (1열)
  const tools = [
    { icon: '📊', title: 'GitHub Commits', desc: '커밋 히스토리 조회' },
    { icon: '📅', title: '오늘 요약', desc: 'Gemini AI 기반 일일 요약' },
    { icon: '📁', title: '유저 레포', desc: '저장소 목록 탐색' },
  ];

  let cardY = 136;
  const cardW = 343;

  for (const tool of tools) {
    const cardBg = rect(16, cardY, cardW, 120, T.bgCard);
    cardBg.cornerRadius = 12;
    f.appendChild(cardBg);

    const iconBg = rect(24, cardY + 20, 40, 40, T.bgNeutral800, 0.6);
    iconBg.cornerRadius = 10;
    f.appendChild(iconBg);

    const iconTxt = await text(tool.icon, 32, cardY + 26, 20, T.neutral50);
    f.appendChild(iconTxt);

    const titleNode = await text(tool.title, 76, cardY + 22, 15, T.neutral50, 'Semi Bold');
    f.appendChild(titleNode);

    const descNode = await text(tool.desc, 76, cardY + 46, 12, T.neutral400);
    f.appendChild(descNode);

    cardY += 136;
  }

  // 플레이스홀더
  const phBg = rect(16, cardY, cardW, 80, T.bgPage, 0);
  phBg.cornerRadius = 12;
  phBg.strokes = [{ type: 'SOLID', color: T.neutral200, opacity: 0.20 }];
  phBg.strokeWeight = 2;
  phBg.dashPattern = [6, 4];
  f.appendChild(phBg);
  const phLabel = await text('+ 도구 추가 예정', 130, cardY + 28, 13, T.neutral600, 'Medium');
  f.appendChild(phLabel);

  return f;
}

// ── 메시지 핸들러 ─────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'build-all') {
      figma.notify('Day 2 프레임 생성 중...', { timeout: 2000 });
      await buildCardStatesFrame();
      await buildHomeDesktop();
      await buildHomeMobile();
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
      figma.notify('완료! 3개 프레임이 생성되었습니다.', { timeout: 3000 });
    } else if (msg.type === 'build-card-states') {
      await buildCardStatesFrame();
      figma.notify('McpToolCard 상태별 프레임 생성 완료');
    } else if (msg.type === 'build-home-desktop') {
      await buildHomeDesktop();
      figma.notify('Home Desktop 프레임 생성 완료');
    } else if (msg.type === 'build-home-mobile') {
      await buildHomeMobile();
      figma.notify('Home Mobile 프레임 생성 완료');
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (err) {
    figma.notify('오류: ' + err.message, { error: true });
  }
};
