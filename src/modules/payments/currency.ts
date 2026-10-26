// Per-coach currency. Prices are stored as plain numbers; this only decides how
// they are shown and what the payment messages say. Stored inside the coach's
// payment settings, so no database change is needed.

export const CURRENCY_CODES = ['EUR', 'USD', 'GBP', 'AUD', 'CAD', 'CHF', 'SEK', 'NZD'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  EUR: 'Euro',
  USD: 'US dollar',
  GBP: 'British pound',
  AUD: 'Australian dollar',
  CAD: 'Canadian dollar',
  CHF: 'Swiss franc',
  SEK: 'Swedish krona',
  NZD: 'New Zealand dollar',
};

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCY_CODES as readonly string[]).includes(value);
}

// Anything missing or unrecognised (old data, a bad value) falls back to the default.
export function resolveCurrency(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}

// For prices on screen: whole amounts without decimals ("€25"), otherwise two ("€22.50").
export function formatMoney(amount: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// For payment requests: always two decimals ("€25.00").
export function formatMoneyFromCents(amountCents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amountCents / 100);
}
