import { NextRequest, NextResponse } from 'next/server';
import { getTodayCommits, getCommitDetail } from '@/feature/github/service';
import { analyzeDailyWork } from '@/lib/gemini';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const repo = searchParams.get('repo') ?? '';
  const model = searchParams.get('model') ?? 'models/gemini-2.5-flash';
  const branch = searchParams.get('branch') ?? undefined;
  const [owner, repoName] = repo.split('/');

  if (!owner || !repoName) {
    return NextResponse.json({ error: '유효하지 않은 저장소 형식입니다.' }, { status: 400 });
  }

  try {
    const todayCommits = await getTodayCommits(owner, repoName, branch);

    if (todayCommits.length === 0) {
      return NextResponse.json({ summary: '오늘 커밋 내역이 없습니다.', commitCount: 0 });
    }

    const details = await Promise.all(
      todayCommits.slice(0, 10).map((c) => getCommitDetail(owner, repoName, c.sha)),
    );
    const summary = await analyzeDailyWork(repo, details, model);

    return NextResponse.json({ summary, commitCount: todayCommits.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : '분석 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
