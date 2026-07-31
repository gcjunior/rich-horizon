import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import {
  calculatePlanWarnings,
  generateAllocationDraft,
} from '../../src/domain/allocationEngine';
import type { AllocationDraftItem } from '../../src/domain/financeTypes';
import {
  draftTotals,
  itemKey,
  useFinanceStore,
} from '../../src/store/financeStore';
import { colors, radii, spacing } from '../../src/theme/colors';
import { parseMoneyInput } from '../../src/utils/labels';
import { dollarsToCents, formatCAD } from '../../src/utils/money';

const GROUP_ORDER = ['required', 'essential', 'goals', 'optional', 'safe_to_spend'] as const;

export default function AllocationReviewScreen() {
  const { incomeEntryId } = useLocalSearchParams<{ incomeEntryId: string }>();
  const draft = useFinanceStore((s) => s.currentDraft);
  const incomeEntry = useFinanceStore((s) =>
    s.incomeEntries.find((e) => e.id === incomeEntryId),
  );
  const incomeSources = useFinanceStore((s) => s.incomeSources);
  const expenses = useFinanceStore((s) => s.expenses);
  const goals = useFinanceStore((s) => s.goals);
  const buckets = useFinanceStore((s) => s.buckets);
  const setDraft = useFinanceStore((s) => s.setCurrentDraft);
  const adjustDraftItem = useFinanceStore((s) => s.adjustDraftItem);
  const restoreDraft = useFinanceStore((s) => s.restoreDraft);
  const confirmDraft = useFinanceStore((s) => s.confirmDraft);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!incomeEntry || incomeEntry.allocated) return;
    if (draft && draft.incomeEntryId === incomeEntryId) return;
    setDraft(
      generateAllocationDraft({
        incomeEntry,
        sources: incomeSources,
        expenses,
        goals,
        buckets,
      }),
    );
  }, [
    incomeEntry,
    incomeEntryId,
    draft,
    incomeSources,
    expenses,
    goals,
    buckets,
    setDraft,
  ]);

  if (!incomeEntry) {
    return <Redirect href="/(tabs)/today" />;
  }
  if (incomeEntry.allocated) {
    return <Redirect href="/(tabs)/today" />;
  }
  if (!draft || draft.incomeEntryId !== incomeEntryId) {
    return (
      <View style={styles.content}>
        <Text style={styles.kicker}>Preparing allocation…</Text>
      </View>
    );
  }

  const totals = useMemo(() => draftTotals(draft), [draft]);
  const warnings = useMemo(() => calculatePlanWarnings(draft), [draft]);

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: draft.items.filter((i) => i.group === group),
  })).filter((g) => g.items.length > 0);

  const onConfirm = () => {
    const result = confirmDraft();
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    router.replace('/(tabs)/today');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Income received</Text>
      <Text style={styles.income}>{formatCAD(draft.totalIncomeCents)}</Text>

      {grouped.map(({ group, items }) => (
        <View key={group} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {group === 'safe_to_spend'
              ? 'Safe to spend'
              : group.charAt(0).toUpperCase() + group.slice(1)}
          </Text>
          {items.map((item) => (
            <AllocationRow
              key={itemKey(item)}
              item={item}
              expanded={expanded === itemKey(item)}
              editing={editing && item.targetType !== 'safe_to_spend'}
              onToggle={() =>
                setExpanded((prev) => (prev === itemKey(item) ? null : itemKey(item)))
              }
              onChange={(cents) => adjustDraftItem(itemKey(item), cents)}
            />
          ))}
        </View>
      ))}

      <View style={styles.summary}>
        <Text style={styles.summaryLine}>
          Total allocated: {formatCAD(totals.totalAllocatedCents)}
        </Text>
        <Text style={styles.summaryLine}>
          Safe to spend: {formatCAD(totals.safeToSpendCents)}
        </Text>
        <Text style={styles.summaryLine}>
          Remaining unallocated: {formatCAD(totals.unallocatedCents)}
        </Text>
      </View>

      {warnings.map((w) => (
        <View key={w.id} style={styles.warn}>
          <Text style={styles.warnTitle}>{w.title}</Text>
          <Text style={styles.warnDetail}>{w.detail}</Text>
        </View>
      ))}

      {message ? <Text style={styles.error}>{message}</Text> : null}

      <PrimaryButton
        label={editing ? 'Done adjusting' : 'Adjust'}
        variant="secondary"
        onPress={() => setEditing((v) => !v)}
        style={{ marginBottom: spacing.sm }}
      />
      <PrimaryButton
        label="Restore recommendation"
        variant="secondary"
        onPress={restoreDraft}
        style={{ marginBottom: spacing.sm }}
      />
      <PrimaryButton label="Confirm allocation" onPress={onConfirm} />
    </ScrollView>
  );
}

function AllocationRow({
  item,
  expanded,
  editing,
  onToggle,
  onChange,
}: {
  item: AllocationDraftItem;
  expanded: boolean;
  editing: boolean;
  onToggle: () => void;
  onChange: (cents: number) => void;
}) {
  const [text, setText] = useState(String(item.adjustedAmountCents / 100));

  useEffect(() => {
    setText(String(item.adjustedAmountCents / 100));
  }, [item.adjustedAmountCents]);

  return (
    <View style={styles.row}>
      <Pressable onPress={onToggle} style={styles.rowMain}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        {!editing ? (
          <Text style={styles.rowAmount}>{formatCAD(item.adjustedAmountCents)}</Text>
        ) : null}
      </Pressable>
      {editing ? (
        <TextInput
          style={styles.input}
          value={text}
          keyboardType="decimal-pad"
          onChangeText={setText}
          onBlur={() => onChange(dollarsToCents(parseMoneyInput(text)))}
        />
      ) : null}
      {expanded ? <Text style={styles.explain}>{item.explanation}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 48 },
  kicker: { color: colors.textSecondary, fontWeight: '700' },
  income: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.woodland,
    marginBottom: spacing.md,
  },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.woodland,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  rowLabel: { fontWeight: '700', color: colors.text, flex: 1, paddingRight: 8 },
  rowAmount: { fontWeight: '800', color: colors.woodland, fontSize: 16 },
  input: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  explain: {
    marginTop: 10,
    color: colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  summary: {
    backgroundColor: colors.softGreen,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryLine: {
    fontWeight: '700',
    color: colors.woodland,
    marginBottom: 4,
  },
  warn: {
    backgroundColor: colors.softGold,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  warnTitle: { fontWeight: '800', color: colors.warning, marginBottom: 4 },
  warnDetail: { color: colors.textSecondary, lineHeight: 20 },
  error: { color: colors.danger, fontWeight: '700', marginBottom: 8 },
});
