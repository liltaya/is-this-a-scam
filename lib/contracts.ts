// Shared shapes from docs/contracts.md. Owner: C. Change docs/contracts.md first.

export type Role = 'parent' | 'helper';
export type Risk = 'red' | 'yellow' | 'green';
export type HelperAnswer = 'pending' | 'scam' | 'safe';
export type FlagType =
  | 'urgency' | 'money' | 'gift_cards' | 'codes'
  | 'secrecy' | 'impersonation' | 'link' | 'other';

export const FLAG_TYPES: FlagType[] = [
  'urgency', 'money', 'gift_cards', 'codes', 'secrecy', 'impersonation', 'link', 'other',
];

export interface Flag {
  type: FlagType;
  quote: string; // exact phrase from the masked text, used for highlighting
  explain: string; // one short sentence in plain words
  source: 'rules' | 'ai';
}

export interface Pair {
  id: string;
  parentUserId: string;
  helperUserId: string;
  parentName: string;
  helperName: string;
  helperPhone: string | null;
  createdAt: string;
}

export interface Check {
  id: string;
  pairId: string;
  parentUserId: string;
  maskedText: string | null;
  screenshotFileId: string | null;
  risk: Risk;
  flags: Flag[];
  summary: string;
  engine: 'rules+ai' | 'rules-only';
  helperAnswer: HelperAnswer;
  helperNote: string | null;
  createdAt: string;
  answeredAt: string | null;
  textClearedAt: string | null;
}

export interface AnalyzeResult {
  maskedText: string;
  risk: Risk;
  flags: Flag[];
  summary: string;
  engine: 'rules+ai' | 'rules-only';
}

/** Returned by every sign-in step and by GET /api/auth/me, so screens know where to go next. */
export interface AuthStatus {
  status: 'signed_in';
  role: Role | null;
  mfaEnabled: boolean;
  /** A helper must turn on sign-in codes before adding a parent (R-002). */
  needsMfaSetup: boolean;
  pair: Pair | null;
}

/** Returned by POST /api/auth/signin when a code is needed. The challenge itself stays in a server-only cookie. */
export interface MfaRequired {
  status: 'mfa_required';
  factors: Array<'totp' | 'email'>;
}

export interface ApiError {
  error: { code: string; message: string };
}
