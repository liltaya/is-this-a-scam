import { redirect } from 'next/navigation';

// When the app's address (PIEZAS_APP_URL) isn't set, Piezas's confirmation
// emails link to /verify?token=... instead of our page at /helper/verify.
// Forward the token there, so every confirmation link works either way.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function VerifyLink({ searchParams }: Props) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  redirect(value ? `/helper/verify?token=${encodeURIComponent(value)}` : '/helper/verify');
}
