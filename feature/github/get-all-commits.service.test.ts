import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllCommits } from './get-all-commits.service';
import type { GitHubDto } from './dto';

function makeCommits(count: number, prefix = 'sha'): GitHubDto.Commit[] {
  return Array.from({ length: count }, (_, i) => ({
    sha: `${prefix}${String(i).padStart(7, '0')}`,
    commit: { message: `commit ${i}`, author: { name: 'dev', date: '2024-01-01T00:00:00Z' } },
    html_url: '',
  }));
}

describe('getAllCommits', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns all commits from a single page when fewer than 100 results', async () => {
    const commits = makeCommits(3);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(commits),
    });

    const result = await getAllCommits('owner', 'repo');
    expect(result).toHaveLength(3);
    expect(result).toEqual(commits);
  });

  it('accumulates commits across multiple pages until page returns fewer than 100', async () => {
    const page1 = makeCommits(100, 'page1sha');
    const page2 = makeCommits(42, 'page2sha');

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page1) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page2) });

    const result = await getAllCommits('owner', 'repo');
    expect(result).toHaveLength(142);
    expect(result[0].sha).toBe('page1sha0000000');
    expect(result[100].sha).toBe('page2sha0000000');
  });

  it('fetches exactly three pages when first two pages are full', async () => {
    const fullPage = makeCommits(100);
    const lastPage = makeCommits(1, 'last');

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fullPage) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fullPage) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(lastPage) });

    const result = await getAllCommits('owner', 'repo');
    expect(result).toHaveLength(201);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('returns empty array when first page is empty', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await getAllCommits('owner', 'repo');
    expect(result).toHaveLength(0);
  });

  it('sends per_page=100 in each request', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getAllCommits('owner', 'repo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('per_page=100');
  });

  it('sends page number incrementing across pages', async () => {
    const fullPage = makeCommits(100);
    const lastPage = makeCommits(1);

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fullPage) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(lastPage) });

    await getAllCommits('owner', 'repo');

    const call1Url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const call2Url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][0] as string;
    expect(call1Url).toContain('page=1');
    expect(call2Url).toContain('page=2');
  });

  it('includes author parameter in requests when provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getAllCommits('owner', 'repo', 'octocat');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('author=octocat');
  });

  it('includes sha parameter in requests when branch is provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getAllCommits('owner', 'repo', undefined, 'develop');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('sha=develop');
  });

  it('throws with API error message on non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Bad credentials' }),
    });

    await expect(getAllCommits('owner', 'repo')).rejects.toThrow('Bad credentials');
  });

  it('throws fallback error when error response has no message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
    });

    await expect(getAllCommits('owner', 'repo')).rejects.toThrow('GitHub API 오류: 403');
  });
});
