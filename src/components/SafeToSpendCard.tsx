import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { formatCAD, type Cents } from '../utils/money';

interface Props {
  safeToSpendCents: Cents;
  fundingGapCents: Cents;
  onTrackCopy?: string;
}

export function SafeToSpendCard({
  safeToSpendCents,
  fundingGapCents,
  onTrackCopy,
}: Props) {
  const shortfall = fundingGapCents > 0 || safeToSpendCents === 0;

  return (
    <View style={[styles.card, shortfall && safeToSpendCents === 0 ? styles.cardShortfall : styles.cardOk]}>
      <Text style={styles.label}>Safe to spend</Text>
      <Text style={styles.amount}>{formatCAD(Math.max(0, safeToSpendCents))}</Text>
      {safeToSpendCents === 0 ? (
        <Text style={styles.supportDanger}>
          {onTrackCopy ??
            'Required expenses need attention before flexible spending.'}
        </Text>
      ) : (
        <Text style={styles.support}>
          {onTrackCopy ?? 'Your protected expenses remain on track.'}
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
