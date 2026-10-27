import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Switch } from 'react-native';
import { Coach } from '../../types/coach';
import type { PaymentPreference } from '../../modules/payments';
import { getRevolutLinkError, normalizePaymentSettings } from '../../modules/payments';
import { CurrencyPicker } from '../../components/CurrencyPicker';

interface PaymentSettingsProps {
  coach: Coach;
  onUpdate: (updates: Partial<Coach>) => void;
}

export function PaymentSettings({ coach, onUpdate }: PaymentSettingsProps) {
  const settings = normalizePaymentSettings(coach.paymentSettings);
  const updatePaymentSettings = (updates: Partial<Coach['paymentSettings']>) => {
    onUpdate({
      paymentSettings: {
        ...settings,
        ...updates,
      },
    });
  };

  const methods: { value: PaymentPreference; label: string }[] = [
    { value: 'REVOLUT', label: 'Revolut' },
    { value: 'IRIS', label: 'IRIS' },
    { value: 'IBAN', label: 'IBAN' },
    { value: 'CASH', label: 'Cash' },
    { value: 'MULTIPLE', label: 'Multiple' },
  ];

  const showRevolut = settings.paymentPreference === 'REVOLUT' || settings.paymentPreference === 'MULTIPLE';
  const showIris = settings.paymentPreference === 'IRIS' || settings.paymentPreference === 'MULTIPLE';
  const showIban = settings.paymentPreference === 'IBAN' || settings.paymentPreference === 'MULTIPLE';

  // What the coach is typing. It is only saved once it's a valid link (or
  // empty), so a half-typed or wrong link can never reach QR codes/reminders.
  const [revolutDraft, setRevolutDraft] = useState(settings.revolutLink || '');
  const revolutError = getRevolutLinkError(revolutDraft);

  // Follow the saved value when it changes from elsewhere (e.g. the initial
  // cloud load), but never overwrite text the coach is still fixing.
  useEffect(() => {
    if (getRevolutLinkError(revolutDraft) === null) {
      setRevolutDraft(settings.revolutLink || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.revolutLink]);

  const handleRevolutChange = (text: string) => {
    const next = text.trim();
    setRevolutDraft(next);
    if (getRevolutLinkError(next) === null) {
      updatePaymentSettings({ revolutLink: next });
    }
  };

  return (
    <View className="bg-gray-50 rounded-card p-4">
      <View className="mb-5">
        <Text className="text-base font-semibold mb-1" style={{ color: '#0B1220' }}>
          How do you want clients to pay you?
        </Text>
        <Text className="text-sm" style={{ color: '#42526E', lineHeight: 19 }}>
          Coachiko does not process payments directly yet. We help you send clear payment requests and track who has paid.
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">Currency</Text>
        <CurrencyPicker
          value={settings.currency ?? 'EUR'}
          onChange={(currency) => updatePaymentSettings({ currency })}
        />
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">Preferred method</Text>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {methods.map(method => {
            const selected = settings.paymentPreference === method.value;
            return (
              <Pressable
                key={method.value}
                onPress={() => updatePaymentSettings({ paymentPreference: method.value })}
                className="rounded-lg px-3 py-2 border"
                style={{
                  backgroundColor: selected ? '#E8F2FF' : '#FFFFFF',
                  borderColor: selected ? '#1E88E5' : '#D7DEE8',
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: selected ? '#1E88E5' : '#0B1220' }}
                >
                  {method.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showRevolut && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">Revolut payment link</Text>
          <TextInput
            value={revolutDraft}
            onChangeText={handleRevolutChange}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder="https://revolut.me/coachname"
            autoCapitalize="none"
            keyboardType="url"
          />
          {revolutError ? (
            <Text className="text-xs mt-2" style={{ color: '#C62828' }}>
              {revolutError}
            </Text>
          ) : (
            <Text className="text-xs mt-2" style={{ color: '#42526E' }}>
              Clients can open this directly from their session reminder.
            </Text>
          )}
        </View>
      )}

      {showIris && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">IRIS alias</Text>
          <TextInput
            value={settings.irisAlias || ''}
            onChangeText={(text) => updatePaymentSettings({ irisAlias: text.trim() })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder="@coachalias or phone"
            autoCapitalize="none"
          />
          <Text className="text-xs mt-2" style={{ color: '#42526E' }}>
            Clients will use this alias inside their own banking app.
          </Text>
        </View>
      )}

      {showIban && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">IBAN</Text>
          <TextInput
            value={settings.iban || ''}
            onChangeText={(text) => updatePaymentSettings({ iban: text.toUpperCase() })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder="GR..."
            autoCapitalize="characters"
          />
          <Text className="text-small font-medium text-ink-900 mt-3 mb-2">Beneficiary name</Text>
          <TextInput
            value={settings.ibanBeneficiaryName || ''}
            onChangeText={(text) => updatePaymentSettings({ ibanBeneficiaryName: text })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={coach.name}
          />
          <Text className="text-xs mt-2" style={{ color: '#42526E' }}>
            Used for bank transfer instructions and SEPA-compatible QR codes where supported.
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-body font-medium text-ink-900">Accept cash/manual payment</Text>
        <Switch
          value={settings.cashEnabled}
          onValueChange={(value) => updatePaymentSettings({ cashEnabled: value })}
          trackColor={{ false: '#E0E0E0', true: '#1E88E5' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View>
        <Text className="text-small font-medium text-ink-900 mb-2">Cancellation policy</Text>
        <TextInput
          value={settings.cancellationPolicy || ''}
          onChangeText={(text) => updatePaymentSettings({ cancellationPolicy: text })}
          className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
          placeholder="Example: Cancel at least 24 hours before the lesson."
          multiline
          numberOfLines={3}
          maxLength={600}
          style={{ textAlignVertical: 'top' }}
        />
      </View>
    </View>
  );
}
