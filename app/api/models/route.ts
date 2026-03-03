import { NextResponse } from 'next/server';
import { listAvailableModels } from '@/lib/gemini';

export async function GET(): Promise<NextResponse> {
  try {
    const models = await listAvailableModels();
    return NextResponse.json(models);
  } catch (e) {
    const message = e instanceof Error ? e.message : '모델 목록 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
