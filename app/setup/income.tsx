import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SetupProgress } from '../../src/components/SetupProgress';
import { useFinanceStore } from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { frequencyLabel } from '../../src/utils/labels';
import { formatCAD } from '../../src/utils/money';
import { formatMonthDay, parseISODate } from '../../src/utils/dates';

export default function SetupIncomeScreen() {
  const incomeSources = useFinanceStore((s) => s.incomeSources);
  const deleteIncomeSource = useFinanceStore((s) => s.deleteIncomeSource);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <SetupProgress current={0} />
      <Text style={styles.heading}>Add income sources</Text>
      <Text style={styles.sub}>
        Tell Rich Horizon how money arrives so each payment can get a purpose.
      </Text>

      {incomeSources.length === 0 ? (
        <EmptyState
          title="No income sources yet"
          detail="Add your main job, side gigs, or irregular work so allocation can begin."
        />
      ) : (
        incomeSources.map((source) => (
          <View key={source.id} style={styles.card}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/income/source', params: { id: source.id } })
              }
            >
              <Text style={styles.name}>{source.name}</Text>
              <Text style={styles.meta}>
                {formatCAD(source.expectedAmountCents)} · {frequencyLabel(source.frequency)}
              </Text>
              {source.nextPaymentDate ? (
                <Text style={styles.meta}>
                  Next payment: {formatMonthDay(parseISODate(source.nextPaymentDate))}
                </Text>
              ) : null}
              <Text style={styles.badge}>
                {source.isVariable ? 'Variable' : 'Fixed'}
              </Text>
            </Pressable>
            <Pressable onPress={() => deleteIncomeSource(source.id)} style={styles.delete}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}

      <PrimaryButton
        label="Add income source"
        variant="secondary"
        onPress={() => router.push('/income/source')}
        style={{ marginBottom: spacing.sm }}
      />
      <PrimaryButton
        label="Continue"
        onPress={() => router.push('/setup/expenses')}
        disabled={incomeSources.length === 0}
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
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.text },
  meta: { color: colors.textSecondary, marginTop: 4, fontSize: 14 },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    color: colors.woodland,
    fontWeight: '700',
    fontSize: 12,
  },
  delete: { marginTop: 10, minHeight: 44, justifyContent: 'center' },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
