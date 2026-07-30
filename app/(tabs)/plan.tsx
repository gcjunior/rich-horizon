import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { ProgressBar } from '../../src/components/ProgressBar';
import {
  selectBillCliff,
  selectExpenseStatuses,
  useFinanceStore,
} from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';
import { formatMonthDay, parseISODate } from '../../src/utils/dates';

export default function PlanScreen() {
  const onboardingComplete = useFinanceStore((s) => s.onboardingComplete);
  const expenses = useFinanceStore((s) => s.expenses);
  const buckets = useFinanceStore((s) => s.buckets);
  const incomeSources = useFinanceStore((s) => s.incomeSources);
  const cliff = useMemo(
    () => selectBillCliff(useFinanceStore.getState()),
    [expenses, buckets, incomeSources],
  );
  const statuses = useMemo(
    () => selectExpenseStatuses(useFinanceStore.getState()),
    [expenses, buckets, incomeSources],
  );

  if (!onboardingComplete) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Next bill cliff</Text>
      {!cliff ? (
        <EmptyState
          title="No required bills yet"
          detail="Add required expenses to see where obligations cluster by due date."
        />
      ) : (
        <View style={styles.card}>
          <Text style={styles.date}>{cliff.dueDateLabel}</Text>
          {cliff.expenses.map((e) => (
            <View key={e.name} style={styles.row}>
              <Text style={styles.rowLabel}>{e.name}</Text>
              <Text style={styles.rowValue}>{formatCAD(e.amountCents)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total</Text>
            <Text style={styles.rowValue}>{formatCAD(cliff.totalCents)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Funded</Text>
            <Text style={styles.rowValue}>{formatCAD(cliff.fundedCents)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Still needed</Text>
            <Text style={styles.rowValue}>{formatCAD(cliff.remainingCents)}</Text>
          </View>
          <Text style={styles.hint}>
            About {cliff.equivalentPayments} income payment(s) or workday(s) before this cliff.
          </Text>
        </View>
      )}

      <Text style={styles.heading}>Expense funding</Text>
      {statuses.length === 0 ? (
        <EmptyState title="No expenses" detail="Add expenses during setup or from the Add tab." />
      ) : (
        statuses.map((status) => (
          <View key={status.expense.id} style={styles.card}>
            <Text style={styles.name}>{status.expense.name}</Text>
            <Text style={styles.meta}>
              {status.percentFunded}% funded · {status.expense.priority}
            </Text>
            <ProgressBar
              percent={status.percentFunded}
              tone={status.percentFunded < 70 ? 'warn' : 'ok'}
            />
            <Text style={styles.meta}>
              Funded {formatCAD(status.fundedAmountCents)} of{' '}
              {formatCAD(status.requiredAmountCents)}
            </Text>
            <Text style={styles.meta}>
              Remaining {formatCAD(status.remainingCents)}
              {status.dueDate
                ? ` · Due ${formatMonthDay(parseISODate(status.dueDate))}`
                : ''}
            </Text>
            <Text style={styles.meta}>
              From next income: {formatCAD(status.requiredFromNextIncomeCents)}
            </Text>
            {status.deficitCents > 0 ? (
              <Text style={styles.deficit}>
                Deficit carried forward: {formatCAD(status.deficitCents)}
              </Text>
            ) : null}
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.woodland,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  date: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.woodland,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowLabel: { color: colors.textSecondary },
  rowValue: { fontWeight: '700', color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  hint: { marginTop: 8, color: colors.muted, fontSize: 13 },
  name: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 4 },
  meta: { color: colors.textSecondary, marginTop: 6, fontSize: 13 },
  deficit: { marginTop: 8, color: colors.warning, fontWeight: '700' },
});
