import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LocationsScreen } from '../screens/LocationsScreen';
import { AvailabilityScreen } from '../screens/AvailabilityScreen';
import { PublicBookingPreview } from '../screens/PublicBookingPreview';
import { PublicBookingWrapper } from '../screens/PublicBookingWrapper';
import { DesignTokens } from '../utils/designTokens';
import { t } from '../i18n';

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Locations: undefined;
  Availability: undefined;
  PublicBookingPreview: { slug: string };
  PublicBooking: undefined;
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

function PaywallRoute() {
  const [Paywall, setPaywall] = React.useState<React.ComponentType | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    import('../screens/PaywallScreen')
      .then(module => {
        if (mounted) {
          setPaywall(() => module.PaywallScreen);
        }
      })
      .catch(() => {
        if (mounted) {
          setFailed(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (Paywall) {
    return <Paywall />;
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: DesignTokens.colors.white, padding: 24 }}>
      {failed ? (
        <>
          <Text style={{ color: DesignTokens.colors.text.strong, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
            {t('shell.subscriptionsUnavailable')}
          </Text>
          <Text style={{ color: DesignTokens.colors.text.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
            {t('shell.subscriptionsUnavailableBody')}
          </Text>
        </>
      ) : (
        <ActivityIndicator color={DesignTokens.colors.brand.default} size="large" />
      )}
    </View>
  );
}

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen 
        name="Locations" 
        component={LocationsScreen}
        options={{
          headerShown: true,
          presentation: 'modal',
          headerTitle: '',
          headerBackTitle: 'Settings',
        }}
      />
      <Stack.Screen 
        name="Availability" 
        component={AvailabilityScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="PublicBookingPreview" 
        component={PublicBookingPreview}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="PublicBooking"
        component={PublicBookingWrapper}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallRoute}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
