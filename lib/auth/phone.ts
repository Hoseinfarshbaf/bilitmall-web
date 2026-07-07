const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizePhone(value: string): string {
  const latin = value
    .trim()
    .split("")
    .map((char) => {
      const persianIndex = PERSIAN_DIGITS.indexOf(char);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = ARABIC_DIGITS.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      return char;
    })
    .join("")
    .replace(/\D/g, "");

  if (latin.startsWith("98") && latin.length === 12) {
    return `0${latin.slice(2)}`;
  }

  return latin;
}

export function isValidIranMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}
