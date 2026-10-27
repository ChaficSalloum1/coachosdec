/*
Sign out, delete the account, leave the demo workspace. Each asks first.
*/
import { Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { deleteAccount, signOut } from '../../services/authService';
import { useCoachStore } from '../../state/coachStore';

export function useAccountActions() {
  const { t } = useTranslation();
  const exitDemoMode = useCoachStore((s) => s.exitDemoMode);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: 'Sign Out',
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
      'Delete account?',
      'This permanently deletes your account, students, lessons and notes. It cannot be undone. Export your data first if you want a copy.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Could not delete account', error);
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
    const message = 'This will clear demo data and return you to sign up or sign in.';

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`Exit demo workspace?\n\n${message}`)) {
        void confirmExitDemo();
      }
      return;
    }

    Alert.alert('Exit demo workspace?', message, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: 'Exit Demo',
        style: 'destructive',
        onPress: () => {
          void confirmExitDemo();
        },
      },
    ]);
  };

  return { handleSignOut, handleDeleteAccount, handleExitDemo };
}
