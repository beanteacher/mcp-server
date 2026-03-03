import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CommitDetail } from './github';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

// generateContent를 지원하는 사용 가능한 모델 목록 반환
export async function listAvailableModels(): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  if (!res.ok) {
    throw new Error(`모델 목록 조회 실패: ${res.status}`);
  }
  const data = await res.json() as {
    models: { name: string; supportedGenerationMethods: string[] }[];
  };
  return data.models
    .filter((m) => m.supportedGenerationMethods.includes('generateContent'))
    .map((m) => m.name); // 예: "models/gemini-1.5-flash-latest"
}

export async function analyzeDailyWork(
  repo: string,
  commits: CommitDetail[],
  modelId = 'models/gemini-2.5-flash'
): Promise<string> {
  if (commits.length === 0) {
    return '오늘 커밋 내역이 없습니다.';
  }

  const commitSummaries = commits.map((c) => {
    const message = c.commit.message.split('\n')[0];
    const date = c.commit.author?.date ?? '';
    const files = c.files
      .map((f) => {
        const patch = f.patch ? f.patch.slice(0, 3000) : '(바이너리 또는 너무 큰 파일)';
        return `  [${f.status}] ${f.filename} (+${f.additions}/-${f.deletions})\n${patch}`;
      })
      .join('\n\n');
    return `### 커밋: ${message} (${date})\n${files}`;
  });

  const prompt = `
당신은 개발자의 하루 작업을 분석해 깔끔한 정리본을 제공하는 어시스턴트입니다.

저장소: ${repo}
분석 대상: 오늘 날짜 커밋 ${commits.length}건

아래는 오늘 작업한 커밋과 실제 변경 코드(diff)입니다:

${commitSummaries.join('\n\n---\n\n')}

위 내용을 바탕으로 아래 형식으로 한국어 정리본을 작성해주세요:

## 📅 오늘의 작업 요약

### 🎯 핵심 작업
- (오늘 가장 중요한 작업 2~4줄로 요약)

### 📂 변경된 주요 파일 및 내용
- (파일별로 무엇을 왜 바꿨는지 1~2줄씩)

### 🔧 기술적 변경사항
- (새로 추가된 로직, 수정된 버그, 리팩토링 등)

### 📝 커밋 목록
- (커밋 메시지와 간단한 설명)

가능한 한 구체적으로, 개발자가 내일 이어서 작업하거나 팀원에게 공유할 수 있는 수준으로 작성해주세요.
`.trim();

  const model = genAI.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
