// MCP Dashboard - Sprint2 Day4 Auto Frames
// 2026-03-05
// 생성 프레임:
//   1. Sprint2 / Commits Timeline
//   2. Sprint2 / Daily Summary
//   3. Sprint2 / User Repos

figma.showUI(__html__, { width: 340, height: 540 });

const TOKENS = {
  bgPage: { r: 0.039, g: 0.059, b: 0.118 },
  bgCard: { r: 0.118, g: 0.161, b: 0.239 },
  border: { r: 0.118, g: 0.161, b: 0.239 },
  textPrimary: { r: 0.973, g: 0.98, b: 0.988 },
  textSecondary: { r: 0.58, g: 0.635, b: 0.722 },
  textMuted: { r: 0.278, g: 0.337, b: 0.412 },
  primary500: { r: 0.231, g: 0.51, b: 0.965 },
  primary300: { r: 0.576, g: 0.773, b: 0.992 },
  warning: { r: 0.961, g: 0.624, b: 0.043 },
};

const FRAMES = [
  {
    name: 'Sprint2 / Commits Timeline',
    subtitle: 'CommitCard + DateGroupHeader + Empty/Error 상태',
    components: ['PageHeader', 'SearchForm', 'DateGroupHeader', 'CommitCard', 'EmptyState', 'ErrorState'],
  },
  {
    name: 'Sprint2 / Daily Summary',
    subtitle: 'ModelBadge + AnalysisResultCard + CommitCountBadge',
    components: ['PageHeader', 'ModelBadge', 'SearchForm', 'AnalysisResultCard', 'CommitCountBadge', 'EmptyState', 'ErrorState'],
  },
  {
    name: 'Sprint2 / User Repos',
    subtitle: 'RepoCard + LanguageBadge + StarDisplay',
    components: ['PageHeader', 'SearchForm', 'RepoCard', 'LanguageBadge', 'StarDisplay', 'EmptyState', 'ErrorState'],
  },
];

function rect(x, y, w, h, color, opacity) {
  const node = figma.createRectangle();
  node.x = x;
  node.y = y;
  node.resize(w, h);
  const fill = { type: 'SOLID', color };
  if (opacity !== undefined) fill.opacity = opacity;
  node.fills = [fill];
  return node;
}

async function text(content, x, y, size, color, style) {
  const fontStyle = style || 'Regular';
  await figma.loadFontAsync({ family: 'Inter', style: fontStyle });
  const node = figma.createText();
  node.fontName = { family: 'Inter', style: fontStyle };
  node.characters = content;
  node.fontSize = size;
  node.fills = [{ type: 'SOLID', color }];
  node.x = x;
  node.y = y;
  return node;
}

async function buildFrame(spec, index) {
  const x = (index % 2) * 1480;
  const y = Math.floor(index / 2) * 940;

  const frame = figma.createFrame();
  frame.name = spec.name;
  frame.x = x;
  frame.y = y;
  frame.resize(1440, 900);
  frame.cornerRadius = 12;
  frame.fills = [{ type: 'SOLID', color: TOKENS.bgPage }];
  figma.currentPage.appendChild(frame);

  const header = rect(40, 40, 1360, 72, TOKENS.bgCard);
  header.cornerRadius = 12;
  frame.appendChild(header);

  const title = await text(spec.name, 64, 58, 20, TOKENS.textPrimary, 'Bold');
  frame.appendChild(title);

  const subtitle = await text(spec.subtitle, 64, 86, 12, TOKENS.textSecondary, 'Regular');
  frame.appendChild(subtitle);

  const container = rect(40, 136, 1360, 704, TOKENS.bgCard);
  container.cornerRadius = 14;
  container.strokes = [{ type: 'SOLID', color: TOKENS.border }];
  container.strokeWeight = 1;
  frame.appendChild(container);

  const componentsTitle = await text('Components', 64, 168, 11, TOKENS.textMuted, 'Semi Bold');
  frame.appendChild(componentsTitle);

  let yOffset = 198;
  for (let i = 0; i < spec.components.length; i++) {
    const chip = rect(64, yOffset, 420, 34, TOKENS.bgPage, 0.85);
    chip.cornerRadius = 8;
    frame.appendChild(chip);

    const dot = rect(76, yOffset + 11, 12, 12, i % 2 === 0 ? TOKENS.primary500 : TOKENS.warning);
    dot.cornerRadius = 9999;
    frame.appendChild(dot);

    const name = await text(spec.components[i], 98, yOffset + 9, 13, TOKENS.textPrimary, 'Medium');
    frame.appendChild(name);

    yOffset += 44;
  }

  return frame;
}

async function buildAll() {
  const built = [];
  for (let i = 0; i < FRAMES.length; i++) {
    const frame = await buildFrame(FRAMES[i], i);
    built.push(frame);
  }
  figma.viewport.scrollAndZoomIntoView(built);
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'build-all') {
      figma.notify('Day4 프레임 생성 중...', { timeout: 2000 });
      await buildAll();
      figma.notify('완료! 3개 프레임이 생성되었습니다.', { timeout: 3000 });
    } else if (msg.type === 'build-commits') {
      await buildFrame(FRAMES[0], 0);
      figma.notify('Commits Timeline 프레임 생성 완료');
    } else if (msg.type === 'build-daily-summary') {
      await buildFrame(FRAMES[1], 1);
      figma.notify('Daily Summary 프레임 생성 완료');
    } else if (msg.type === 'build-user-repos') {
      await buildFrame(FRAMES[2], 2);
      figma.notify('User Repos 프레임 생성 완료');
    } else if (msg.type === 'close') {
      figma.closePlugin();
    }
  } catch (err) {
    figma.notify('오류: ' + err.message, { error: true });
  }
};
