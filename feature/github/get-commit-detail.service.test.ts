import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCommitDetail } from './get-commit-detail.service';
import type { GitHubDto } from './dto';

function makeCommitDetail(sha: string): GitHubDto.CommitDetail {
  return {
    sha,
    commit: { message: 'feat: detail', author: { name: 'dev', date: '2024-01-15T10:00:00Z' } },
    html_url: `https://github.com/owner/repo/commit/${sha}`,
    files: [
      { filename: 'src/index.ts', status: 'modified', additions: 5, deletions: 2 },
    ],
    stats: { additions: 5, deletions: 2, total: 7 },
  };
}

describe('getCommitDetail', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns commit detail on successful response', async () => {
    const detail = makeCommitDetail('abc1234def5');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(detail),
    });

    const result = await getCommitDetail('owner', 'repo', 'abc1234def5');
    expect(result).toEqual(detail);
  });

  it('calls the correct GitHub commit detail URL with sha', async () => {
    const detail = makeCommitDetail('deadbeef1234567');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(detail),
    });

    await getCommitDetail('myorg', 'myrepo', 'deadbeef1234567');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toBe(
      'https://api.github.com/repos/myorg/myrepo/commits/deadbeef1234567',
    );
  });

  it('returns the files array from the detail response', async () => {
    const detail = makeCommitDetail('abc1234def5');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(detail),
    });

    const result = await getCommitDetail('owner', 'repo', 'abc1234def5');
    expect(result.files).toHaveLength(1);
    expect(result.files[0].filename).toBe('src/index.ts');
  });

  it('returns the stats from the detail response', async () => {
    const detail = makeCommitDetail('abc1234def5');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(detail),
    });

    const result = await getCommitDetail('owner', 'repo', 'abc1234def5');
    expect(result.stats.additions).toBe(5);
    expect(result.stats.deletions).toBe(2);
    expect(result.stats.total).toBe(7);
  });

  it('throws with API error message when response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not Found' }),
    });

    await expect(getCommitDetail('owner', 'repo', 'badhash')).rejects.toThrow('Not Found');
  });

  it('throws fallback error when non-ok response body has no message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({}),
    });

    await expect(getCommitDetail('owner', 'repo', 'badhash')).rejects.toThrow(
      'GitHub API 오류: 422',
    );
  });

  it('throws fallback error when response json parsing fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(getCommitDetail('owner', 'repo', 'badhash')).rejects.toThrow(
      'GitHub API 오류: 500',
    );
  });
});
