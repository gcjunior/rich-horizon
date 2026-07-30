import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createId, validateIncomeSource } from '../../src/domain/allocationEngine';
import type { IncomeFrequency, IncomeSource } from '../../src/domain/financeTypes';
import { ChipSelect, SwitchField, TextField } from '../../src/components/FormField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useFinanceStore, todayIso } from '../../src/store/financeStore';
import { colors, spacing } from '../../src/theme/colors';
import { INCOME_FREQUENCY_OPTIONS, parseMoneyInput } from '../../src/utils/labels';
import { dollarsToCents } from '../../src/utils/money';

export default function IncomeSourceFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useFinanceStore((s) => s.incomeSources.find((x) => x.id === id));
  const upsertIncomeSource = useFinanceStore((s) => s.upsertIncomeSource);

  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(
    existing ? String(existing.expectedAmountCents / 100) : '',
  );
  const [frequency, setFrequency] = useState<IncomeFrequency>(
    existing?.frequency ?? 'biweekly',
  );
  const [nextPaymentDate, setNextPaymentDate] = useState(
    existing?.nextPaymentDate ?? todayIso(),
  );
  const [isVariable, setIsVariable] = useState(existing?.isVariable ?? false);
  const [taxesDeducted, setTaxesDeducted] = useState(existing?.taxesDeducted ?? true);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [minimum, setMinimum] = useState(
    existing?.minimumAmountCents != null ? String(existing.minimumAmountCents / 100) : '',
  );
  const [typical, setTypical] = useState(
    existing?.typicalAmountCents != null ? String(existing.typicalAmountCents / 100) : '',
  );
  const [maximum, setMaximum] = useState(
    existing?.maximumAmountCents != null ? String(existing.maximumAmountCents / 100) : '',
  );
  const [workdays, setWorkdays] = useState(
    existing?.expectedWorkdaysPerWeek != null
      ? String(existing.expectedWorkdaysPerWeek)
      : '5',
  );
  const [errors, setErrors] = useState<string[]>([]);

  const amountError = useMemo(() => {
    const cents = dollarsToCents(parseMoneyInput(amount));
    return cents <= 0 && amount.length > 0 ? 'Amount must be greater than zero.' : undefined;
  }, [amount]);

  const onSave = () => {
    const expectedAmountCents = dollarsToCents(parseMoneyInput(amount));
    const payload = {
      name,
      expectedAmountCents,
      isVariable,
      minimumAmountCents: isVariable ? dollarsToCents(parseMoneyInput(minimum)) : undefined,
      typicalAmountCents: isVariable ? dollarsToCents(parseMoneyInput(typical)) : undefined,
      maximumAmountCents: isVariable ? dollarsToCents(parseMoneyInput(maximum)) : undefined,
      expectedWorkdaysPerWeek: isVariable
        ? Number.parseInt(workdays || '0', 10)
        : undefined,
    };
    const nextErrors = validateIncomeSource(payload);
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    const source: IncomeSource = {
      id: existing?.id ?? createId('inc'),
      name: name.trim(),
      expectedAmountCents,
      frequency,
      nextPaymentDate: nextPaymentDate || undefined,
      isVariable,
      minimumAmountCents: payload.minimumAmountCents,
      typicalAmountCents: payload.typicalAmountCents,
      maximumAmountCents: payload.maximumAmountCents,
      expectedWorkdaysPerWeek: payload.expectedWorkdaysPerWeek,
      taxesDeducted,
      isActive,
      source: existing?.source ?? 'manual',
    };
    upsertIncomeSource(source);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Income name" value={name} onChangeText={setName} placeholder="Main job" />
        <TextField
          label="Expected amount (CAD)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="1800"
          error={amountError}
        />
        <ChipSelect
          label="Frequency"
          options={INCOME_FREQUENCY_OPTIONS}
          value={frequency}
          onChange={setFrequency}
        />
        <TextField
          label="Next payment date (YYYY-MM-DD)"
          value={nextPaymentDate}
          onChangeText={setNextPaymentDate}
          placeholder="2026-08-07"
        />
        <SwitchField
          label="Variable amount"
          value={isVariable}
          onValueChange={setIsVariable}
          help="Rich Horizon uses a conservative estimate when calculating safe to spend."
        />
        {isVariable ? (
          <View>
            <TextField
              label="Minimum expected amount"
              value={minimum}
              onChangeText={setMinimum}
              keyboardType="decimal-pad"
            />
            <TextField
              label="Typical expected amount"
              value={typical}
              onChangeText={setTypical}
              keyboardType="decimal-pad"
            />
            <TextField
              label="Maximum expected amount"
              value={maximum}
              onChangeText={setMaximum}
              keyboardType="decimal-pad"
            />
            <TextField
              label="Expected workdays per week"
              value={workdays}
              onChangeText={setWorkdays}
              keyboardType="number-pad"
            />
            <Text style={styles.help}>
              Rich Horizon uses a conservative estimate when calculating safe to spend.
            </Text>
          </View>
        ) : null}
        <SwitchField
          label="Taxes already deducted"
          value={taxesDeducted}
          onValueChange={setTaxesDeducted}
        />
        <SwitchField label="Active" value={isActive} onValueChange={setIsActive} />

        {errors.map((e) => (
          <Text key={e} style={styles.error}>
            {e}
          </Text>
        ))}

        <PrimaryButton label="Save income source" onPress={onSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 48 },
  help: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  error: {
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 6,
  },
});
