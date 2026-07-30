import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { GoalProgressCard } from '../../src/components/GoalProgressCard';
import { useAppStore } from '../../src/store/appStore';
import { colors, radii, spacing } from '../../src/theme/colors';

export default function GoalsScreen() {
  const loaded = useAppStore((s) => s.loaded);
  const summary = useAppStore((s) => s.summary);
  const goalCompleted = useAppStore((s) => s.goalCompleted);
  const simulateGoalCompletion = useAppStore((s) => s.simulateGoalCompletion);

  if (!loaded || !summary) return <Redirect href="/" />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <GoalProgressCard goal={summary.firstHorizon} accent="green" />
      <GoalProgressCard goal={summary.investmentGoal} accent="gold" />

      <Pressable
        style={[styles.demoBtn, goalCompleted && styles.demoBtnDone]}
        onPress={simulateGoalCompletion}
      >
        <Text style={styles.demoBtnText}>
          {goalCompleted ? 'First Horizon completed' : 'Simulate goal completion'}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        Demo control — triggers the Million-Dollar Face celebration once per load.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  demoBtn: {
    backgroundColor: colors.woodland,
    borderRadius: radii.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  demoBtnDone: {
    backgroundColor: colors.apple,
  },
  demoBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  hint: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
  },
});
