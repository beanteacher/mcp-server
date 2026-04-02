import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { githubHeaders, parseErrorMessage } from './shared';

describe('githubHeaders', () => {
  const originalToken = process.env.GITHUB_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalToken;
    }
  });

  it('returns required Accept and X-GitHub-Api-Version headers', () => {
    delete process.env.GITHUB_TOKEN;
    const headers = githubHeaders();
    expect(headers['Accept']).toBe('application/vnd.github+json');
    expect(headers['X-GitHub-Api-Version']).toBe('2022-11-28');
  });

  it('does not include Authorization header when GITHUB_TOKEN is not set', () => {
    delete process.env.GITHUB_TOKEN;
    const headers = githubHeaders();
    expect(headers['Authorization']).toBeUndefined();
  });

  it('includes Bearer Authorization header when GITHUB_TOKEN is set', () => {
    process.env.GITHUB_TOKEN = 'ghp_testtoken123';
    const headers = githubHeaders();
    expect(headers['Authorization']).toBe('Bearer ghp_testtoken123');
  });

  it('returns a plain object with string values', () => {
    delete process.env.GITHUB_TOKEN;
    const headers = githubHeaders();
    for (const value of Object.values(headers)) {
      expect(typeof value).toBe('string');
    }
  });
});

describe('parseErrorMessage', () => {
  it('returns the message field from an object body', () => {
    const body = { message: 'Not Found' };
    expect(parseErrorMessage(body, 404)).toBe('Not Found');
  });

  it('returns fallback string when body has no message field', () => {
    const body = { error: 'something' };
    expect(parseErrorMessage(body, 403)).toBe('GitHub API 오류: 403');
  });

  it('returns fallback string when body is null', () => {
    expect(parseErrorMessage(null, 500)).toBe('GitHub API 오류: 500');
  });

  it('returns fallback string when body is a primitive string', () => {
    expect(parseErrorMessage('raw error', 422)).toBe('GitHub API 오류: 422');
  });

  it('returns fallback string when message field is not a string', () => {
    const body = { message: 42 };
    expect(parseErrorMessage(body, 400)).toBe('GitHub API 오류: 400');
  });

  it('returns fallback string when body is an empty object', () => {
    expect(parseErrorMessage({}, 503)).toBe('GitHub API 오류: 503');
  });

  it('includes the status code in the fallback message', () => {
    const result = parseErrorMessage(null, 429);
    expect(result).toContain('429');
  });
});
