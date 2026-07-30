import type { Cents } from '../utils/money';

export type WorkerId = 'W-0001' | 'W-0202' | string;

export interface Worker {
  workerId: WorkerId;
  city: string;
  province: string;
  occupation: string;
  payType: string;
  typicalDailyNetCents: Cents;
  incomeVolatility: number;
  rentBurdenBand: string;
  label: 'surplus' | 'constrained';
}

export interface DailyEarning {
  earningsId: string;
  workerId: WorkerId;
  workDate: string;
  netPayCents: Cents;
  grossPayCents: Cents;
  tipsCents: Cents;
  deductionsCents: Cents;
}

export interface Transaction {
  txnId: string;
  workerId: WorkerId;
  txnTs: string;
  direction: 'debit' | 'credit';
  amountCents: Cents;
  category: string;
  merchantType: string;
  isEssential: boolean;
  notes: string;
}

export interface Obligation {
  obligationId: string;
  workerId: WorkerId;
  name: string;
  category: string;
  amountCents: Cents;
  frequency: string;
  dueDayOfMonth: number;
  essential: boolean;
}

export interface EarnedWageAdvance {
  advanceId: string;
  workerId: WorkerId;
  amountCents: Cents;
  feeCents: Cents;
  status: string;
  reasonCode: string;
}

export interface AllocationLine {
  label: string;
  amountCents: Cents;
  kind: 'bills' | 'buffer' | 'goal' | 'spend';
}

export interface NextBestAction {
  title: string;
  detail: string;
}

export interface BillCliffItem {
  name: string;
  amountCents: Cents;
}

export interface BillCliff {
  dueDate: string;
  dueDateLabel: string;
  bills: BillCliffItem[];
  totalCents: Cents;
  fundedCents: Cents;
  remainingCents: Cents;
  equivalentWorkdays: number;
}

export interface GoalProgress {
  id: string;
  title: string;
  subtitle: string;
  targetCents: Cents;
  currentCents: Cents;
  percentComplete: number;
  remainingCents: Cents;
  estimatedDaysRemaining: number | null;
  suggestedTodayCents: Cents;
}

export interface DiscretionaryCategory {
  category: string;
  totalCents: Cents;
}

export interface SpendingInsight {
  topCategories: DiscretionaryCategory[];
  totalDiscretionaryCents: Cents;
  tradeOff: string | null;
}

export interface FinancialSummary {
  worker: Worker;
  asOfDate: string;
  todayIncomeCents: Cents;
  incomeFloorCents: Cents;
  averageDailyNetCents: Cents;
  observedWorkRate: number;
  safeToSpendCents: Cents;
  fundingGapCents: Cents;
  allocation: AllocationLine[];
  requiredBillAccrualCents: Cents;
  emergencyContributionCents: Cents;
  goalContributionCents: Cents;
  billCliff: BillCliff;
  firstHorizon: GoalProgress;
  investmentGoal: GoalProgress;
  nextBestAction: NextBestAction;
  spending: SpendingInsight;
  deficits: Record<string, Cents>;
}
