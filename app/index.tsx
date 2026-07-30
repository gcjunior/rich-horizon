import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../src/theme/colors';
import { useAppStore } from '../src/store/appStore';
import type { WorkerId } from '../src/domain/types';

const WORKER_OPTIONS: { id: WorkerId; title: string; subtitle: string }[] = [
  {
    id: 'W-0001',
    title: 'Moving helper · Calgary',
    subtitle: 'Surplus path — room for goals',
  },
  {
    id: 'W-0202',
    title: 'Cleaning · constrained',
    subtitle: 'Tight cashflow — funding gap demo',
  },
];

export default function WelcomeScreen() {
  const loading = useAppStore((s) => s.loading);
  const loadDemo = useAppStore((s) => s.loadDemo);
  const [selected, setSelected] = useState<WorkerId>('W-0001');

  const onLoad = async () => {
    await loadDemo(selected);
    router.replace('/(tabs)/today');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>RICH HORIZON</Text>
        </View>
        <Text style={styles.title}>Rich Horizon</Text>
        <Text style={styles.tagline}>
          Every dollar gets a purpose{'\n'}before it is spent.
        </Text>
        <Text style={styles.problem}>
          Daily earners are paid in drips. Their bills arrive in cliffs.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Demo worker</Text>
        {WORKER_OPTIONS.map((w) => {
          const active = selected === w.id;
          return (
            <Pressable
              key={w.id}
              onPress={() => setSelected(w.id)}
              style={[styles.workerChip, active && styles.workerChipActive]}
            >
              <Text style={[styles.workerTitle, active && styles.workerTitleActive]}>
                {w.title}
              </Text>
              <Text style={[styles.workerSub, active && styles.workerSubActive]}>
                {w.subtitle}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.cta, loading && styles.ctaDisabled]}
          onPress={onLoad}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.ctaText}>Preparing your Rich Horizon…</Text>
            </View>
          ) : (
            <Text style={styles.ctaText}>Load Demo Financial Data</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.woodland,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.2,
  },
  title: {
    color: colors.white,
    fontSize: 44,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  tagline: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  problem: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  panelLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 13,
  },
  workerChip: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  workerChipActive: {
    borderColor: colors.apple,
    backgroundColor: colors.softGreen,
  },
  workerTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  workerTitleActive: {
    color: colors.woodland,
  },
  workerSub: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 13,
  },
  workerSubActive: {
    color: colors.textSecondary,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.apple,
    borderRadius: radii.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.85,
  },
  ctaText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
