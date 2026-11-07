// Hides card, account and verification numbers, keeping only the last four digits.
// A 16-digit card number becomes "**** " plus its last four digits. Codes of 4 to 8 digits become "****".
// Amounts with a $ sign and 4-digit years are left alone.
export function maskNumbers(text: string): string {
  const kept: string[] = [];
  const hold = (s: string) => `\u0000${kept.push(s) - 1}\u0000`;
  let out = text.replace(/\$\s?[\d,]+(\.\d{2})?/g, hold); // money amounts
  out = out.replace(/\b(?:\d[ -]?){8,19}\d\b/g, (m) => hold(`**** ${m.replace(/\D/g, '').slice(-4)}`));
  out = out.replace(/\b\d{4,8}\b/g, (m) => (/^(19|20)\d{2}$/.test(m) ? m : '****'));
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)]);
}
