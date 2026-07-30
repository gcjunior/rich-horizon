import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeToSpendCard } from '../../src/components/SafeToSpendCard';
import { AllocationWaterfall } from '../../src/components/AllocationWaterfall';
import { useAppStore } from '../../src/store/appStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';

export default function TodayScreen() {
  const loaded = useAppStore((s) => s.loaded);
  const summary = useAppStore((s) => s.summary);
  const workerId = useAppStore((s) => s.workerId);
  const switchWorker = useAppStore((s) => s.switchWorker);

  useEffect(() => {
    // no-op: celebration handled globally
  }, []);

  if (!loaded || !summary) {
    return <Redirect href="/" />;
  }

  const otherWorker = workerId === 'W-0001' ? 'W-0202' : 'W-0001';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>{summary.worker.occupation}</Text>
          <Text style={styles.asOf}>As of {summary.asOfDate}</Text>
        </View>
        <Pressable
          style={styles.switchBtn}
          onPress={() => switchWorker(otherWorker)}
        >
          <Text style={styles.switchText}>Switch worker</Text>
        </Pressable>
      </View>

      <SafeToSpendCard
        safeToSpendCents={summary.safeToSpendCents}
        fundingGapCents={summary.fundingGapCents}
      />

      <View style={styles.incomeCard}>
        <Text style={styles.incomeLabel}>Today’s income</Text>
        <Text style={styles.incomeValue}>{formatCAD(summary.todayIncomeCents)}</Text>
        <Text style={styles.incomeHint}>
          Income floor (25th pct): {formatCAD(summary.incomeFloorCents)}
        </Text>
      </View>

      <AllocationWaterfall lines={summary.allocation} />

      <View style={styles.actionCard}>
        <Text style={styles.actionEyebrow}>Next best action</Text>
        <Text style={styles.actionTitle}>{summary.nextBestAction.title}</Text>
        <Text style={styles.actionDetail}>{summary.nextBestAction.detail}</Text>
      </View>

      <Pressable style={styles.linkCard} onPress={() => router.push('/(tabs)/plan')}>
        <Text style={styles.linkTitle}>See your bill cliff →</Text>
        <Text style={styles.linkSub}>
          {summary.billCliff.dueDateLabel} · {formatCAD(summary.billCliff.totalCents)}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  kicker: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.woodland,
  },
  asOf: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  switchBtn: {
    backgroundColor: colors.white,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchText: {
    color: colors.woodland,
    fontWeight: '700',
    fontSize: 12,
  },
  incomeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  incomeLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  incomeValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  incomeHint: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
  },
  actionCard: {
    backgroundColor: colors.softGreen,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  actionEyebrow: {
    color: colors.apple,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  actionTitle: {
    color: colors.woodland,
    fontWeight: '800',
    fontSize: 17,
    marginBottom: 6,
  },
  actionDetail: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  linkCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkTitle: {
    color: colors.woodland,
    fontWeight: '800',
    fontSize: 16,
  },
  linkSub: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
