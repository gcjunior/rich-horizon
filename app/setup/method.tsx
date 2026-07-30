import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SetupProgress } from '../../src/components/SetupProgress';
import { useFinanceStore } from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';

export default function SetupMethodScreen() {
  const method = useFinanceStore((s) => s.allocationMethod);
  const setAllocationMethod = useFinanceStore((s) => s.setAllocationMethod);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <SetupProgress current={3} />
      <Text style={styles.heading}>Choose allocation method</Text>
      <Text style={styles.sub}>
        Recommended calculates how much each upcoming expense needs from this income.
      </Text>

      <Pressable
        style={[styles.card, method === 'recommended' && styles.cardActive]}
        onPress={() => setAllocationMethod('recommended')}
      >
        <Text style={styles.title}>Recommended</Text>
        <Text style={styles.detail}>
          Rich Horizon calculates how much each upcoming expense needs based on its
          amount, due date, frequency, current funding, and previous deficit.
        </Text>
      </Pressable>

      <Pressable
        style={[styles.card, method === 'custom' && styles.cardActive]}
        onPress={() => setAllocationMethod('custom')}
      >
        <Text style={styles.title}>Custom</Text>
        <Text style={styles.detail}>
          Start from the recommendation and adjust amounts on every income allocation.
        </Text>
      </Pressable>

      <PrimaryButton label="Continue" onPress={() => router.push('/setup/review')} />
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
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.apple,
    backgroundColor: colors.softGreen,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.woodland, marginBottom: 6 },
  detail: { color: colors.textSecondary, lineHeight: 20, fontSize: 14 },
});
