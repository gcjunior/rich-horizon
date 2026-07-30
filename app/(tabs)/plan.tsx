import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { BillCliffCard } from '../../src/components/BillCliffCard';
import { useAppStore } from '../../src/store/appStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';

export default function PlanScreen() {
  const loaded = useAppStore((s) => s.loaded);
  const summary = useAppStore((s) => s.summary);

  if (!loaded || !summary) return <Redirect href="/" />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Daily earners are paid in drips. Their bills arrive in cliffs.
      </Text>

      <BillCliffCard cliff={summary.billCliff} />

      <View style={styles.explain}>
        <Text style={styles.explainTitle}>Why this matters</Text>
        <Text style={styles.explainBody}>
          Rich Horizon accrues a share of each workday’s pay toward this cliff so
          the due date does not empty the account at once. Today’s required bill
          accrual is {formatCAD(summary.requiredBillAccrualCents)}.
        </Text>
        <Text style={styles.explainMeta}>
          Observed work rate: {(summary.observedWorkRate * 100).toFixed(0)}% of
          calendar days
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  lead: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: colors.woodland,
    marginBottom: spacing.md,
  },
  explain: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explainTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  explainBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  explainMeta: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 12,
  },
});
