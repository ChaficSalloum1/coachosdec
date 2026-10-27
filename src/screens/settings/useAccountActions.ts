/*
Sign out, delete the account, leave the demo workspace. Each asks first.
*/
import { Alert, Platform } from 'react-native';

import { deleteAccount, signOut } from '../../services/authService';
import { useCoachStore } from '../../state/coachStore';
import { t } from '../../i18n';

export function useAccountActions() {
  const exitDemoMode = useCoachStore((s) => s.exitDemoMode);

  const handleSignOut = () => {
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        // RootNavigator's onAuthStateChange listener handles navigation.
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccountTitle'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteForever'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert(t('settings.deleteFailed'), error);
            }
            // On success RootNavigator's onAuthStateChange listener returns to sign-in.
          },
        },
      ]
    );
  };

  const confirmExitDemo = async () => {
    await signOut();
    exitDemoMode();
  };

  const handleExitDemo = () => {
    const message = t('settings.exitDemoMessage');

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${t('settings.exitDemoTitle')}\n\n${message}`)) {
        void confirmExitDemo();
      }
      return;
    }

    Alert.alert(t('settings.exitDemoTitle'), message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.exitDemo'),
        style: 'destructive',
        onPress: () => {
          void confirmExitDemo();
        },
      },
    ]);
  };

  return { handleSignOut, handleDeleteAccount, handleExitDemo };
}
