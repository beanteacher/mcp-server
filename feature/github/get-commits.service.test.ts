import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCommits, formatCommits } from './get-commits.service';
import type { GitHubDto } from './dto';

const mockCommit = (sha: string, message: string, date: string): GitHubDto.Commit => ({
  sha,
  commit: { message, author: { name: 'dev', date } },
  html_url: `https://github.com/owner/repo/commit/${sha}`,
});

describe('formatCommits', () => {
  it('formats a single commit with short sha, date, and first line of message', () => {
    const commit = mockCommit('abc1234def5', 'feat: add login\n\nbody text', '2024-01-15T10:00:00Z');
    const result = formatCommits([commit]);
    expect(result).toBe('abc1234 │ 2024-01-15 │ feat: add login');
  });

  it('uses only the first line of a multi-line commit message', () => {
    const commit = mockCommit('aaaaaaaaa', 'fix: bug\n\ndetailed description', '2024-02-01T00:00:00Z');
    const result = formatCommits([commit]);
    expect(result).toContain('fix: bug');
    expect(result).not.toContain('detailed description');
  });

  it('joins multiple commits with newlines', () => {
    const commits = [
      mockCommit('aaaaaaa11', 'first commit', '2024-01-01T00:00:00Z'),
      mockCommit('bbbbbbb22', 'second commit', '2024-01-02T00:00:00Z'),
    ];
    const result = formatCommits(commits);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
  });

  it('returns empty string for empty array', () => {
    expect(formatCommits([])).toBe('');
  });

  it('handles null author gracefully', () => {
    const commit: GitHubDto.Commit = {
      sha: 'abc1234def5',
      commit: { message: 'no author', author: null },
      html_url: '',
    };
    const result = formatCommits([commit]);
    expect(result).toContain('no author');
  });
});

describe('getCommits', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns an array of commits on successful response', async () => {
    const commits = [mockCommit('abc1234def5', 'feat: thing', '2024-01-01T00:00:00Z')];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(commits),
    });

    const result = await getCommits('owner', 'repo');
    expect(result).toEqual(commits);
  });

  it('calls the correct GitHub API URL', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getCommits('myorg', 'myrepo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://api.github.com/repos/myorg/myrepo/commits');
  });

  it('includes per_page parameter capped at 100', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getCommits('owner', 'repo', 200);
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('per_page=100');
  });

  it('includes author parameter when provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getCommits('owner', 'repo', 30, 'someuser');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('author=someuser');
  });

  it('includes sha parameter when branch is provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getCommits('owner', 'repo', 30, undefined, 'main');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('sha=main');
  });

  it('throws an error with API message when response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not Found' }),
    });

    await expect(getCommits('owner', 'repo')).rejects.toThrow('Not Found');
  });

  it('throws a fallback error message when response body has no message field', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}),
    });

    await expect(getCommits('owner', 'repo')).rejects.toThrow('GitHub API 오류: 503');
  });

  it('throws a fallback error when response json parsing fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('invalid json')),
    });

    await expect(getCommits('owner', 'repo')).rejects.toThrow('GitHub API 오류: 500');
  });
});
