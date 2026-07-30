import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { formatCAD } from '../utils/money';
import type { AllocationLine } from '../domain/types';

interface Props {
  lines: AllocationLine[];
}

const KIND_COLOR: Record<AllocationLine['kind'], string> = {
  bills: colors.woodland,
  buffer: colors.apple,
  goal: colors.gold,
  spend: '#6B8F71',
};

export function AllocationWaterfall({ lines }: Props) {
  const total = lines.reduce((s, l) => s + l.amountCents, 0) || 1;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today’s allocation</Text>
      {lines.map((line) => {
        const width = Math.max(4, Math.round((line.amountCents / total) * 100));
        return (
          <View key={line.label} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.label}>{line.label}</Text>
              <Text style={styles.amount}>{formatCAD(line.amountCents)}</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${width}%`, backgroundColor: KIND_COLOR[line.kind] },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    marginBottom: spacing.sm + 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
    paddingRight: 8,
  },
  amount: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  track: {
    height: 8,
    backgroundColor: colors.softGreen,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 99,
  },
});
