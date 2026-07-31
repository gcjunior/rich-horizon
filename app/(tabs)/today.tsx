import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import {
  calculateSafeToSpend,
  requiredFundingPercent,
} from '../../src/domain/allocationEngine';
import { ProgressBar } from '../../src/components/ProgressBar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SafeToSpendCard } from '../../src/components/SafeToSpendCard';
import {
  selectNextPriority,
  selectSourceName,
  useFinanceStore,
} from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';
import { formatMonthDay, parseISODate } from '../../src/utils/dates';

export default function TodayScreen() {
  const onboardingComplete = useFinanceStore((s) => s.onboardingComplete);
  const allocations = useFinanceStore((s) => s.allocations);
  const transactions = useFinanceStore((s) => s.transactions);
  const buckets = useFinanceStore((s) => s.buckets);
  const expenses = useFinanceStore((s) => s.expenses);
  const incomeEntries = useFinanceStore((s) => s.incomeEntries);
  const incomeSources = useFinanceStore((s) => s.incomeSources);
  const lastConfirmMessage = useFinanceStore((s) => s.lastConfirmMessage);
  const clearConfirmMessage = useFinanceStore((s) => s.clearConfirmMessage);

  const latest = incomeEntries[0] ?? null;
  const sourceName = latest
    ? selectSourceName(useFinanceStore.getState(), latest.incomeSourceId)
    : '';
  const nextPriority = useMemo(
    () => selectNextPriority(useFinanceStore.getState()),
    [expenses, buckets, incomeSources],
  );

  const flexible = transactions
    .filter((t) => !t.expenseId)
    .reduce((sum, t) => sum + t.amountCents, 0);
  const safeToSpendCents = calculateSafeToSpend(allocations, flexible);
  const requiredPct = requiredFundingPercent(expenses, buckets);

  useEffect(() => {
    if (!lastConfirmMessage) return;
    const t = setTimeout(() => clearConfirmMessage(), 4000);
    return () => clearTimeout(t);
  }, [lastConfirmMessage, clearConfirmMessage]);

  if (!onboardingComplete) {
    return <Redirect href="/" />;
  }

  const billsBehind = requiredPct < 100 && expenses.some((e) => e.priority === 'required');
  const fundingGap =
    safeToSpendCents === 0 && billsBehind ? Math.max(0, 100 - requiredPct) * 100 : 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {lastConfirmMessage ? (
        <View style={styles.success}>
          <Text style={styles.successText}>{lastConfirmMessage}</Text>
        </View>
      ) : null}

      <SafeToSpendCard
        safeToSpendCents={safeToSpendCents}
        fundingGapCents={fundingGap}
        onTrackCopy={
          safeToSpendCents > 0
            ? 'Your protected expenses remain on track.'
            : 'Required expenses need attention before flexible spending.'
        }
      />

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Next priority</Text>
        <Text style={styles.cardTitle}>{nextPriority.title}</Text>
        <Text style={styles.cardDetail}>{nextPriority.detail}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Latest income</Text>
        {latest ? (
          <>
            <Text style={styles.amount}>{formatCAD(latest.amountCents)}</Text>
            <Text style={styles.cardDetail}>
              {sourceName} · {formatMonthDay(parseISODate(latest.receivedDate))}
            </Text>
            <Text style={styles.badge}>
              {latest.allocated ? 'Allocated' : 'Needs allocation'}
            </Text>
            {!latest.allocated ? (
              <Pressable
                style={styles.link}
                onPress={() =>
                  router.push({
                    pathname: '/allocation/[incomeEntryId]',
                    params: { incomeEntryId: latest.id },
                  })
                }
              >
                <Text style={styles.linkText}>Review allocation →</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text style={styles.cardDetail}>No income history yet. Record a payment to start.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Required expense funding</Text>
        <Text style={styles.amount}>{requiredPct}%</Text>
        <ProgressBar percent={requiredPct} tone={requiredPct < 70 ? 'warn' : 'ok'} />
      </View>

      <PrimaryButton
        label="Add income received"
        onPress={() => router.push('/income/received')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 48 },
  success: {
    backgroundColor: colors.softGreen,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successText: { color: colors.woodland, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEyebrow: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.woodland,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 4,
  },
  cardDetail: { color: colors.textSecondary, lineHeight: 20 },
  amount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.woodland,
    marginBottom: 8,
  },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    color: colors.apple,
    fontWeight: '800',
  },
  link: { marginTop: 10, minHeight: 44, justifyContent: 'center' },
  linkText: { color: colors.woodland, fontWeight: '800' },
});
