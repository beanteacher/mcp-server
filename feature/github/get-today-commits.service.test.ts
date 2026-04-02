import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayCommits } from './get-today-commits.service';
import type { GitHubDto } from './dto';

function makeCommit(sha: string): GitHubDto.Commit {
  return {
    sha,
    commit: { message: 'test commit', author: { name: 'dev', date: '2024-01-15T01:00:00Z' } },
    html_url: '',
  };
}

describe('getTodayCommits', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns commits from a successful response', async () => {
    const commits = [makeCommit('abc1234'), makeCommit('def5678')];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(commits),
    });

    const result = await getTodayCommits('owner', 'repo');
    expect(result).toEqual(commits);
  });

  it('calls the correct GitHub commits API URL', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getTodayCommits('myorg', 'myrepo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://api.github.com/repos/myorg/myrepo/commits');
  });

  it('sends per_page=50 in the request', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getTodayCommits('owner', 'repo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('per_page=50');
  });

  it('sends a since parameter that is a valid ISO 8601 timestamp', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getTodayCommits('owner', 'repo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const sinceMatch = calledUrl.match(/since=([^&]+)/);
    expect(sinceMatch).not.toBeNull();
    const since = decodeURIComponent(sinceMatch![1]);
    expect(() => new Date(since)).not.toThrow();
    expect(new Date(since).toString()).not.toBe('Invalid Date');
  });

  it('sends a since parameter corresponding to KST midnight (9h behind local midnight)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const beforeCall = new Date();
    await getTodayCommits('owner', 'repo');

    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const sinceMatch = calledUrl.match(/since=([^&]+)/);
    const since = new Date(decodeURIComponent(sinceMatch![1]));

    // since should be today's KST midnight: local midnight shifted back 9 hours
    const localMidnight = new Date(
      beforeCall.getFullYear(),
      beforeCall.getMonth(),
      beforeCall.getDate(),
      0, 0, 0,
    );
    const expectedSince = new Date(localMidnight.getTime() - 9 * 60 * 60 * 1000);

    expect(since.getTime()).toBe(expectedSince.getTime());
  });

  it('includes sha parameter when branch is provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getTodayCommits('owner', 'repo', 'feature-branch');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('sha=feature-branch');
  });

  it('does not include sha parameter when branch is not provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getTodayCommits('owner', 'repo');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('sha=');
  });

  it('throws with API error message when response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Repository not found' }),
    });

    await expect(getTodayCommits('owner', 'repo')).rejects.toThrow('Repository not found');
  });

  it('throws fallback error when non-ok response body has no message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
    });

    await expect(getTodayCommits('owner', 'repo')).rejects.toThrow('GitHub API 오류: 403');
  });
});
