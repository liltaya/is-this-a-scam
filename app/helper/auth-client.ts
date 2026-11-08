import type { AuthStatus, MfaRequired } from '@/lib/contracts';

export type AuthStatusWithName = AuthStatus & { name?: string };
export type SignInStatus = AuthStatus | MfaRequired;

export class AuthRequestError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'AuthRequestError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: body === undefined ? { Accept: 'application/json' } : {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (result as { error?: { code?: unknown; message?: unknown } } | null)?.error;
    const code = typeof error?.code === 'string' ? error.code : 'request_failed';
    const message = typeof error?.message === 'string' ? error.message : 'We couldn’t complete that step. Please try again.';
    throw new AuthRequestError(message, code, response.status);
  }

  return result as T;
}

export function isMfaRequired(status: SignInStatus): status is MfaRequired {
  return status.status === 'mfa_required';
}

export function nextSignedInPath(status: AuthStatus): string {
  if (status.role === 'parent') return '/';
  if (status.role !== 'helper') return '/helper/signin';
  if (status.needsMfaSetup) return '/helper/mfa/setup';
  if (!status.pair) return '/helper/add-parent';
  return '/helper';
}

/** Keep a private email alert open through sign-in and its second step. */
export function safeHelperReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\r\n]/.test(value)) {
    return null;
  }
  return value;
}

export function helperSignedInPath(status: AuthStatus, returnTo: string | null): string {
  const next = nextSignedInPath(status);
  if (status.role !== 'helper' || !status.pair || !returnTo) return next;
  if (status.needsMfaSetup) return `/helper/mfa/setup?returnTo=${encodeURIComponent(returnTo)}`;
  return returnTo;
}

export function friendlyAuthError(error: unknown): string {
  if (error instanceof AuthRequestError) {
    if (error.code === 'bad_origin') return 'Please open SafeLine directly, then try again.';
    if (error.code === 'expired') return 'That step timed out. Please sign in again.';
    if (error.code === 'invalid_link') return 'That email link has expired. Please sign in and request a new one.';
    if (error.code === 'email_not_verified') return 'Please confirm your email from the link we sent before continuing.';
    if (error.code === 'email_taken') return 'That email already has an account. Sign in instead.';
    if (error.code === 'already_paired') return 'You’ve already added a parent to this account.';
    if (error.code === 'mfa_required') return 'Turn on sign-in codes before adding your parent.';
    if (error.code === 'signed_out') return 'Please sign in to continue.';
    if (error.code === 'rate_limited') return 'There have been too many attempts. Please wait a little and try again.';
    return error.message;
  }
  return 'We couldn’t reach SafeLine. Check your connection and try again.';
}
