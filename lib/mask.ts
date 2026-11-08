// Hides card, account and verification numbers, keeping only the last four digits.
// A card, account or ID number (9 to 20 digits, spaces or dashes allowed) becomes "**** " plus its last four digits.
// A code after a word like "code", "PIN" or "CVV", and any other 4 to 8 digit number, becomes "****".
// Amounts with a $ sign and 4-digit years are left alone. Masking twice changes nothing.
const SENSITIVE =
  /(\$\s?(?:\d{1,3}(?:,\d{3})+|\d{1,7})(?:\.\d{2})?)(?![ -]?\d)|((?<!\d)(?:\d[ -]?){8,19}\d(?!\d))|(\b(?:cvv2?|cvc2?|pin|otp|code|security code|verification code|one-time code)\b\D{0,20}?)(\d(?:[ -]?\d){2,7})(?!\d)|(?<!\*\s?)(?<!\d)(\d{4,8})(?!\d)/gi;

export function maskNumbers(text: string): string {
  return text.replace(
    SENSITIVE,
    (match: string, money?: string, card?: string, codeWords?: string, codeDigits?: string, short?: string) => {
      if (money) return match;
      if (card) return `**** ${card.replace(/\D/g, '').slice(-4)}`;
      if (codeDigits) return `${codeWords}****`;
      return /^(19|20)\d{2}$/.test(short ?? '') ? match : '****';
    },
  );
}
