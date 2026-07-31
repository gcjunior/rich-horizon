import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createId } from '../../src/domain/allocationEngine';
import type { ContributionMethod, Goal, GoalType } from '../../src/domain/financeTypes';
import { ChipSelect, SwitchField, TextField } from '../../src/components/FormField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useFinanceStore } from '../../src/store/financeStore';
import { colors, spacing } from '../../src/theme/colors';
import { GOAL_TYPE_OPTIONS, parseMoneyInput } from '../../src/utils/labels';
import { dollarsToCents } from '../../src/utils/money';

const CONTRIBUTION_OPTIONS: { value: ContributionMethod; label: string }[] = [
  { value: 'fixed_amount', label: 'Fixed amount' },
  { value: 'percentage', label: 'Percentage of remaining' },
  { value: 'remainder', label: 'Remainder' },
];

export default function GoalFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useFinanceStore((s) => s.goals.find((x) => x.id === id));
  const upsertGoal = useFinanceStore((s) => s.upsertGoal);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<GoalType>(existing?.type ?? 'emergency');
  const [target, setTarget] = useState(
    existing ? String(existing.targetAmountCents / 100) : '',
  );
  const [funded, setFunded] = useState(
    existing ? String(existing.fundedAmountCents / 100) : '0',
  );
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? '');
  const [method, setMethod] = useState<ContributionMethod>(
    existing?.contributionMethod ?? 'fixed_amount',
  );
  const [contributionValue, setContributionValue] = useState(
    existing ? String(existing.contributionValue) : '25',
  );
  const [pauseWhenBehind, setPauseWhenBehind] = useState(
    existing?.pauseWhenBillsBehind ?? true,
  );
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    const targetAmountCents = dollarsToCents(parseMoneyInput(target));
    const fundedAmountCents = dollarsToCents(parseMoneyInput(funded));
    if (targetAmountCents <= 0) {
      setError('Target amount must be greater than zero.');
      return;
    }
    if (fundedAmountCents < 0) {
      setError('Funded amount cannot be negative.');
      return;
    }

    const value =
      method === 'percentage'
        ? Number.parseFloat(contributionValue || '0')
        : method === 'fixed_amount'
          ? dollarsToCents(parseMoneyInput(contributionValue))
          : 0;

    const goal: Goal = {
      id: existing?.id ?? createId('goal'),
      name: name.trim(),
      type,
      targetAmountCents,
      fundedAmountCents,
      targetDate: targetDate || undefined,
      contributionMethod: method,
      contributionValue: value,
      priority: type === 'emergency' ? 1 : type === 'debt' ? 2 : 3,
      pauseWhenBillsBehind: pauseWhenBehind,
    };
    upsertGoal(goal);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Goal name" value={name} onChangeText={setName} />
        <ChipSelect label="Goal type" options={GOAL_TYPE_OPTIONS} value={type} onChange={setType} />
        <Text style={styles.hint}>
          Investment goals reserve money for future investing. No securities are recommended
          and no returns are promised.
        </Text>
        <TextField
          label="Target amount (CAD)"
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Current funded amount (CAD)"
          value={funded}
          onChangeText={setFunded}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Optional target date (YYYY-MM-DD)"
          value={targetDate}
          onChangeText={setTargetDate}
        />
        <ChipSelect
          label="Contribution method"
          options={CONTRIBUTION_OPTIONS}
          value={method}
          onChange={setMethod}
        />
        {method !== 'remainder' ? (
          <TextField
            label={
              method === 'percentage'
                ? 'Percentage of remaining income'
                : 'Fixed amount from each income (CAD)'
            }
            value={contributionValue}
            onChangeText={setContributionValue}
            keyboardType="decimal-pad"
          />
        ) : null}
        <SwitchField
          label="Pause when required bills are behind"
          value={pauseWhenBehind}
          onValueChange={setPauseWhenBehind}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Save goal" onPress={onSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 48 },
  hint: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
    fontSize: 13,
  },
  error: { color: colors.danger, fontWeight: '600', marginBottom: 8 },
});
