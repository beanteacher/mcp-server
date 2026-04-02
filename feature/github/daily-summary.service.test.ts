import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock imported modules before importing the module under test
vi.mock('./get-today-commits.service', () => ({
  getTodayCommits: vi.fn(),
}));

vi.mock('./get-commit-detail.service', () => ({
  getCommitDetail: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  analyzeDailyWork: vi.fn(),
}));

import { getDailySummary } from './daily-summary.service';
import { getTodayCommits } from './get-today-commits.service';
import { getCommitDetail } from './get-commit-detail.service';
import { analyzeDailyWork } from '@/lib/gemini';
import type { GitHubDto } from './dto';

function makeCommit(sha: string): GitHubDto.Commit {
  return {
    sha,
    commit: { message: 'feat: something', author: { name: 'dev', date: '2024-01-15T10:00:00Z' } },
    html_url: `https://github.com/owner/repo/commit/${sha}`,
  };
}

function makeCommitDetail(sha: string): GitHubDto.CommitDetail {
  return {
    ...makeCommit(sha),
    files: [{ filename: 'src/index.ts', status: 'modified', additions: 3, deletions: 1 }],
    stats: { additions: 3, deletions: 1, total: 4 },
  };
}

describe('getDailySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a no-commits message when getTodayCommits returns empty array', async () => {
    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const result = await getDailySummary('owner', 'repo');
    expect(result).toBe('오늘 커밋 내역이 없습니다.');
  });

  it('does not call getCommitDetail or analyzeDailyWork when there are no commits', async () => {
    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await getDailySummary('owner', 'repo');
    expect(getCommitDetail).not.toHaveBeenCalled();
    expect(analyzeDailyWork).not.toHaveBeenCalled();
  });

  it('calls getCommitDetail for each commit when commits are present', async () => {
    const commits = [makeCommit('aaa0001'), makeCommit('bbb0002')];
    const details = commits.map(c => makeCommitDetail(c.sha));

    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(commits);
    (getCommitDetail as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(details[0])
      .mockResolvedValueOnce(details[1]);
    (analyzeDailyWork as ReturnType<typeof vi.fn>).mockResolvedValueOnce('summary text');

    await getDailySummary('owner', 'repo');
    expect(getCommitDetail).toHaveBeenCalledTimes(2);
    expect(getCommitDetail).toHaveBeenCalledWith('owner', 'repo', 'aaa0001');
    expect(getCommitDetail).toHaveBeenCalledWith('owner', 'repo', 'bbb0002');
  });

  it('passes owner/repo and commit details to analyzeDailyWork', async () => {
    const commits = [makeCommit('aaa0001')];
    const detail = makeCommitDetail('aaa0001');

    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(commits);
    (getCommitDetail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(detail);
    (analyzeDailyWork as ReturnType<typeof vi.fn>).mockResolvedValueOnce('analysis result');

    await getDailySummary('myorg', 'myrepo');
    expect(analyzeDailyWork).toHaveBeenCalledWith('myorg/myrepo', [detail], undefined);
  });

  it('passes model parameter to analyzeDailyWork when provided', async () => {
    const commits = [makeCommit('aaa0001')];
    const detail = makeCommitDetail('aaa0001');

    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(commits);
    (getCommitDetail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(detail);
    (analyzeDailyWork as ReturnType<typeof vi.fn>).mockResolvedValueOnce('model result');

    await getDailySummary('owner', 'repo', undefined, 'gemini-pro');
    expect(analyzeDailyWork).toHaveBeenCalledWith('owner/repo', [detail], 'gemini-pro');
  });

  it('passes branch to getTodayCommits when provided', async () => {
    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await getDailySummary('owner', 'repo', 'main');
    expect(getTodayCommits).toHaveBeenCalledWith('owner', 'repo', 'main');
  });

  it('returns the result from analyzeDailyWork', async () => {
    const commits = [makeCommit('ccc0003')];
    const detail = makeCommitDetail('ccc0003');

    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(commits);
    (getCommitDetail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(detail);
    (analyzeDailyWork as ReturnType<typeof vi.fn>).mockResolvedValueOnce('final summary');

    const result = await getDailySummary('owner', 'repo');
    expect(result).toBe('final summary');
  });

  it('limits commit detail fetching to at most 10 commits', async () => {
    const commits = Array.from({ length: 15 }, (_, i) =>
      makeCommit(`sha${String(i).padStart(7, '0')}`),
    );
    const detail = makeCommitDetail('sha0000000');

    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(commits);
    (getCommitDetail as ReturnType<typeof vi.fn>).mockResolvedValue(detail);
    (analyzeDailyWork as ReturnType<typeof vi.fn>).mockResolvedValueOnce('limited result');

    await getDailySummary('owner', 'repo');
    expect(getCommitDetail).toHaveBeenCalledTimes(10);
  });

  it('passes exactly 10 details to analyzeDailyWork when more than 10 commits exist', async () => {
    const commits = Array.from({ length: 12 }, (_, i) =>
      makeCommit(`sha${String(i).padStart(7, '0')}`),
    );
    const detail = makeCommitDetail('sha0000000');

    (getTodayCommits as ReturnType<typeof vi.fn>).mockResolvedValueOnce(commits);
    (getCommitDetail as ReturnType<typeof vi.fn>).mockResolvedValue(detail);
    (analyzeDailyWork as ReturnType<typeof vi.fn>).mockResolvedValueOnce('ok');

    await getDailySummary('owner', 'repo');
    const callArgs = (analyzeDailyWork as ReturnType<typeof vi.fn>).mock.calls[0];
    const detailsArg = callArgs[1] as GitHubDto.CommitDetail[];
    expect(detailsArg).toHaveLength(10);
  });
});
