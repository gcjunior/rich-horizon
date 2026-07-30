import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppStore } from '../../src/store/appStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { formatCAD } from '../../src/utils/money';

export default function InsightsScreen() {
  const loaded = useAppStore((s) => s.loaded);
  const summary = useAppStore((s) => s.summary);

  if (!loaded || !summary) return <Redirect href="/" />;

  const { spending } = summary;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Flexible spending this month</Text>
      <Text style={styles.sub}>
        Non-essential purchases only — essentials and remittances stay protected.
      </Text>

      <View style={styles.card}>
        {spending.topCategories.length === 0 ? (
          <Text style={styles.empty}>No discretionary spend found in the recent window.</Text>
        ) : (
          spending.topCategories.map((c) => (
            <View key={c.category} style={styles.row}>
              <Text style={styles.cat}>{c.category}</Text>
              <Text style={styles.amt}>{formatCAD(c.totalCents)}</Text>
            </View>
          ))
        )}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total flexible</Text>
          <Text style={styles.totalAmt}>{formatCAD(spending.totalDiscretionaryCents)}</Text>
        </View>
      </View>

      {spending.tradeOff && (
        <View style={styles.trade}>
          <Text style={styles.tradeEyebrow}>Trade-off idea</Text>
          <Text style={styles.tradeBody}>{spending.tradeOff}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.woodland,
  },
  sub: {
    marginTop: 6,
    marginBottom: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cat: { color: colors.textSecondary, fontSize: 15 },
  amt: { color: colors.text, fontWeight: '700', fontSize: 15 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: { fontWeight: '700', color: colors.text },
  totalAmt: { fontWeight: '800', color: colors.woodland },
  empty: { color: colors.muted },
  trade: {
    backgroundColor: colors.softGold,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  tradeEyebrow: {
    color: '#7A5A00',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  tradeBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});
