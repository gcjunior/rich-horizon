import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ChipSelect, SwitchField, TextField } from '../../src/components/FormField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useFinanceStore, todayIso } from '../../src/store/financeStore';
import { colors, spacing } from '../../src/theme/colors';
import { parseMoneyInput } from '../../src/utils/labels';
import { dollarsToCents } from '../../src/utils/money';

export default function IncomeReceivedScreen() {
  const incomeSources = useFinanceStore((s) => s.incomeSources.filter((s) => s.isActive));
  const addIncomeAndAllocate = useFinanceStore((s) => s.addIncomeAndAllocate);

  const [sourceId, setSourceId] = useState(incomeSources[0]?.id ?? '');
  const [amount, setAmount] = useState(
    incomeSources[0] ? String(incomeSources[0].expectedAmountCents / 100) : '',
  );
  const [receivedDate, setReceivedDate] = useState(todayIso());
  const [taxesDeducted, setTaxesDeducted] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (incomeSources.length === 0) {
    return (
      <View style={styles.content}>
        <EmptyState
          title="No income sources"
          detail="Add an income source before recording a payment."
        />
        <PrimaryButton label="Add income source" onPress={() => router.push('/income/source')} />
      </View>
    );
  }

  const onSubmit = () => {
    const amountCents = dollarsToCents(parseMoneyInput(amount));
    if (!sourceId) {
      setError('Choose an income source.');
      return;
    }
    if (amountCents <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    const entryId = addIncomeAndAllocate({
      incomeSourceId: sourceId,
      amountCents,
      receivedDate,
      taxesDeducted,
    });
    router.replace({ pathname: '/allocation/[incomeEntryId]', params: { incomeEntryId: entryId } });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ChipSelect
          label="Income source"
          options={incomeSources.map((s) => ({ value: s.id, label: s.name }))}
          value={sourceId}
          onChange={(id) => {
            setSourceId(id);
            const src = incomeSources.find((s) => s.id === id);
            if (src) setAmount(String(src.expectedAmountCents / 100));
          }}
        />
        <TextField
          label="Amount received (CAD)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Date (YYYY-MM-DD)"
          value={receivedDate}
          onChangeText={setReceivedDate}
        />
        <SwitchField
          label="Taxes already deducted"
          value={taxesDeducted}
          onValueChange={setTaxesDeducted}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Add and allocate" onPress={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 48, flexGrow: 1 },
  error: { color: colors.danger, fontWeight: '600', marginBottom: 8 },
});
