import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme/colors';

interface Props {
  percent: number;
  tone?: 'ok' | 'warn';
}

export function ProgressBar({ percent, tone = 'ok' }: Props) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${width}%` },
          tone === 'warn' ? styles.warn : styles.ok,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
  },
  ok: { backgroundColor: colors.apple },
  warn: { backgroundColor: colors.warning },
});
