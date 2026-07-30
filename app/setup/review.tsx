import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SetupProgress } from '../../src/components/SetupProgress';
import { selectMonthlyPlan, useFinanceStore } from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';

export default function SetupReviewScreen() {
  const plan = useFinanceStore(selectMonthlyPlan);
  const completeOnboarding = useFinanceStore((s) => s.completeOnboarding);

  const rows: { label: string; value: number }[] = [
    { label: 'Expected monthly income (estimate)', value: plan.expectedMonthlyIncomeCents },
    { label: 'Required monthly expenses (estimate)', value: plan.requiredMonthlyCents },
    { label: 'Essential monthly expenses (estimate)', value: plan.essentialMonthlyCents },
    { label: 'Optional monthly expenses (estimate)', value: plan.optionalMonthlyCents },
    { label: 'Goal contributions (estimate)', value: plan.goalContributionMonthlyCents },
    { label: 'Estimated remainder', value: plan.estimatedRemainderCents },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <SetupProgress current={3} />
      <Text style={styles.heading}>Review your initial plan</Text>
      <Text style={styles.sub}>
        Values below are normalized monthly estimates from your frequencies.
      </Text>

      <View style={styles.card}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{formatCAD(row.value)}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton
        label="Edit information"
        variant="secondary"
        onPress={() => router.push('/setup/income')}
        style={{ marginBottom: spacing.sm }}
      />
      <PrimaryButton
        label="Use this plan"
        onPress={() => {
          completeOnboarding();
          router.replace('/(tabs)/today');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.woodland,
    marginBottom: 6,
  },
  sub: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 2 },
  value: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
