import React from 'react';
import { View, Text } from 'react-native';
import { Lesson } from '../../types/coach';
import { useCurrency } from '../../hooks/useCurrency';
import { summarizeIncome } from '../../utils/income';
import { DesignTokens } from '../../utils/designTokens';
import { t } from '../../i18n';

export function EarningsCard({ lessons }: { lessons: Lesson[] }) {
  const { formatMoney: money } = useCurrency();
  const income = React.useMemo(() => summarizeIncome(lessons), [lessons]);
  const rows: { label: string; value: typeof income.week }[] = [
    { label: t('settings.thisWeek'), value: income.week },
    { label: t('settings.thisMonth'), value: income.month },
  ];

  return (
    <View className="bg-gray-50 rounded-xl p-4" style={{ gap: 14 }}>
      {rows.map(({ label, value }) => (
        <View key={label}>
          <View className="flex-row items-baseline justify-between">
            <Text className="text-sm" style={{ color: DesignTokens.colors.text.muted }}>{label}</Text>
            <Text className="text-xl font-semibold" style={{ color: DesignTokens.colors.text.strong }}>{money(value.paid)}</Text>
          </View>
          <Text className="text-sm mt-1" style={{ color: DesignTokens.colors.text.muted }}>
            {t('settings.earningsLessons', { count: value.lessons })}
            {value.outstanding > 0 ? t('settings.earningsOutstanding', { amount: money(value.outstanding) }) : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}
