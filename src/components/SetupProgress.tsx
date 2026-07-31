import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';

const STEPS = ['Income', 'Expenses', 'Goals', 'Review'] as const;

interface Props {
  current: 0 | 1 | 2 | 3;
}

export function SetupProgress({ current }: Props) {
  return (
    <View style={styles.row}>
      {STEPS.map((label, index) => {
        const active = index <= current;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            {index < STEPS.length - 1 ? <View style={styles.line} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: colors.apple,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  labelActive: {
    color: colors.woodland,
  },
  line: {
    width: 12,
    height: 2,
    backgroundColor: colors.border,
    marginRight: 8,
  },
});
