import type {
  ExpenseFrequency,
  ExpensePriority,
  GoalType,
  IncomeFrequency,
} from '../domain/financeTypes';

export const INCOME_FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'semimonthly', label: 'Semimonthly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'one_time', label: 'One-time' },
];

export const EXPENSE_FREQUENCY_OPTIONS: { value: ExpenseFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'semimonthly', label: 'Semimonthly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'one_time', label: 'One-time' },
];

export const PRIORITY_OPTIONS: { value: ExpensePriority; label: string }[] = [
  { value: 'required', label: 'Required' },
  { value: 'essential', label: 'Essential' },
  { value: 'optional', label: 'Optional' },
];

export const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'emergency', label: 'Emergency buffer' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Future investment' },
  { value: 'debt', label: 'Pay down debt' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'purchase', label: 'Large purchase' },
  { value: 'custom', label: 'Custom' },
];

export function frequencyLabel(
  frequency: IncomeFrequency | ExpenseFrequency,
): string {
  const all = [...INCOME_FREQUENCY_OPTIONS, ...EXPENSE_FREQUENCY_OPTIONS];
  return all.find((o) => o.value === frequency)?.label ?? frequency;
}

export function parseMoneyInput(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
