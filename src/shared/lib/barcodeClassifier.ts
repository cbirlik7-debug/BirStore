function isValidLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export type IdentifierGuess = 'IMEI' | 'SERIAL' | 'UNKNOWN';

/**
 * IMEI: her zaman 15 hane + geçerli Luhn checksum. Harf içeren kodlar
 * seri no kabul edilir. İkisine de uymayan (örn. tamamen sayısal ama
 * 15 hane olmayan) kodlar UNKNOWN döner — kullanıcı elle hedef seçmeli.
 */
export function classifyIdentifier(code: string): IdentifierGuess {
  const trimmed = code.trim();
  if (/^\d{15}$/.test(trimmed) && isValidLuhn(trimmed)) return 'IMEI';
  if (/[a-zA-Z]/.test(trimmed)) return 'SERIAL';
  return 'UNKNOWN';
}
