import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { ChipSelect, TextField } from '../../src/components/FormField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useFinanceStore, todayIso } from '../../src/store/financeStore';
import { colors, spacing } from '../../src/theme/colors';
import { parseMoneyInput } from '../../src/utils/labels';
import { dollarsToCents } from '../../src/utils/money';

export default function TransactionFormScreen() {
  const expenses = useFinanceStore((s) => s.expenses.filter((e) => e.isActive));
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayIso());
  const [expenseId, setExpenseId] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const onSave = () => {
    const amountCents = dollarsToCents(parseMoneyInput(amount));
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (amountCents <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    const result = addTransaction({
      description: description.trim(),
      amountCents,
      category: category.trim() || 'General',
      transactionDate: date,
      expenseId: expenseId === 'none' ? undefined : expenseId,
    });
    if (result.warning) {
      setWarning(result.warning);
      setTimeout(() => router.back(), 900);
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Grocery run"
        />
        <TextField
          label="Amount (CAD)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Category"
          value={category}
          onChangeText={setCategory}
          placeholder="Food"
        />
        <TextField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <ChipSelect
          label="Optional linked expense"
          options={[
            { value: 'none', label: 'None (flexible spending)' },
            ...expenses.map((e) => ({ value: e.id, label: e.name })),
          ]}
          value={expenseId}
          onChange={setExpenseId}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {warning ? <Text style={styles.warn}>{warning}</Text> : null}
        <PrimaryButton label="Save transaction" onPress={onSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 48 },
  error: { color: colors.danger, fontWeight: '600', marginBottom: 8 },
  warn: { color: colors.warning, fontWeight: '600', marginBottom: 8 },
});
