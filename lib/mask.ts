// Hides card, account and verification numbers, keeping only the last four digits.
// A card, account or ID number (9 to 20 digits, spaces or dashes allowed) becomes "**** " plus its last four digits.
// Codes split by a dash or space (123-456), a code after a word like "code", "PIN" or "CVV", and any other 4 to 8 digit number, become "****".
// Amounts with a $ sign are left alone. A 4-digit year is kept only inside a date ("Nov 7, 2024", "2024-11-07", "11/07/2024");
// a bare "2019" could be a code, so it is hidden. Masking twice changes nothing.
const SENSITIVE =
  /(\$\s?(?:\d{1,3}(?:,\d{3})+|\d{1,7})(?:\.\d{2})?)(?![ -]?\d)|((?<!\d)(?:\d[ -]?){8,19}\d(?!\d))|((?<!\d)\d{3,4}[ -]\d{3,4}(?!\d))|(\b(?:cvv2?|cvc2?|pin|otp|code|security code|verification code|one-time code)\b\D{0,20}?)(\d(?:[ -]?\d){2,7})(?!\d)|(?<!\*\s?)(?<!\d)(\d{4,8})(?!\d)/gi;
const MONTH_BEFORE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(\s+\d{1,2}(st|nd|rd|th)?,?)?\s+$/i;

function isDateYear(text: string, start: number, len: number): boolean {
  const before = text.slice(Math.max(0, start - 20), start);
  const after = text.slice(start + len, start + len + 6);
  return MONTH_BEFORE.test(before) || /\d{1,2}[/-]\d{1,2}[/-]$/.test(before) || /^[/-]\d{1,2}[/-]\d{1,2}/.test(after);
}

export function maskNumbers(text: string): string {
  return text.replace(
    SENSITIVE,
    (match: string, money?: string, card?: string, split?: string, codeWords?: string, codeDigits?: string, short?: string, offset?: number) => {
      if (money) return match;
      if (card) return `**** ${card.replace(/\D/g, '').slice(-4)}`;
      if (split) return '****';
      if (codeDigits) return `${codeWords}****`;
      return short && /^(19|20)\d{2}$/.test(short) && isDateYear(text, offset ?? 0, match.length) ? match : '****';
    },
  );
}
