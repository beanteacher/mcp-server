import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBranches } from './get-branches.service';
import type { GitHubDto } from './dto';

function makeBranches(count: number, prefix = 'branch'): GitHubDto.Branch[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `${prefix}-${i}`,
    protected: i === 0,
  }));
}

describe('getBranches', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns branches from a single page when fewer than 100 results', async () => {
    const branches = makeBranches(3);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(branches),
    });

    const result = await getBranches('owner', 'repo');
    expect(result).toHaveLength(3);
    expect(result).toEqual(branches);
  });

  it('calls the correct GitHub branches API URL', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getBranches('myorg', 'myrepo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://api.github.com/repos/myorg/myrepo/branches');
  });

  it('sends per_page=100 in each request', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getBranches('owner', 'repo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('per_page=100');
  });

  it('accumulates branches across two pages', async () => {
    const page1 = makeBranches(100, 'page1');
    const page2 = makeBranches(15, 'page2');

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page1) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page2) });

    const result = await getBranches('owner', 'repo');
    expect(result).toHaveLength(115);
    expect(result[0].name).toBe('page1-0');
    expect(result[100].name).toBe('page2-0');
  });

  it('increments page number across paginated requests', async () => {
    const fullPage = makeBranches(100);
    const lastPage = makeBranches(1, 'last');

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fullPage) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(lastPage) });

    await getBranches('owner', 'repo');

    const call1Url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const call2Url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][0] as string;
    expect(call1Url).toContain('page=1');
    expect(call2Url).toContain('page=2');
  });

  it('stops pagination when a full page of exactly 100 is followed by an empty page', async () => {
    const fullPage = makeBranches(100);
    const emptyPage: GitHubDto.Branch[] = [];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fullPage) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(emptyPage) });

    const result = await getBranches('owner', 'repo');
    expect(result).toHaveLength(100);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns empty array when first page is empty', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await getBranches('owner', 'repo');
    expect(result).toHaveLength(0);
  });

  it('throws with API error message when response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not Found' }),
    });

    await expect(getBranches('owner', 'repo')).rejects.toThrow('Not Found');
  });

  it('throws fallback error when non-ok body has no message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
    });

    await expect(getBranches('owner', 'repo')).rejects.toThrow('GitHub API 오류: 403');
  });
});
