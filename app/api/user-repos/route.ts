import { NextRequest, NextResponse } from 'next/server';
import { getUserRepos } from '@/feature/github/service';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const username = searchParams.get('username') ?? '';

  if (!username) {
    return NextResponse.json({ error: '유저명을 입력해주세요.' }, { status: 400 });
  }

  try {
    const repos = await getUserRepos(username);
    return NextResponse.json(repos);
  } catch (e) {
    const message = e instanceof Error ? e.message : '레포지토리 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
