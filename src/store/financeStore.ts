import { create } from 'zustand';
import {
  applyAllocation,
  buildBillCliffSummary,
  buildExpenseFundingStatuses,
  calculateMonthlyPlanSummary,
  calculatePlanWarnings,
  calculateSafeToSpend,
  createId,
  draftTotals,
  generateAllocationDraft,
  itemKey,
  recalculateDraftAfterAdjustment,
  requiredFundingPercent,
  restoreDraftRecommendations,
} from '../domain/allocationEngine';
import type {
  AllocationDraft,
  AllocationRecord,
  Expense,
  ExpenseTransaction,
  FundingBucket,
  Goal,
  IncomeEntry,
  IncomeSource,
  PlanWarning,
} from '../domain/financeTypes';
import { buildSampleFinance } from '../data/sampleFinance';
import { toISODate } from '../utils/dates';
import { formatCAD, type Cents } from '../utils/money';

export type OnboardingStep = 'welcome' | 'income' | 'expenses' | 'goals' | 'method' | 'review' | 'done';

interface FinanceState {
  onboardingComplete: boolean;
  onboardingStep: OnboardingStep;
  allocationMethod: 'recommended' | 'custom';
  incomeSources: IncomeSource[];
  expenses: Expense[];
  goals: Goal[];
  buckets: FundingBucket[];
  incomeEntries: IncomeEntry[];
  allocations: AllocationRecord[];
  transactions: ExpenseTransaction[];
  currentDraft: AllocationDraft | null;
  lastConfirmMessage: string | null;
  celebrationVisible: boolean;
  celebrationGoalName: string | null;

  startManualSetup: () => void;
  loadSampleData: () => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  setAllocationMethod: (method: 'recommended' | 'custom') => void;

  upsertIncomeSource: (source: IncomeSource) => void;
  deleteIncomeSource: (id: string) => void;
  upsertExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  upsertGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;

  addIncomeAndAllocate: (input: {
    incomeSourceId: string;
    amountCents: Cents;
    receivedDate: string;
    taxesDeducted: boolean;
  }) => string;
  setCurrentDraft: (draft: AllocationDraft | null) => void;
  adjustDraftItem: (key: string, amountCents: Cents) => void;
  restoreDraft: () => void;
  confirmDraft: () => { success: boolean; message: string };
  clearConfirmMessage: () => void;
  dismissCelebration: () => void;

  addTransaction: (input: {
    description: string;
    amountCents: Cents;
    category: string;
    transactionDate: string;
    expenseId?: string;
  }) => { warning?: string };

  getSafeToSpendCents: () => Cents;
  getRequiredFundingPercent: () => number;
  getPlanWarningsForDraft: () => PlanWarning[];
}

const emptyState = {
  onboardingComplete: false,
  onboardingStep: 'welcome' as OnboardingStep,
  allocationMethod: 'recommended' as const,
  incomeSources: [] as IncomeSource[],
  expenses: [] as Expense[],
  goals: [] as Goal[],
  buckets: [] as FundingBucket[],
  incomeEntries: [] as IncomeEntry[],
  allocations: [] as AllocationRecord[],
  transactions: [] as ExpenseTransaction[],
  currentDraft: null as AllocationDraft | null,
  lastConfirmMessage: null as string | null,
  celebrationVisible: false,
  celebrationGoalName: null as string | null,
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  ...emptyState,

  startManualSetup: () =>
    set({
      ...emptyState,
      onboardingStep: 'income',
    }),

  loadSampleData: () => {
    const sample = buildSampleFinance(new Date());
    set({
      ...emptyState,
      onboardingComplete: true,
      onboardingStep: 'done',
      incomeSources: sample.incomeSources,
      expenses: sample.expenses,
      goals: sample.goals,
      allocationMethod: 'recommended',
    });
  },

  setOnboardingStep: (step) => set({ onboardingStep: step }),

  completeOnboarding: () =>
    set({ onboardingComplete: true, onboardingStep: 'done' }),

  setAllocationMethod: (method) => set({ allocationMethod: method }),

  upsertIncomeSource: (source) =>
    set((state) => {
      const exists = state.incomeSources.some((s) => s.id === source.id);
      return {
        incomeSources: exists
          ? state.incomeSources.map((s) => (s.id === source.id ? source : s))
          : [...state.incomeSources, source],
      };
    }),

  deleteIncomeSource: (id) =>
    set((state) => ({
      incomeSources: state.incomeSources.filter((s) => s.id !== id),
    })),

  upsertExpense: (expense) =>
    set((state) => {
      const exists = state.expenses.some((e) => e.id === expense.id);
      return {
        expenses: exists
          ? state.expenses.map((e) => (e.id === expense.id ? expense : e))
          : [...state.expenses, expense],
      };
    }),

  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
      buckets: state.buckets.filter((b) => !(b.targetType === 'expense' && b.targetId === id)),
    })),

  upsertGoal: (goal) =>
    set((state) => {
      const exists = state.goals.some((g) => g.id === goal.id);
      return {
        goals: exists
          ? state.goals.map((g) => (g.id === goal.id ? goal : g))
          : [...state.goals, goal],
      };
    }),

  deleteGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
      buckets: state.buckets.filter((b) => !(b.targetType === 'goal' && b.targetId === id)),
    })),

  addIncomeAndAllocate: ({ incomeSourceId, amountCents, receivedDate, taxesDeducted }) => {
    const entry: IncomeEntry = {
      id: createId('entry'),
      incomeSourceId,
      amountCents,
      receivedDate,
      taxesDeducted,
      allocated: false,
      createdAt: new Date().toISOString(),
    };
    const state = get();
    const draft = generateAllocationDraft({
      incomeEntry: entry,
      sources: state.incomeSources,
      expenses: state.expenses,
      goals: state.goals,
      buckets: state.buckets,
    });
    set({
      incomeEntries: [entry, ...state.incomeEntries],
      currentDraft: draft,
    });
    return entry.id;
  },

  setCurrentDraft: (draft) => set({ currentDraft: draft }),

  adjustDraftItem: (key, amountCents) => {
    const draft = get().currentDraft;
    if (!draft) return;
    set({ currentDraft: recalculateDraftAfterAdjustment(draft, key, amountCents) });
  },

  restoreDraft: () => {
    const draft = get().currentDraft;
    if (!draft) return;
    set({ currentDraft: restoreDraftRecommendations(draft) });
  },

  confirmDraft: () => {
    const state = get();
    const draft = state.currentDraft;
    if (!draft) return { success: false, message: 'No allocation draft to confirm.' };

    const totals = draftTotals(draft);
    if (totals.totalAllocatedCents > draft.totalIncomeCents) {
      return { success: false, message: 'Allocation exceeds income. Adjust amounts first.' };
    }

    const nowIso = new Date().toISOString();
    const applied = applyAllocation({
      draft,
      buckets: state.buckets,
      goals: state.goals,
      nowIso,
    });

    const completedGoal = applied.goals.find((g) => {
      const prev = state.goals.find((p) => p.id === g.id);
      return (
        prev != null &&
        prev.fundedAmountCents < prev.targetAmountCents &&
        g.fundedAmountCents >= g.targetAmountCents
      );
    });

    const pct = requiredFundingPercent(state.expenses, applied.buckets);
    set({
      buckets: applied.buckets,
      goals: applied.goals,
      allocations: [applied.record, ...state.allocations],
      incomeEntries: state.incomeEntries.map((e) =>
        e.id === draft.incomeEntryId ? { ...e, allocated: true } : e,
      ),
      currentDraft: null,
      lastConfirmMessage: `Income allocated. Your required expenses are now ${pct}% funded.`,
      celebrationVisible: completedGoal != null,
      celebrationGoalName: completedGoal?.name ?? null,
    });

    return {
      success: true,
      message: `Income allocated. Your required expenses are now ${pct}% funded.`,
    };
  },

  clearConfirmMessage: () => set({ lastConfirmMessage: null }),

  dismissCelebration: () =>
    set({ celebrationVisible: false, celebrationGoalName: null }),

  addTransaction: ({ description, amountCents, category, transactionDate, expenseId }) => {
    const txn: ExpenseTransaction = {
      id: createId('txn'),
      description,
      amountCents,
      category,
      expenseId,
      transactionDate,
      createdAt: new Date().toISOString(),
    };

    let warning: string | undefined;
    set((state) => {
      let buckets = state.buckets;
      if (expenseId) {
        const idx = buckets.findIndex(
          (b) => b.targetType === 'expense' && b.targetId === expenseId,
        );
        if (idx >= 0) {
          const bucket = buckets[idx];
          const nextFunded = bucket.fundedAmountCents - amountCents;
          if (nextFunded < 0) {
            warning =
              'Spending exceeds the funded balance for this expense. The difference was recorded as a deficit.';
            buckets = [
              ...buckets.slice(0, idx),
              {
                ...bucket,
                fundedAmountCents: 0,
                deficitCents: bucket.deficitCents + Math.abs(nextFunded),
                updatedAt: new Date().toISOString(),
              },
              ...buckets.slice(idx + 1),
            ];
          } else {
            buckets = [
              ...buckets.slice(0, idx),
              {
                ...bucket,
                fundedAmountCents: nextFunded,
                updatedAt: new Date().toISOString(),
              },
              ...buckets.slice(idx + 1),
            ];
          }
        } else {
          warning = 'No funding bucket found for this expense. Transaction recorded without reducing funded balance.';
        }
      }
      return {
        transactions: [txn, ...state.transactions],
        buckets,
      };
    });
    return { warning };
  },

  getSafeToSpendCents: () => {
    const state = get();
    const flexible = state.transactions
      .filter((t) => !t.expenseId)
      .reduce((s, t) => s + t.amountCents, 0);
    return calculateSafeToSpend(state.allocations, flexible);
  },

  getRequiredFundingPercent: () => {
    const state = get();
    return requiredFundingPercent(state.expenses, state.buckets);
  },

  getPlanWarningsForDraft: () => {
    const draft = get().currentDraft;
    if (!draft) return [];
    return calculatePlanWarnings(draft);
  },
}));

/** Selectors / helpers used by screens (pure reads from store snapshot). */
export function selectMonthlyPlan(state: FinanceState) {
  return calculateMonthlyPlanSummary(state.incomeSources, state.expenses, state.goals);
}

export function selectExpenseStatuses(state: FinanceState) {
  return buildExpenseFundingStatuses(
    state.expenses,
    state.buckets,
    state.incomeSources,
    new Date(),
  );
}

export function selectBillCliff(state: FinanceState) {
  return buildBillCliffSummary(
    state.expenses,
    state.buckets,
    state.incomeSources,
    new Date(),
  );
}

export function selectLatestIncome(state: FinanceState) {
  return state.incomeEntries[0] ?? null;
}

export function selectSourceName(state: FinanceState, sourceId: string): string {
  return state.incomeSources.find((s) => s.id === sourceId)?.name ?? 'Deleted income source';
}

export function selectNextPriority(state: FinanceState): {
  title: string;
  detail: string;
} {
  const statuses = selectExpenseStatuses(state).filter((s) => s.expense.priority === 'required');
  const top = [...statuses].sort(
    (a, b) => b.requiredFromNextIncomeCents - a.requiredFromNextIncomeCents,
  )[0];
  if (!top || top.remainingCents <= 0) {
    return {
      title: 'Keep your Horizon funded',
      detail: 'Required expenses are on track. Consider adding to your goals.',
    };
  }
  const dueLabel = top.dueDate ? `due ${top.dueDate}` : 'upcoming';
  return {
    title: `Reserve ${formatCAD(top.requiredFromNextIncomeCents)} toward ${top.expense.name}.`,
    detail: `${top.expense.name} is ${dueLabel} and still needs ${formatCAD(top.remainingCents)}.`,
  };
}

export function todayIso(): string {
  return toISODate(new Date());
}

export { itemKey, draftTotals };
