import { NextRequest, NextResponse } from 'next/server';
import { getBranches } from '@/services/github/github.service';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const repo = searchParams.get('repo') ?? '';
  const [owner, repoName] = repo.split('/');

  if (!owner || !repoName) {
    return NextResponse.json({ error: '유효하지 않은 저장소 형식입니다.' }, { status: 400 });
  }

  try {
    const branches = await getBranches(owner, repoName);
    return NextResponse.json(branches);
  } catch (e) {
    const message = e instanceof Error ? e.message : '브랜치 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
