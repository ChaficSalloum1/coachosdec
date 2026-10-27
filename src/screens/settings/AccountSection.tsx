import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SettingsSection } from './SettingsSection';
import { useAccountActions } from './useAccountActions';
import { DesignTokens } from '../../utils/designTokens';

// Sign out / delete account, or (in the demo workspace) a way to leave it.
export function AccountSection({ isDemoMode }: { isDemoMode: boolean }) {
  const { handleSignOut, handleDeleteAccount, handleExitDemo } = useAccountActions();

  return (
    <SettingsSection title="Account">
      {isDemoMode ? (
        <Pressable onPress={handleExitDemo} className="bg-blue-50 rounded-xl p-4 active:bg-blue-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-medium mb-1" style={{ color: DesignTokens.colors.brand.default }}>
                Exit Demo & Create Account
              </Text>
              <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>
                Clear sample data and return to sign up or sign in.
              </Text>
            </View>
            <Ionicons name="person-add-outline" size={20} color={DesignTokens.colors.brand.default} />
          </View>
        </Pressable>
      ) : (
        <>
          <Pressable onPress={handleSignOut} className="bg-red-50 rounded-xl p-4 active:bg-red-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium" style={{ color: DesignTokens.colors.red['700'] }}>
                Sign Out
              </Text>
              <Ionicons name="log-out-outline" size={20} color={DesignTokens.colors.red['700']} />
            </View>
          </Pressable>
          <Pressable
            onPress={handleDeleteAccount}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: 'center', marginTop: 12 }}
          >
            <Text className="text-sm" style={{ color: DesignTokens.colors.red['700'], textAlign: 'center' }}>
              Delete account
            </Text>
          </Pressable>
        </>
      )}
    </SettingsSection>
  );
}
