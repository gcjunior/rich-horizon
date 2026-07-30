import type { Cents } from '../utils/money';

export type IncomeFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'semimonthly'
  | 'monthly'
  | 'irregular'
  | 'one_time';

export type ExpenseFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'semimonthly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'irregular'
  | 'one_time';

export type ExpensePriority = 'required' | 'essential' | 'optional';

export type AllocationMethod = 'due_date' | 'fixed_amount' | 'percentage' | 'remainder';

export type GoalType =
  | 'emergency'
  | 'savings'
  | 'investment'
  | 'debt'
  | 'vacation'
  | 'purchase'
  | 'custom';

export type ContributionMethod = 'fixed_amount' | 'percentage' | 'remainder';

export type DataSource = 'manual' | 'csv' | 'sample';

export interface IncomeSource {
  id: string;
  name: string;
  expectedAmountCents: Cents;
  frequency: IncomeFrequency;
  nextPaymentDate?: string;
  isVariable: boolean;
  minimumAmountCents?: Cents;
  typicalAmountCents?: Cents;
  maximumAmountCents?: Cents;
  expectedWorkdaysPerWeek?: number;
  taxesDeducted: boolean;
  isActive: boolean;
  source: DataSource;
}

export interface IncomeEntry {
  id: string;
  incomeSourceId: string;
  amountCents: Cents;
  receivedDate: string;
  taxesDeducted: boolean;
  allocated: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amountCents: Cents;
  frequency: ExpenseFrequency;
  priority: ExpensePriority;
  nextDueDate?: string;
  dueDayOfMonth?: number;
  isVariable: boolean;
  minimumAmountCents?: Cents;
  typicalAmountCents?: Cents;
  maximumAmountCents?: Cents;
  isAutopay: boolean;
  isActive: boolean;
  source: DataSource;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmountCents: Cents;
  fundedAmountCents: Cents;
  targetDate?: string;
  contributionMethod: ContributionMethod;
  contributionValue: number;
  priority: number;
  pauseWhenBillsBehind: boolean;
}

export interface FundingBucket {
  id: string;
  targetType: 'expense' | 'goal';
  targetId: string;
  fundedAmountCents: Cents;
  deficitCents: Cents;
  updatedAt: string;
}

export interface AllocationDraftItem {
  targetType: 'expense' | 'goal' | 'safe_to_spend';
  targetId?: string;
  label: string;
  priority: number;
  recommendedAmountCents: Cents;
  adjustedAmountCents: Cents;
  deficitBeforeCents: Cents;
  deficitAfterCents: Cents;
  explanation: string;
  group: 'required' | 'essential' | 'goals' | 'optional' | 'safe_to_spend';
}

export interface AllocationDraft {
  incomeEntryId: string;
  totalIncomeCents: Cents;
  items: AllocationDraftItem[];
}

export interface AllocationRecord {
  id: string;
  incomeEntryId: string;
  totalIncomeCents: Cents;
  totalAllocatedCents: Cents;
  safeToSpendCents: Cents;
  items: AllocationDraftItem[];
  createdAt: string;
}

export interface ExpenseTransaction {
  id: string;
  description: string;
  amountCents: Cents;
  category: string;
  expenseId?: string;
  transactionDate: string;
  createdAt: string;
}

export interface PlanWarning {
  id: string;
  severity: 'warning' | 'error' | 'info';
  title: string;
  detail: string;
  targetId?: string;
}

export interface ExpenseFundingStatus {
  expense: Expense;
  fundedAmountCents: Cents;
  requiredAmountCents: Cents;
  remainingCents: Cents;
  percentFunded: number;
  deficitCents: Cents;
  dueDate?: string;
  requiredFromNextIncomeCents: Cents;
}

export interface BillCliffSummary {
  dueDate: string;
  dueDateLabel: string;
  expenses: { name: string; amountCents: Cents; fundedCents: Cents }[];
  totalCents: Cents;
  fundedCents: Cents;
  remainingCents: Cents;
  equivalentPayments: number;
}

export interface MonthlyPlanSummary {
  expectedMonthlyIncomeCents: Cents;
  requiredMonthlyCents: Cents;
  essentialMonthlyCents: Cents;
  optionalMonthlyCents: Cents;
  goalContributionMonthlyCents: Cents;
  estimatedRemainderCents: Cents;
}
