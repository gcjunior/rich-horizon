import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SetupProgress } from '../../src/components/SetupProgress';
import type { ExpensePriority } from '../../src/domain/financeTypes';
import { useFinanceStore } from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { frequencyLabel } from '../../src/utils/labels';
import { formatCAD } from '../../src/utils/money';
import { formatMonthDay, parseISODate } from '../../src/utils/dates';

const GROUPS: ExpensePriority[] = ['required', 'essential', 'optional'];

export default function SetupExpensesScreen() {
  const expenses = useFinanceStore((s) => s.expenses);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <SetupProgress current={1} />
      <Text style={styles.heading}>Add expenses</Text>
      <Text style={styles.sub}>
        Add bills and regular spending so Rich Horizon knows what your income needs to protect.
      </Text>

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          detail="Add bills and regular spending so Rich Horizon knows what your income needs to protect."
        />
      ) : (
        GROUPS.map((priority) => {
          const items = expenses.filter((e) => e.priority === priority);
          if (items.length === 0) return null;
          return (
            <View key={priority} style={styles.group}>
              <Text style={styles.groupTitle}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
              {items.map((expense) => (
                <View key={expense.id} style={styles.card}>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/expense/form', params: { id: expense.id } })
                    }
                  >
                    <Text style={styles.name}>{expense.name}</Text>
                    <Text style={styles.meta}>
                      {formatCAD(expense.amountCents)} · {frequencyLabel(expense.frequency)}
                    </Text>
                    {expense.nextDueDate ? (
                      <Text style={styles.meta}>
                        Due: {formatMonthDay(parseISODate(expense.nextDueDate))}
                      </Text>
                    ) : null}
                    <Text style={styles.badge}>{priority}</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteExpense(expense.id)} style={styles.delete}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          );
        })
      )}

      <PrimaryButton
        label="Add expense"
        variant="secondary"
        onPress={() => router.push('/expense/form')}
        style={{ marginBottom: spacing.sm }}
      />
      <PrimaryButton
        label="Continue"
        onPress={() => router.push('/setup/goals')}
        disabled={expenses.length === 0}
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
  group: { marginBottom: spacing.md },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.woodland,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
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
    textTransform: 'capitalize',
  },
  delete: { marginTop: 10, minHeight: 44, justifyContent: 'center' },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
