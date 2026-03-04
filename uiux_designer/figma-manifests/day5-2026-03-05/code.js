// MCP Dashboard - Sprint3 Day1 Responsive Frames
// 2026-03-05
// 생성 프레임:
//   1. Sprint3 / Header Mobile   — 햄버거 버튼 + 드롭다운 열린 상태
//   2. Sprint3 / Header Desktop  — 수평 Navigation 링크
//   3. Sprint3 / CommitSearchForm Mobile   — 세로 스택 폼
//   4. Sprint3 / CommitSearchForm Desktop  — 가로 인라인 폼

figma.showUI(__html__, { width: 340, height: 580 });

// ─── Design Tokens ────────────────────────────────────────────────────────────
const TOKENS = {
  bgPage:        { r: 0.039, g: 0.059, b: 0.118 },   // #0A0F1E
  bgCard:        { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
  border:        { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
  bgInput:       { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
  textPrimary:   { r: 0.973, g: 0.980, b: 0.988 },   // #F8FAFC
  textSecondary: { r: 0.580, g: 0.635, b: 0.722 },   // #94A3B8
  textMuted:     { r: 0.278, g: 0.337, b: 0.412 },   // #475569
  primary500:    { r: 0.231, g: 0.510, b: 0.965 },   // #3B82F6
  primary700:    { r: 0.114, g: 0.306, b: 0.847 },   // #1D4ED8
  primary300:    { r: 0.576, g: 0.773, b: 0.992 },   // #93C5FD
  neutral400:    { r: 0.580, g: 0.635, b: 0.722 },   // #94A3B8
  neutral600:    { r: 0.278, g: 0.337, b: 0.412 },   // #475569
  neutral800:    { r: 0.118, g: 0.161, b: 0.239 },   // #1E293B
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
    node.strokes = [{ type: 'SOLID', color: opts.stroke }];
    node.strokeWeight = opts.strokeWeight || 1;
  }
  return node;
}

async function makeText(content, x, y, size, color, style) {
  const fontStyle = style || 'Regular';
  await figma.loadFontAsync({ family: 'Inter', style: fontStyle });
  const node = figma.createText();
  node.fontName = { family: 'Inter', style: fontStyle };
  node.characters = content;
  node.fontSize = size;
  node.fills = [{ type: 'SOLID', color }];
  node.x = x; node.y = y;
  return node;
}

function appendAll(parent, nodes) {
  nodes.forEach(n => parent.appendChild(n));
}

// ─── Frame: Header Mobile ─────────────────────────────────────────────────────
// 360px wide, shows: logo | hamburger(☰) icon | avatar
// Below header: dropdown open with 4 nav links
async function buildHeaderMobile(index) {
  const x = (index % 2) * 560;
  const y = Math.floor(index / 2) * 520;

  const frame = figma.createFrame();
  frame.name = 'Sprint3 / Header Mobile';
  frame.x = x; frame.y = y;
  frame.resize(360, 480);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: TOKENS.bgPage }];
  figma.currentPage.appendChild(frame);

  // ── Header bar (h-16 = 64px) ──
  const headerBar = makeRect(0, 0, 360, 64, TOKENS.bgCard);
  frame.appendChild(headerBar);

  // Logo text
  const logo = await makeText('MCP Tools', 24, 20, 15, TOKENS.textPrimary, 'Bold');
  frame.appendChild(logo);

  // Hamburger icon ☰ (right side, 24×24 area)
  const hamburgerBg = makeRect(296, 20, 24, 24, TOKENS.bgCard);
  frame.appendChild(hamburgerBg);
  const hamburgerIcon = await makeText('☰', 296, 20, 18, TOKENS.neutral400, 'Regular');
  frame.appendChild(hamburgerIcon);

  // Avatar circle
  const avatar = makeRect(328, 20, 24, 24, TOKENS.primary500, { radius: 9999 });
  frame.appendChild(avatar);
  const avatarInitial = await makeText('U', 334, 22, 11, TOKENS.textPrimary, 'Bold');
  frame.appendChild(avatarInitial);

  // Label: hidden — md:hidden
  const hiddenLabel = await makeText('md:hidden', 24, 70, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(hiddenLabel);

  // ── Dropdown (fixed top-16, z-40) ──
  const dropdown = makeRect(0, 64, 360, 192, TOKENS.bgCard, {
    stroke: TOKENS.border,
    strokeWeight: 1,
  });
  frame.appendChild(dropdown);

  // Dropdown section label
  const dropLabel = await makeText('모바일 드롭다운 (fixed top-16 left-0 right-0 z-40)', 16, 68, 8, TOKENS.textMuted, 'Regular');
  frame.appendChild(dropLabel);

  const NAV_LINKS = [
    { label: 'Commits', active: true },
    { label: 'Daily Summary', active: false },
    { label: 'User Repos', active: false },
    { label: 'Home', active: false },
  ];

  NAV_LINKS.forEach((link, i) => {
    const rowY = 80 + i * 44;
    const rowBg = makeRect(0, rowY, 360, 44, link.active ? TOKENS.bgCard : TOKENS.bgPage, {
      opacity: link.active ? 1 : 0,
    });
    frame.appendChild(rowBg);

    const isActive = link.active;
    const color = isActive ? TOKENS.textPrimary : TOKENS.neutral400;
    // active indicator bar
    if (isActive) {
      const bar = makeRect(0, rowY, 3, 44, TOKENS.primary500);
      frame.appendChild(bar);
    }

    makeText(link.label, 24, rowY + 13, 14, color, isActive ? 'Medium' : 'Regular')
      .then(t => frame.appendChild(t));

    // class annotation
    const cls = isActive
      ? 'block px-6 py-3 text-sm text-neutral-50 font-medium'
      : 'block px-6 py-3 text-sm text-neutral-400 hover:text-neutral-50';
    makeText(cls, 24, rowY + 28, 7, TOKENS.textMuted, 'Regular')
      .then(t => frame.appendChild(t));
  });

  // ── Spec annotations ──
  const specY = 268;
  const annotations = [
    '● Navigation: hidden md:flex (tablet+ 에서 표시)',
    '● 햄버거: md:hidden  |  색상: text-neutral-400 hover:text-neutral-50',
    '● 드롭다운: fixed top-16 left-0 right-0 z-40',
    '● 드롭다운 배경: bg-surface-card border-b border-neutral-800',
  ];
  for (let i = 0; i < annotations.length; i++) {
    const t = await makeText(annotations[i], 16, specY + i * 16, 9, TOKENS.textSecondary, 'Regular');
    frame.appendChild(t);
  }

  return frame;
}

// ─── Frame: Header Desktop ────────────────────────────────────────────────────
// 1440px wide, shows: logo | nav links (flex) | avatar
async function buildHeaderDesktop(index) {
  const x = (index % 2) * 1480;
  const y = Math.floor(index / 2) * 520;

  const frame = figma.createFrame();
  frame.name = 'Sprint3 / Header Desktop';
  frame.x = x; frame.y = y;
  frame.resize(1440, 200);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: TOKENS.bgPage }];
  figma.currentPage.appendChild(frame);

  // Header bar
  const headerBar = makeRect(0, 0, 1440, 64, TOKENS.bgCard);
  frame.appendChild(headerBar);

  const logo = await makeText('MCP Tools', 24, 20, 15, TOKENS.textPrimary, 'Bold');
  frame.appendChild(logo);

  // Nav links (flex items-center gap-2)
  const NAV_LINKS = ['Commits', 'Daily Summary', 'User Repos', 'Home'];
  let linkX = 560;
  for (let i = 0; i < NAV_LINKS.length; i++) {
    const isActive = i === 0;
    const color = isActive ? TOKENS.textPrimary : TOKENS.neutral400;
    const pill = makeRect(linkX - 8, 16, 120, 32, isActive ? TOKENS.neutral800 : TOKENS.bgCard, { radius: 8 });
    frame.appendChild(pill);
    const t = await makeText(NAV_LINKS[i], linkX, 24, 13, color, isActive ? 'Medium' : 'Regular');
    frame.appendChild(t);
    linkX += 140;
  }

  // Avatar
  const avatar = makeRect(1392, 20, 24, 24, TOKENS.primary500, { radius: 9999 });
  frame.appendChild(avatar);
  const avatarInitial = await makeText('U', 1398, 22, 11, TOKENS.textPrimary, 'Bold');
  frame.appendChild(avatarInitial);

  // Spec annotation
  const ann1 = await makeText('● Navigation: flex items-center gap-2 (md:flex — tablet+ 에서 표시)', 24, 80, 10, TOKENS.textSecondary, 'Regular');
  const ann2 = await makeText('● 햄버거 버튼: md:hidden (desktop 에서 숨김)', 24, 96, 10, TOKENS.textSecondary, 'Regular');
  const ann3 = await makeText('● layout main: px-4 md:px-6', 24, 112, 10, TOKENS.textSecondary, 'Regular');
  appendAll(frame, [ann1, ann2, ann3]);

  return frame;
}

// ─── Frame: CommitSearchForm Mobile ──────────────────────────────────────────
// flex-col gap-2, each input w-full
async function buildCommitFormMobile(index) {
  const x = (index % 2) * 560;
  const y = Math.floor(index / 2) * 520;

  const frame = figma.createFrame();
  frame.name = 'Sprint3 / CommitSearchForm Mobile';
  frame.x = x; frame.y = y;
  frame.resize(360, 340);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: TOKENS.bgPage }];
  figma.currentPage.appendChild(frame);

  // Title
  const title = await makeText('CommitSearchForm — Mobile', 20, 20, 13, TOKENS.textPrimary, 'Bold');
  frame.appendChild(title);
  const sub = await makeText('flex-col gap-2  |  각 요소 w-full', 20, 38, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(sub);

  const FIELDS = [
    { label: 'repo (flex-1 → w-full)', placeholder: 'owner/repo' },
    { label: 'branch (w-32 → w-full)', placeholder: 'main' },
    { label: 'count (w-28 → w-full)', placeholder: '20' },
  ];

  let fieldY = 60;
  for (const field of FIELDS) {
    const inputBg = makeRect(20, fieldY, 320, 38, TOKENS.bgInput, { radius: 8, stroke: TOKENS.border });
    frame.appendChild(inputBg);
    const label = await makeText(field.label, 20, fieldY - 13, 9, TOKENS.textMuted, 'Regular');
    frame.appendChild(label);
    const ph = await makeText(field.placeholder, 32, fieldY + 11, 13, TOKENS.neutral600, 'Regular');
    frame.appendChild(ph);
    fieldY += 58;
  }

  // Button w-full
  const btnBg = makeRect(20, fieldY, 320, 40, TOKENS.primary500, { radius: 8 });
  frame.appendChild(btnBg);
  const btnLabel = await makeText('조회', 20 + 320 / 2 - 14, fieldY + 12, 14, TOKENS.textPrimary, 'Medium');
  frame.appendChild(btnLabel);
  const btnClass = await makeText('w-full  (mobile)', 20, fieldY + 48, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(btnClass);

  return frame;
}

// ─── Frame: CommitSearchForm Desktop ─────────────────────────────────────────
// sm:flex-row, original widths: flex-1 / w-32 / w-28
async function buildCommitFormDesktop(index) {
  const x = (index % 2) * 1480;
  const y = Math.floor(index / 2) * 520;

  const frame = figma.createFrame();
  frame.name = 'Sprint3 / CommitSearchForm Desktop';
  frame.x = x; frame.y = y;
  frame.resize(800, 160);
  frame.cornerRadius = 16;
  frame.fills = [{ type: 'SOLID', color: TOKENS.bgPage }];
  figma.currentPage.appendChild(frame);

  // Title
  const title = await makeText('CommitSearchForm — Desktop (sm:flex-row)', 20, 20, 13, TOKENS.textPrimary, 'Bold');
  frame.appendChild(title);
  const sub = await makeText('sm:flex-row gap-2  |  flex-1 / w-32 / w-28 / w-auto', 20, 38, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(sub);

  // repo input (flex-1 → ~380px approx)
  const repoW = 380;
  const repoInput = makeRect(20, 68, repoW, 38, TOKENS.bgInput, { radius: 8, stroke: TOKENS.border });
  frame.appendChild(repoInput);
  const repoLabel = await makeText('repo  flex-1', 20, 56, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(repoLabel);
  const repoPh = await makeText('owner/repo', 32, 79, 13, TOKENS.neutral600, 'Regular');
  frame.appendChild(repoPh);

  // branch input (w-32 = 128px)
  const branchX = 20 + repoW + 8;
  const branchInput = makeRect(branchX, 68, 128, 38, TOKENS.bgInput, { radius: 8, stroke: TOKENS.border });
  frame.appendChild(branchInput);
  const branchLabel = await makeText('branch  w-32', branchX, 56, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(branchLabel);
  const branchPh = await makeText('main', branchX + 12, 79, 13, TOKENS.neutral600, 'Regular');
  frame.appendChild(branchPh);

  // count input (w-28 = 112px)
  const countX = branchX + 128 + 8;
  const countInput = makeRect(countX, 68, 112, 38, TOKENS.bgInput, { radius: 8, stroke: TOKENS.border });
  frame.appendChild(countInput);
  const countLabel = await makeText('count  w-28', countX, 56, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(countLabel);
  const countPh = await makeText('20', countX + 12, 79, 13, TOKENS.neutral600, 'Regular');
  frame.appendChild(countPh);

  // button (w-auto)
  const btnX = countX + 112 + 8;
  const btnW = 72;
  const btnBg = makeRect(btnX, 68, btnW, 38, TOKENS.primary500, { radius: 8 });
  frame.appendChild(btnBg);
  const btnLabel = await makeText('조회', btnX + btnW / 2 - 12, 79, 13, TOKENS.textPrimary, 'Medium');
  frame.appendChild(btnLabel);
  const btnClassLabel = await makeText('w-auto', btnX, 56, 9, TOKENS.textMuted, 'Regular');
  frame.appendChild(btnClassLabel);

  // Spec row annotation
  const ann = await makeText(
    '● form: flex flex-col gap-2 sm:flex-row  |  tablet+ 에서 가로 복귀',
    20, 120, 10, TOKENS.textSecondary, 'Regular'
  );
  frame.appendChild(ann);

  return frame;
}

// ─── Build All ────────────────────────────────────────────────────────────────
async function buildAll() {
  const built = [];

  // Row 0: Mobile frames (narrow, 360px wide)
  built.push(await buildHeaderMobile(0));       // x=0,    y=0
  built.push(await buildCommitFormMobile(1));   // x=560,  y=0

  // Row 1: Desktop frames (wide)
  built.push(await buildHeaderDesktop(0));      // x=0,    y=520
  built.push(await buildCommitFormDesktop(1));  // x=1480, y=520

  figma.viewport.scrollAndZoomIntoView(built);
}

// ─── Message Handler ──────────────────────────────────────────────────────────
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'build-all':
        figma.notify('Day5 반응형 프레임 생성 중...', { timeout: 2000 });
        await buildAll();
        figma.notify('완료! 4개 프레임이 생성되었습니다.', { timeout: 3000 });
        break;
      case 'build-header-mobile':
        await buildHeaderMobile(0);
        figma.notify('Header Mobile 프레임 생성 완료');
        break;
      case 'build-header-desktop':
        await buildHeaderDesktop(0);
        figma.notify('Header Desktop 프레임 생성 완료');
        break;
      case 'build-form-mobile':
        await buildCommitFormMobile(0);
        figma.notify('CommitSearchForm Mobile 프레임 생성 완료');
        break;
      case 'build-form-desktop':
        await buildCommitFormDesktop(0);
        figma.notify('CommitSearchForm Desktop 프레임 생성 완료');
        break;
      case 'close':
        figma.closePlugin();
        break;
    }
  } catch (err) {
    figma.notify('오류: ' + err.message, { error: true });
  }
};
