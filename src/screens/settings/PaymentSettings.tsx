import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, Switch } from 'react-native';
import { Coach } from '../../types/coach';
import type { PaymentPreference } from '../../modules/payments';
import { getRevolutLinkError, normalizePaymentSettings } from '../../modules/payments';
import { CurrencyPicker } from '../../components/CurrencyPicker';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

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
    { value: 'REVOLUT', label: t('settings.methodRevolut') },
    { value: 'IRIS', label: t('settings.methodIris') },
    { value: 'IBAN', label: t('settings.iban') },
    { value: 'CASH', label: t('settings.methodCash') },
    { value: 'MULTIPLE', label: t('settings.methodMultiple') },
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
        <Text className="text-base font-semibold mb-1" style={{ color: DesignTokens.colors.text.strong }}>
          {t('settings.payHow')}
        </Text>
        <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted, lineHeight: 19 }}>
          {t('settings.payDisclaimer')}
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.currency')}</Text>
        <CurrencyPicker
          value={settings.currency ?? 'EUR'}
          onChange={(currency) => updatePaymentSettings({ currency })}
        />
      </View>

      <View className="mb-4">
        <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.preferredMethod')}</Text>
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {methods.map(method => {
            const selected = settings.paymentPreference === method.value;
            return (
              <Pressable
                key={method.value}
                onPress={() => updatePaymentSettings({ paymentPreference: method.value })}
                className="rounded-lg px-3 py-2 border"
                style={{
                  backgroundColor: selected ? DesignTokens.colors.brand.tint : DesignTokens.colors.white,
                  borderColor: selected ? DesignTokens.colors.brand.default : DesignTokens.colors.brand.outline,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: selected ? DesignTokens.colors.brand.default : DesignTokens.colors.text.strong }}
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
          <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.revolutLink')}</Text>
          <TextInput
            value={revolutDraft}
            onChangeText={handleRevolutChange}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={t('settings.revolutLinkPlaceholder')}
            autoCapitalize="none"
            keyboardType="url"
          />
          {revolutError ? (
            <Text className="text-xs mt-2" style={{ color: DesignTokens.colors.red['800'] }}>
              {revolutError}
            </Text>
          ) : (
            <Text className="text-xs mt-2" style={{ color: DesignTokens.colors.text.muted }}>
              {t('settings.revolutLinkHint')}
            </Text>
          )}
        </View>
      )}

      {showIris && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.irisAlias')}</Text>
          <TextInput
            value={settings.irisAlias || ''}
            onChangeText={(text) => updatePaymentSettings({ irisAlias: text.trim() })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={t('settings.irisAliasPlaceholder')}
            autoCapitalize="none"
          />
          <Text className="text-xs mt-2" style={{ color: DesignTokens.colors.text.muted }}>
            {t('settings.irisAliasHint')}
          </Text>
        </View>
      )}

      {showIban && (
        <View className="mb-4">
          <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.iban')}</Text>
          <TextInput
            value={settings.iban || ''}
            onChangeText={(text) => updatePaymentSettings({ iban: text.toUpperCase() })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={t('settings.ibanPlaceholder')}
            autoCapitalize="characters"
          />
          <Text className="text-small font-medium text-ink-900 mt-3 mb-2">{t('settings.beneficiary')}</Text>
          <TextInput
            value={settings.ibanBeneficiaryName || ''}
            onChangeText={(text) => updatePaymentSettings({ ibanBeneficiaryName: text })}
            className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
            placeholder={coach.name}
          />
          <Text className="text-xs mt-2" style={{ color: DesignTokens.colors.text.muted }}>
            {t('settings.ibanHint')}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-body font-medium text-ink-900">{t('settings.acceptCash')}</Text>
        <Switch
          value={settings.cashEnabled}
          onValueChange={(value) => updatePaymentSettings({ cashEnabled: value })}
          trackColor={{ false: DesignTokens.colors.line.default, true: DesignTokens.colors.brand.default }}
          thumbColor={DesignTokens.colors.white}
        />
      </View>

      <View>
        <Text className="text-small font-medium text-ink-900 mb-2">{t('settings.cancellationPolicy')}</Text>
        <TextInput
          value={settings.cancellationPolicy || ''}
          onChangeText={(text) => updatePaymentSettings({ cancellationPolicy: text })}
          className="bg-white rounded-default px-3 py-2 text-body text-ink-900 border border-gray-200"
          placeholder={t('settings.cancellationPolicyPlaceholder')}
          multiline
          numberOfLines={3}
          maxLength={600}
          style={{ textAlignVertical: 'top' }}
        />
      </View>
    </View>
  );
}
