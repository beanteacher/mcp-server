import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserRepos, formatUserRepos } from './get-user-repos.service';
import type { GitHubDto } from './dto';

function makeRepo(overrides: Partial<GitHubDto.Repo> = {}): GitHubDto.Repo {
  return {
    name: 'my-repo',
    full_name: 'octocat/my-repo',
    description: 'A test repo',
    html_url: 'https://github.com/octocat/my-repo',
    stargazers_count: 10,
    language: 'TypeScript',
    updated_at: '2024-03-15T00:00:00Z',
    private: false,
    ...overrides,
  };
}

describe('formatUserRepos', () => {
  it('formats a single repo with name, language, stars, date, and description', () => {
    const repo = makeRepo();
    const result = formatUserRepos([repo]);
    expect(result).toBe('my-repo │ TypeScript │ ⭐10 │ 2024-03-15 │ A test repo');
  });

  it('uses - when language is null', () => {
    const repo = makeRepo({ language: null });
    const result = formatUserRepos([repo]);
    expect(result).toContain('│ - │');
  });

  it('uses empty string when description is null', () => {
    const repo = makeRepo({ description: null });
    const result = formatUserRepos([repo]);
    // last segment after final separator should be empty
    const parts = result.split(' │ ');
    expect(parts[parts.length - 1]).toBe('');
  });

  it('truncates updated_at to 10 characters (date only)', () => {
    const repo = makeRepo({ updated_at: '2024-06-20T12:34:56Z' });
    const result = formatUserRepos([repo]);
    expect(result).toContain('2024-06-20');
    expect(result).not.toContain('12:34:56');
  });

  it('joins multiple repos with newlines', () => {
    const repos = [makeRepo({ name: 'repo-a' }), makeRepo({ name: 'repo-b' })];
    const result = formatUserRepos(repos);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('repo-a');
    expect(lines[1]).toContain('repo-b');
  });

  it('returns empty string for empty array', () => {
    expect(formatUserRepos([])).toBe('');
  });
});

describe('getUserRepos', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns array of repos on successful response', async () => {
    const repos = [makeRepo()];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(repos),
    });

    const result = await getUserRepos('octocat');
    expect(result).toEqual(repos);
  });

  it('calls the correct GitHub user repos API URL', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getUserRepos('octocat');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('https://api.github.com/users/octocat/repos');
  });

  it('requests per_page=100 and sort=updated', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await getUserRepos('octocat');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('per_page=100');
    expect(calledUrl).toContain('sort=updated');
  });

  it('throws with API error message when response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not Found' }),
    });

    await expect(getUserRepos('ghostuser')).rejects.toThrow('Not Found');
  });

  it('throws fallback error when non-ok body has no message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    await expect(getUserRepos('octocat')).rejects.toThrow('GitHub API 오류: 500');
  });

  it('throws fallback error when json parsing fails on error response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error('bad json')),
    });

    await expect(getUserRepos('octocat')).rejects.toThrow('GitHub API 오류: 503');
  });
});
