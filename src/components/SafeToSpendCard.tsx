import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { formatCAD, type Cents } from '../utils/money';

interface Props {
  safeToSpendCents: Cents;
  fundingGapCents: Cents;
}

export function SafeToSpendCard({ safeToSpendCents, fundingGapCents }: Props) {
  const shortfall = fundingGapCents > 0;

  return (
    <View style={[styles.card, shortfall ? styles.cardShortfall : styles.cardOk]}>
      <Text style={styles.label}>Safe to spend today</Text>
      <Text style={styles.amount}>{formatCAD(safeToSpendCents)}</Text>
      {shortfall ? (
        <Text style={styles.supportDanger}>
          Current funding gap: {formatCAD(fundingGapCents)}
        </Text>
      ) : (
        <Text style={styles.support}>
          Your upcoming bills and protected goals remain funded.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardOk: {
    backgroundColor: colors.woodland,
  },
  cardShortfall: {
    backgroundColor: '#3A2A1A',
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  amount: {
    color: colors.white,
    fontSize: 48,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 10,
  },
  support: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 21,
  },
  supportDanger: {
    color: '#FFD7A8',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
});
