import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { formatCAD } from '../utils/money';
import type { BillCliff } from '../domain/types';

interface Props {
  cliff: BillCliff;
}

export function BillCliffCard({ cliff }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Your next bill cliff</Text>
      <Text style={styles.date}>{cliff.dueDateLabel}</Text>

      {cliff.bills.map((b) => (
        <View key={b.name} style={styles.billRow}>
          <Text style={styles.billName}>{b.name}</Text>
          <Text style={styles.billAmount}>{formatCAD(b.amountCents)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.billRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{formatCAD(cliff.totalCents)}</Text>
      </View>
      <View style={styles.billRow}>
        <Text style={styles.meta}>Funded</Text>
        <Text style={styles.metaValue}>{formatCAD(cliff.fundedCents)}</Text>
      </View>
      <View style={styles.billRow}>
        <Text style={styles.needed}>Still needed</Text>
        <Text style={styles.neededValue}>{formatCAD(cliff.remainingCents)}</Text>
      </View>

      <View style={styles.workdayPill}>
        <Text style={styles.workdayText}>
          Equivalent to {cliff.equivalentWorkdays.toFixed(1)} average workdays
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.apple,
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  date: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.woodland,
    marginBottom: spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billName: { color: colors.textSecondary, fontSize: 15 },
  billAmount: { color: colors.text, fontWeight: '600', fontSize: 15 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: { fontWeight: '700', color: colors.text, fontSize: 16 },
  totalAmount: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.textSecondary, fontSize: 15 },
  metaValue: { color: colors.apple, fontWeight: '700', fontSize: 15 },
  needed: { color: colors.text, fontWeight: '700', fontSize: 15 },
  neededValue: { color: colors.warning, fontWeight: '800', fontSize: 15 },
  workdayPill: {
    marginTop: spacing.md,
    backgroundColor: colors.softGold,
    borderRadius: radii.full,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  workdayText: {
    color: '#7A5A00',
    fontWeight: '700',
    fontSize: 13,
  },
});
