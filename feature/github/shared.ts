export function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export function parseErrorMessage(body: unknown, status: number): string {
  if (body !== null && typeof body === 'object' && 'message' in body) {
    const msg = (body as Record<string, unknown>)['message'];
    if (typeof msg === 'string') return msg;
  }
  return `GitHub API 오류: ${status}`;
}
