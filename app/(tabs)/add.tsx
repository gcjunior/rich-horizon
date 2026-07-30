import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useFinanceStore } from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';

const ACTIONS = [
  { label: 'Income received', href: '/income/received' as const },
  { label: 'Income source', href: '/income/source' as const },
  { label: 'Expense', href: '/expense/form' as const },
  { label: 'Transaction', href: '/transaction/form' as const },
  { label: 'Goal', href: '/goal/form' as const },
];

export default function AddScreen() {
  const onboardingComplete = useFinanceStore((s) => s.onboardingComplete);
  if (!onboardingComplete) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add</Text>
      <Text style={styles.sub}>Choose what you want to add to your plan.</Text>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.label}
          style={styles.card}
          onPress={() => router.push(action.href)}
        >
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
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
  sub: { color: colors.textSecondary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    justifyContent: 'center',
  },
  label: { fontSize: 17, fontWeight: '800', color: colors.woodland },
});
