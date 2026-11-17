import { describe, expect, it } from 'vitest';
import { DEFAULT_AUTHENTICATED_ROUTE, buildLoginUrl, getSafeRedirect } from '@/lib/auth-redirect';

describe('getSafeRedirect', () => {
  it.each([
    ['/findings', '/findings'],
    ['/test-runs/42?tab=log#event-7', '/test-runs/42?tab=log#event-7'],
    ['/settings', '/settings'],
  ])('keeps the in-app path %s', (input, expected) => {
    expect(getSafeRedirect(input)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['findings'],
    ['https://evil.example/phish'],
    ['//evil.example/phish'],
    ['/\\evil.example'],
    ['/%0d%0aSet-Cookie'.replace('%0d%0a', '\r\n')],
    ['javascript:alert(1)'],
    ['/login'],
    ['/login?next=/login'],
    ['/register'],
    ['/reset-password?token=abc'],
    ['/verify-email?token=abc'],
  ])('falls back to the dashboard for %j', (input) => {
    expect(getSafeRedirect(input)).toBe(DEFAULT_AUTHENTICATED_ROUTE);
  });
});

describe('buildLoginUrl', () => {
  it('encodes the return path', () => {
    expect(buildLoginUrl('/findings/f-1?tab=evidence')).toBe('/login?next=%2Ffindings%2Ff-1%3Ftab%3Devidence');
  });

  it('omits next when it would be the default destination anyway', () => {
    expect(buildLoginUrl('/overview')).toBe('/login');
    expect(buildLoginUrl('//evil.example')).toBe('/login');
  });
});
