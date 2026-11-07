import { ensureAuthPolicy, requireEmail, requireName, requirePassword, statusFor } from '@/lib/server/auth';
import { HttpError, errorResponse, readJson } from '@/lib/server/http';
import { piezas, records } from '@/lib/server/piezas';
import { requireViewer, withSession } from '@/lib/server/session';
import { findPairFor, toPair } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const inFlight = new Set<string>();

function optionalPhone(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const phone = typeof value === 'string' ? value.trim() : '';
  if (!/^\+?[\d\s().-]{7,20}$/.test(phone)) {
    throw new HttpError(400, 'invalid_input', 'Please check the phone number, or leave it empty.');
  }
  return phone;
}

// POST /api/setup/parent: a helper with sign-in codes turned on adds their
// parent (R-003, R-004). The helper picks the parent's password (the screen
// suggests a strong one); the parent never sees or types it. Piezas holds the
// account and password; the app stores only the pair.
export async function POST(request: Request) {
  try {
    const viewer = await requireViewer(request);
    if (viewer.profileRole !== 'helper') throw new HttpError(403, 'not_allowed', 'Only helpers can add a parent.');

    const body = await readJson(request);
    const parentName = requireName(body.parentName, "your parent's first name");
    const parentEmail = requireEmail(body.parentEmail);
    const parentPassword = requirePassword(body.parentPassword);
    const helperName = body.helperName ? requireName(body.helperName, 'your first name') : viewer.profileName || 'your helper';
    const helperPhone = optionalPhone(body.helperPhone);
    if (parentEmail === viewer.email.toLowerCase()) {
      throw new HttpError(400, 'invalid_input', "Please use your parent's own email, not yours.");
    }

    const users = piezas().users;
    // R-002: a helper must turn on sign-in codes before using the app.
    const mfa = await users.getMfaStatus(viewer.token);
    if (!mfa.factors.some((f) => f.confirmed)) {
      throw new HttpError(403, 'mfa_required', 'Please turn on sign-in codes first.');
    }

    if (inFlight.has(viewer.userId)) throw new HttpError(409, 'already_paired', "You're already adding a parent.");
    inFlight.add(viewer.userId);
    try {
      if (await findPairFor(viewer)) {
        throw new HttpError(409, 'already_paired', 'You have already added your parent.');
      }

      await ensureAuthPolicy(request);
      // Created already confirmed: the parent can't open a verification email,
      // and the helper is vouching for the address.
      const imported = await users.importUsers([
        { email: parentEmail, password: parentPassword, emailVerified: true, profile: { role: 'parent', name: parentName } },
      ]);
      const outcome = imported.results[0];
      if (!outcome || outcome.error || /exist|conflict|duplicate/i.test(outcome.status)) {
        if (/exist|conflict|duplicate|taken/i.test(`${outcome?.status} ${outcome?.error}`)) {
          throw new HttpError(409, 'email_taken', 'That email already has an account. Please use a different one.');
        }
        console.error('[setup] parent account was not created', outcome?.status);
        throw new HttpError(500, 'server_error', "We couldn't create your parent's account. Please try again.");
      }
      const found = await users.listUsers({ email: parentEmail, limit: 2 });
      const parent = found.users.find((u) => u.email.toLowerCase() === parentEmail);
      if (!parent) throw new Error('parent account not found right after it was created');

      const { pair } = await records();
      let created;
      try {
        created = await pair.create({
          title: `${parentName} and ${helperName}`,
          data: {
            parentUserId: parent.id,
            helperUserId: viewer.userId,
            parentName,
            helperName,
            helperPhone,
          },
        });
      } catch (err) {
        // Don't leave an account behind that no pair points to.
        await users.deleteUser(parent.id).catch(() => undefined);
        throw err;
      }

      const status = await statusFor(viewer.token, viewer.userId, viewer.profileRole);
      return withSession(viewer, Response.json({ ...status, pair: toPair(created) }, { status: 201 }));
    } finally {
      inFlight.delete(viewer.userId);
    }
  } catch (err) {
    return errorResponse(err);
  }
}
