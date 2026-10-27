import { useSyncExternalStore } from 'react';

import i18n, { currentLanguage } from './index';

const subscribe = (onChange: () => void) => {
  i18n.on('languageChanged', onChange);
  return () => i18n.off('languageChanged', onChange);
};

// The active language; re-renders when it changes.
export const useLanguage = () => useSyncExternalStore(subscribe, currentLanguage);
