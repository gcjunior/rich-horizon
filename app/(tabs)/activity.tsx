import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import {
  selectSourceName,
  useFinanceStore,
} from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';

type Filter = 'all' | 'income' | 'spending' | 'allocations';

interface ActivityItem {
  id: string;
  kind: Filter;
  title: string;
  detail: string;
  amountCents: number;
  date: string;
}

export default function ActivityScreen() {
  const onboardingComplete = useFinanceStore((s) => s.onboardingComplete);
  const incomeEntries = useFinanceStore((s) => s.incomeEntries);
  const transactions = useFinanceStore((s) => s.transactions);
  const allocations = useFinanceStore((s) => s.allocations);
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    const list: ActivityItem[] = [];
    for (const entry of incomeEntries) {
      const sourceName = selectSourceName(useFinanceStore.getState(), entry.incomeSourceId);
      list.push({
        id: entry.id,
        kind: 'income',
        title: `Income · ${sourceName}`,
        detail: entry.allocated ? 'Allocated' : 'Awaiting allocation',
        amountCents: entry.amountCents,
        date: entry.receivedDate,
      });
    }
    for (const txn of transactions) {
      list.push({
        id: txn.id,
        kind: 'spending',
        title: txn.description,
        detail: txn.category,
        amountCents: -txn.amountCents,
        date: txn.transactionDate,
      });
    }
    for (const alloc of allocations) {
      list.push({
        id: alloc.id,
        kind: 'allocations',
        title: 'Confirmed allocation',
        detail: `Safe to spend ${formatCAD(alloc.safeToSpendCents)}`,
        amountCents: alloc.totalIncomeCents,
        date: alloc.createdAt.slice(0, 10),
      });
    }
    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [incomeEntries, transactions, allocations]);

  if (!onboardingComplete) {
    return <Redirect href="/" />;
  }

  const filtered =
    filter === 'all' ? items : items.filter((i) => i.kind === filter);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Activity</Text>
      <View style={styles.filters}>
        {(['all', 'income', 'spending', 'allocations'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title="No activity yet"
          detail="Record income, confirm allocations, or add spending to see history here."
        />
      ) : (
        filtered.map((item) => (
          <View key={`${item.kind}_${item.id}`} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.detail}>{item.detail}</Text>
            <View style={styles.row}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.amount}>{formatCAD(item.amountCents)}</Text>
            </View>
          </View>
        ))
      )}
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
    marginBottom: spacing.sm,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.apple,
    backgroundColor: colors.softGreen,
  },
  chipText: { color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.woodland },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '800', color: colors.text, fontSize: 16 },
  detail: { color: colors.textSecondary, marginTop: 4 },
  row: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: { color: colors.muted },
  amount: { fontWeight: '800', color: colors.woodland },
});
