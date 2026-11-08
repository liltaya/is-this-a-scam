import type { EntityRecord } from '@piezas/sdk';
import { ensureAuthPolicy, requireEmail, requireName, requirePassword, statusFor } from '@/lib/server/auth';
import { assertSameOrigin, HttpError, errorResponse, readJson, safeErr } from '@/lib/server/http';
import { piezas, records } from '@/lib/server/piezas';
import { requireViewer, withSession } from '@/lib/server/session';
import { toPair } from '@/lib/server/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const inFlight = new Set<string>();
const alreadyPaired = () => new HttpError(409, 'already_paired', 'You have already added your parent.');
const emailTaken = () =>
  new HttpError(409, 'email_taken', 'That email already has an account. Please use a different one.');

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
    assertSameOrigin(request);
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

    if (inFlight.has(viewer.userId)) throw alreadyPaired();
    inFlight.add(viewer.userId);
    try {
      const { pair } = await records();
      const pairsOf = async () =>
        (await pair.list({ filter: { helperUserId: viewer.userId }, limit: 10 })).data.filter(
          (r: EntityRecord) => r.data.helperUserId === viewer.userId && !r.deletedAt,
        );
      if ((await pairsOf()).length > 0) throw alreadyPaired();

      // Never touch an account that already exists: it could be someone else's.
      const findByEmail = async () =>
        (await users.listUsers({ email: parentEmail, limit: 5 })).users.find(
          (u) => u.email.toLowerCase() === parentEmail,
        );
      if (await findByEmail()) throw emailTaken();

      await ensureAuthPolicy(request);
      // Created already confirmed: the parent can't open a verification email,
      // and the helper is vouching for the address.
      const imported = await users.importUsers([
        { email: parentEmail, password: parentPassword, emailVerified: true, profile: { role: 'parent', name: parentName } },
      ]);
      const outcome = imported.results[0];
      if (!outcome || outcome.error) {
        if (/exist|conflict|duplicate|taken|registered/i.test(`${outcome?.status} ${outcome?.error}`)) throw emailTaken();
        console.error('[setup] parent account was not created', { status: outcome?.status });
        throw new HttpError(500, 'server_error', "We couldn't create your parent's account. Please try again.");
      }

      // From here on the account exists and was made by this request (it didn't
      // exist a moment ago), so any failure removes it again.
      let parentUserId: string | undefined;
      let createdPairId: string | undefined;
      try {
        const parent = await findByEmail();
        if (!parent) throw new Error('parent account not found right after it was created');
        parentUserId = parent.id;

        const created = await pair.create({
          title: `${parentName} and ${helperName}`,
          data: { parentUserId: parent.id, helperUserId: viewer.userId, parentName, helperName, helperPhone },
        });
        createdPairId = created.id;

        // One helper, one parent. If two requests raced (say on two servers),
        // the oldest pair wins and this one is undone.
        const mine = await pairsOf();
        if (mine.length > 1) {
          const oldest = [...mine].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))[0];
          if (oldest.id !== created.id) {
            await pair.delete(created.id);
            createdPairId = undefined;
            throw alreadyPaired();
          }
        }

        const status = await statusFor(viewer.token, viewer.userId, viewer.profileRole);
        return withSession(viewer, Response.json({ ...status, pair: toPair(created) }, { status: 201 }));
      } catch (err) {
        if (createdPairId) {
          await pair.delete(createdPairId).catch((e: unknown) =>
            console.error('[setup] could not remove the half-made parent link', { pairId: createdPairId, ...safeErr(e) }),
          );
        }
        const id = parentUserId ?? (await findByEmail().catch(() => undefined))?.id;
        if (id) {
          await users.deleteUser(id).catch((e: unknown) =>
            console.error('[setup] could not remove the half-made parent account', { userId: id, ...safeErr(e) }),
          );
        }
        throw err;
      }
    } finally {
      inFlight.delete(viewer.userId);
    }
  } catch (err) {
    return errorResponse(err);
  }
}
