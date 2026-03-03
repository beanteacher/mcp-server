export interface McpTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

export const MCP_TOOLS: McpTool[] = [
  {
    id: 'commit-timeline',
    title: 'Git 커밋 타임라인',
    description: 'GitHub 저장소의 커밋 내역을 타임라인으로 시각화',
    icon: '📋',
    path: '/commits',
  },
  {
    id: 'daily-summary',
    title: '오늘의 작업 정리',
    description: '오늘 커밋된 변경사항을 AI가 분석해 정리본 제공',
    icon: '🤖',
    path: '/daily-summary',
  },
  {
    id: 'user-repos',
    title: '유저 레포지토리 목록',
    description: 'GitHub 유저의 public 레포지토리를 한눈에 조회',
    icon: '📦',
    path: '/user-repos',
  },
  // 새 도구 추가 시 여기에만 항목 추가
];
