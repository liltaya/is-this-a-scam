// Hides card, account and verification numbers, keeping only the last four digits.
// A 16-digit card number becomes "**** " plus its last four digits. Codes of 4 to 8 digits become "****".
// Amounts with a $ sign are left alone. A 4-digit year is kept only inside a date
// ("Nov 7, 2024", "2024-11-07", "11/07/2024"); a bare "2019" could be a code, so it is hidden.
const MONTH_BEFORE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(\s+\d{1,2}(st|nd|rd|th)?,?)?\s+$/i;
function isDateYear(text: string, start: number, len: number): boolean {
  const before = text.slice(Math.max(0, start - 20), start);
  const after = text.slice(start + len, start + len + 6);
  return MONTH_BEFORE.test(before) || /\d{1,2}[/-]\d{1,2}[/-]$/.test(before) || /^[/-]\d{1,2}[/-]\d{1,2}/.test(after);
}
export function maskNumbers(text: string): string {
  const kept: string[] = [];
  const hold = (s: string) => `\u0000${kept.push(s) - 1}\u0000`;
  let out = text.replace(/\$\s?[\d,]+(\.\d{2})?/g, hold); // money amounts
  out = out.replace(/\b(?:\d[ -]?){8,19}\d\b/g, (m) => hold(`**** ${m.replace(/\D/g, '').slice(-4)}`));
  // Codes split by a dash or space, like 123-456 or 1234 5678 (dates like 2024-11-07 have 2-digit parts).
  out = out.replace(/\b\d{3,4}[ -]\d{3,4}\b/g, () => hold('****'));
  out = out.replace(/\b\d{4,8}\b/g, (m, offset: number, whole: string) =>
    /^(19|20)\d{2}$/.test(m) && isDateYear(whole, offset, m.length) ? m : '****');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[Number(i)]);
}
