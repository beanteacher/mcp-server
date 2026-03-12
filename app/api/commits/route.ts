import { NextRequest, NextResponse } from 'next/server';
import { getCommits, getAllCommits } from '@/feature/github/service';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const repo = searchParams.get('repo') ?? '';
  const author = searchParams.get('author') ?? undefined;
  const branch = searchParams.get('branch') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? 30);
  const [owner, repoName] = repo.split('/');

  if (!owner || !repoName) {
    return NextResponse.json({ error: '유효하지 않은 저장소 형식입니다.' }, { status: 400 });
  }

  try {
    const commits =
      limit === 0
        ? await getAllCommits(owner, repoName, author, branch)
        : await getCommits(owner, repoName, limit, author, branch);
    return NextResponse.json(commits);
  } catch (e) {
    const message = e instanceof Error ? e.message : '커밋 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
