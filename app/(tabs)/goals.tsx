import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ProgressBar } from '../../src/components/ProgressBar';
import { useFinanceStore } from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';

export default function GoalsScreen() {
  const onboardingComplete = useFinanceStore((s) => s.onboardingComplete);
  const goals = useFinanceStore((s) => s.goals);

  if (!onboardingComplete) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Goals</Text>
      <Text style={styles.sub}>
        Required bills remain a higher priority than goals. Investment goals reserve money for
        future investing.
      </Text>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          detail="Add an emergency buffer, savings, or future investment goal when you are ready."
        />
      ) : (
        goals.map((goal) => {
          const remaining = Math.max(0, goal.targetAmountCents - goal.fundedAmountCents);
          const pct =
            goal.targetAmountCents > 0
              ? Math.min(
                  100,
                  Math.round((goal.fundedAmountCents / goal.targetAmountCents) * 100),
                )
              : 100;
          const complete = goal.fundedAmountCents >= goal.targetAmountCents;
          return (
            <View key={goal.id} style={styles.card}>
              <Text style={styles.name}>{goal.name}</Text>
              <Text style={styles.meta}>
                {goal.type} · {goal.contributionMethod.replace('_', ' ')}
              </Text>
              <Text style={styles.amount}>
                {formatCAD(goal.fundedAmountCents)} / {formatCAD(goal.targetAmountCents)}
              </Text>
              <ProgressBar percent={pct} />
              <Text style={styles.meta}>
                Remaining {formatCAD(remaining)} · {pct}%
              </Text>
              <Text style={styles.status}>
                {complete ? 'Completed' : 'In progress'}
                {goal.pauseWhenBillsBehind ? ' · Pauses when bills behind' : ''}
              </Text>
            </View>
          );
        })
      )}

      <PrimaryButton label="Add goal" onPress={() => router.push('/goal/form')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 48 },
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
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  meta: {
    color: colors.textSecondary,
    marginTop: 6,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  amount: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.woodland,
    marginVertical: 8,
  },
  status: {
    marginTop: 8,
    color: colors.apple,
    fontWeight: '700',
  },
});
