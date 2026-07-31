import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  title: string;
  detail: string;
}

export function EmptyState({ title, detail }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.woodland,
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
