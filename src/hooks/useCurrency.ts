import { useCallback } from 'react';

import { useCoachStore } from '../state/coachStore';
import { currencySymbol, formatMoney, resolveCurrency } from '../modules/payments';

// The signed-in coach's currency, plus helpers bound to it.
export function useCurrency() {
  const currency = useCoachStore((s) => resolveCurrency(s.coach?.paymentSettings?.currency));
  const format = useCallback((amount: number) => formatMoney(amount, currency), [currency]);
  return { currency, symbol: currencySymbol(currency), formatMoney: format };
}
