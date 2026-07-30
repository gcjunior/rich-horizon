import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { formatCAD } from '../utils/money';
import type { GoalProgress } from '../domain/types';

interface Props {
  goal: GoalProgress;
  accent?: 'green' | 'gold';
}

export function GoalProgressCard({ goal, accent = 'green' }: Props) {
  const barColor = accent === 'gold' ? colors.gold : colors.apple;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{goal.title}</Text>
      <Text style={styles.subtitle}>{goal.subtitle}</Text>

      <View style={styles.metrics}>
        <View>
          <Text style={styles.metricLabel}>Target</Text>
          <Text style={styles.metricValue}>{formatCAD(goal.targetCents)}</Text>
        </View>
        <View>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={styles.metricValue}>{formatCAD(goal.currentCents)}</Text>
        </View>
        <View>
          <Text style={styles.metricLabel}>Left</Text>
          <Text style={styles.metricValue}>{formatCAD(goal.remainingCents)}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${goal.percentComplete}%`, backgroundColor: barColor }]}
        />
      </View>
      <Text style={styles.percent}>{goal.percentComplete}% complete</Text>

      {goal.estimatedDaysRemaining !== null && goal.remainingCents > 0 && (
        <Text style={styles.eta}>
          About {goal.estimatedDaysRemaining} earning days remaining
        </Text>
      )}
      {goal.suggestedTodayCents > 0 && (
        <Text style={styles.suggest}>
          Suggested allocation today: {formatCAD(goal.suggestedTodayCents)}
        </Text>
      )}
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.woodland,
  },
  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  track: {
    height: 12,
    backgroundColor: colors.softGreen,
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: 12,
    borderRadius: 99,
  },
  percent: {
    marginTop: 8,
    fontWeight: '700',
    color: colors.woodland,
    fontSize: 14,
  },
  eta: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13,
  },
  suggest: {
    marginTop: 8,
    color: colors.apple,
    fontWeight: '600',
    fontSize: 13,
  },
});
