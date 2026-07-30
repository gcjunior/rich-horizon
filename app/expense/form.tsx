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
import type {
  Expense,
  ExpenseFrequency,
  ExpensePriority,
} from '../../src/domain/financeTypes';
import { ChipSelect, SwitchField, TextField } from '../../src/components/FormField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useFinanceStore, todayIso } from '../../src/store/financeStore';
import { colors, spacing } from '../../src/theme/colors';
import {
  EXPENSE_FREQUENCY_OPTIONS,
  PRIORITY_OPTIONS,
  parseMoneyInput,
} from '../../src/utils/labels';
import { dollarsToCents } from '../../src/utils/money';

type ReserveChoice = 'minimum' | 'typical' | 'maximum';

export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useFinanceStore((s) => s.expenses.find((x) => x.id === id));
  const upsertExpense = useFinanceStore((s) => s.upsertExpense);

  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(
    existing ? String(existing.amountCents / 100) : '',
  );
  const [frequency, setFrequency] = useState<ExpenseFrequency>(
    existing?.frequency ?? 'monthly',
  );
  const [nextDueDate, setNextDueDate] = useState(existing?.nextDueDate ?? todayIso());
  const [category, setCategory] = useState(existing?.category ?? '');
  const [priority, setPriority] = useState<ExpensePriority>(
    existing?.priority ?? 'required',
  );
  const [isVariable, setIsVariable] = useState(existing?.isVariable ?? false);
  const [isAutopay, setIsAutopay] = useState(existing?.isAutopay ?? false);
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
  const [reserve, setReserve] = useState<ReserveChoice>('typical');
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    let amountCents = dollarsToCents(parseMoneyInput(amount));
    if (isVariable) {
      const map: Record<ReserveChoice, number> = {
        minimum: dollarsToCents(parseMoneyInput(minimum)),
        typical: dollarsToCents(parseMoneyInput(typical)),
        maximum: dollarsToCents(parseMoneyInput(maximum)),
      };
      amountCents = map[reserve];
    }
    if (amountCents <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (
      (frequency === 'monthly' ||
        frequency === 'weekly' ||
        frequency === 'biweekly' ||
        frequency === 'semimonthly') &&
      priority === 'required' &&
      !nextDueDate
    ) {
      setError('Missing due date for a recurring required bill.');
      return;
    }

    const dueDay = nextDueDate ? Number.parseInt(nextDueDate.slice(8), 10) : undefined;
    const expense: Expense = {
      id: existing?.id ?? createId('exp'),
      name: name.trim(),
      category: category.trim() || 'General',
      amountCents,
      frequency,
      priority,
      nextDueDate: nextDueDate || undefined,
      dueDayOfMonth: dueDay,
      isVariable,
      minimumAmountCents: isVariable ? dollarsToCents(parseMoneyInput(minimum)) : undefined,
      typicalAmountCents: isVariable ? dollarsToCents(parseMoneyInput(typical)) : undefined,
      maximumAmountCents: isVariable ? dollarsToCents(parseMoneyInput(maximum)) : undefined,
      isAutopay,
      isActive,
      source: existing?.source ?? 'manual',
    };
    upsertExpense(expense);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Expense name" value={name} onChangeText={setName} placeholder="Rent" />
        <TextField
          label="Amount (CAD)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="1450"
        />
        <ChipSelect
          label="Frequency"
          options={EXPENSE_FREQUENCY_OPTIONS}
          value={frequency}
          onChange={setFrequency}
        />
        <TextField
          label="Next due date (YYYY-MM-DD)"
          value={nextDueDate}
          onChangeText={setNextDueDate}
        />
        <TextField
          label="Category"
          value={category}
          onChangeText={setCategory}
          placeholder="Housing"
        />
        <ChipSelect
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={setPriority}
        />
        <Text style={styles.hint}>
          Required: rent, utilities, insurance. Essential: groceries, transit. Optional:
          restaurants, entertainment.
        </Text>
        <SwitchField label="Variable amount" value={isVariable} onValueChange={setIsVariable} />
        {isVariable ? (
          <>
            <TextField
              label="Minimum amount"
              value={minimum}
              onChangeText={setMinimum}
              keyboardType="decimal-pad"
            />
            <TextField
              label="Typical amount"
              value={typical}
              onChangeText={setTypical}
              keyboardType="decimal-pad"
            />
            <TextField
              label="Maximum amount"
              value={maximum}
              onChangeText={setMaximum}
              keyboardType="decimal-pad"
            />
            <ChipSelect
              label="Reserve amount choice"
              options={[
                { value: 'minimum', label: 'Minimum' },
                { value: 'typical', label: 'Typical' },
                { value: 'maximum', label: 'Maximum' },
              ]}
              value={reserve}
              onChange={setReserve}
            />
          </>
        ) : null}
        <SwitchField label="Autopay" value={isAutopay} onValueChange={setIsAutopay} />
        <SwitchField label="Active" value={isActive} onValueChange={setIsActive} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Save expense" onPress={onSave} />
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
