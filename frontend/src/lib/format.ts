const faFormatter = new Intl.NumberFormat("fa-IR");

/** 385000 -> "۳۸۵٬۰۰۰" */
export function faNum(n: number): string {
  return faFormatter.format(n);
}

/** price in تومان with Persian digits */
export function faPrice(toman: number): string {
  return `${faFormatter.format(toman)} تومان`;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(s: string | number): string {
  return String(s).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function latinDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export const formatPrice = faPrice;
