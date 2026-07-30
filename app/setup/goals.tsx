import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SetupProgress } from '../../src/components/SetupProgress';
import { useFinanceStore } from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { GOAL_TYPE_OPTIONS } from '../../src/utils/labels';
import { formatCAD } from '../../src/utils/money';

export default function SetupGoalsScreen() {
  const goals = useFinanceStore((s) => s.goals);
  const deleteGoal = useFinanceStore((s) => s.deleteGoal);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <SetupProgress current={2} />
      <Text style={styles.heading}>Add optional goals</Text>
      <Text style={styles.sub}>
        Goals are optional during setup. Required bills always stay higher priority.
      </Text>

      <View style={styles.typeRow}>
        {GOAL_TYPE_OPTIONS.map((t) => (
          <View key={t.value} style={styles.typeChip}>
            <Text style={styles.typeText}>{t.label}</Text>
          </View>
        ))}
      </View>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          detail="You can skip for now and add emergency, savings, or investment goals later."
        />
      ) : (
        goals.map((goal) => (
          <View key={goal.id} style={styles.card}>
            <Pressable
              onPress={() => router.push({ pathname: '/goal/form', params: { id: goal.id } })}
            >
              <Text style={styles.name}>{goal.name}</Text>
              <Text style={styles.meta}>
                Target {formatCAD(goal.targetAmountCents)} · Funded{' '}
                {formatCAD(goal.fundedAmountCents)}
              </Text>
            </Pressable>
            <Pressable onPress={() => deleteGoal(goal.id)} style={styles.delete}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}

      <PrimaryButton
        label="Add goal"
        variant="secondary"
        onPress={() => router.push('/goal/form')}
        style={{ marginBottom: spacing.sm }}
      />
      <PrimaryButton
        label="Continue"
        onPress={() => router.push('/setup/method')}
        style={{ marginBottom: spacing.sm }}
      />
      <PrimaryButton
        label="Skip for now"
        variant="secondary"
        onPress={() => router.push('/setup/method')}
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  typeChip: {
    backgroundColor: colors.softGreen,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeText: { color: colors.woodland, fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  meta: { color: colors.textSecondary, marginTop: 4, fontSize: 14 },
  delete: { marginTop: 10, minHeight: 44, justifyContent: 'center' },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
