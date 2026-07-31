import {
  daysBetween,
  formatMonthDay,
  nextDueDate,
  parseISODate,
  toISODate,
} from '../utils/dates';
import { clampNonNegative, formatCAD, type Cents } from '../utils/money';
import type {
  AllocationDraft,
  AllocationDraftItem,
  AllocationRecord,
  BillCliffSummary,
  Expense,
  ExpenseFundingStatus,
  FundingBucket,
  Goal,
  IncomeEntry,
  IncomeSource,
  MonthlyPlanSummary,
  PlanWarning,
} from './financeTypes';

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeExpenseToMonthlyCents(
  amountCents: Cents,
  frequency: Expense['frequency'],
): Cents {
  switch (frequency) {
    case 'daily':
      return Math.round((amountCents * 365) / 12);
    case 'weekly':
      return Math.round((amountCents * 52) / 12);
    case 'biweekly':
      return Math.round((amountCents * 26) / 12);
    case 'semimonthly':
      return amountCents * 2;
    case 'monthly':
      return amountCents;
    case 'quarterly':
      return Math.round(amountCents / 3);
    case 'yearly':
      return Math.round(amountCents / 12);
    case 'irregular':
    case 'one_time':
      return amountCents;
    default:
      return amountCents;
  }
}

export function normalizeIncomeToMonthlyCents(source: IncomeSource): Cents {
  const base =
    source.isVariable && source.typicalAmountCents != null
      ? source.typicalAmountCents
      : source.expectedAmountCents;

  switch (source.frequency) {
    case 'daily':
      return Math.round((base * 365) / 12);
    case 'weekly':
      return Math.round((base * 52) / 12);
    case 'biweekly':
      return Math.round((base * 26) / 12);
    case 'semimonthly':
      return base * 2;
    case 'monthly':
      return base;
    case 'irregular': {
      const workdaysPerWeek = source.expectedWorkdaysPerWeek ?? 5;
      const workdaysPerMonth = Math.round((workdaysPerWeek * 52) / 12);
      return base * workdaysPerMonth;
    }
    case 'one_time':
      return base;
    default:
      return base;
  }
}

export function getExpenseDueDate(expense: Expense, asOf: Date): Date | null {
  if (expense.nextDueDate) {
    return parseISODate(expense.nextDueDate);
  }
  if (expense.dueDayOfMonth != null) {
    return nextDueDate(asOf, expense.dueDayOfMonth);
  }
  if (
    expense.frequency === 'monthly' ||
    expense.frequency === 'weekly' ||
    expense.frequency === 'biweekly' ||
    expense.frequency === 'semimonthly' ||
    expense.frequency === 'quarterly' ||
    expense.frequency === 'yearly'
  ) {
    // Fallback: assume due at end of current month cycle for prototype.
    return nextDueDate(asOf, asOf.getDate() === 1 ? 1 : Math.min(28, asOf.getDate()));
  }
  return null;
}

export function getDaysUntilDue(asOf: Date, due: Date): number {
  return Math.max(0, daysBetween(asOf, due));
}

export function getExpectedIncomeEventsBeforeDue(
  sources: IncomeSource[],
  asOf: Date,
  due: Date,
): number {
  const days = Math.max(1, getDaysUntilDue(asOf, due));
  const active = sources.filter((s) => s.isActive);
  if (active.length === 0) return 1;

  let events = 0;
  for (const source of active) {
    switch (source.frequency) {
      case 'daily':
        events += days;
        break;
      case 'weekly':
        events += Math.max(1, Math.ceil(days / 7));
        break;
      case 'biweekly':
        events += Math.max(1, Math.ceil(days / 14));
        break;
      case 'semimonthly':
        events += Math.max(1, Math.ceil(days / 15));
        break;
      case 'monthly':
        events += Math.max(1, Math.ceil(days / 30));
        break;
      case 'irregular': {
        const workdaysPerWeek = source.expectedWorkdaysPerWeek ?? 5;
        const rate = workdaysPerWeek / 7;
        events += Math.max(1, Math.ceil(days * rate));
        break;
      }
      case 'one_time':
        events += source.nextPaymentDate && parseISODate(source.nextPaymentDate) <= due ? 1 : 0;
        break;
      default:
        events += 1;
    }
  }

  return Math.max(1, events);
}

export interface ExpenseFundingRequirement {
  expenseId: string;
  label: string;
  priority: Expense['priority'];
  cycleAmountCents: Cents;
  fundedAmountCents: Cents;
  deficitBeforeCents: Cents;
  remainingCents: Cents;
  daysUntilDue: number;
  expectedEvents: number;
  requiredFromCurrentIncomeCents: Cents;
  dueDate?: string;
  explanation: string;
}

function bucketFor(
  buckets: FundingBucket[],
  targetType: 'expense' | 'goal',
  targetId: string,
): FundingBucket | undefined {
  return buckets.find((b) => b.targetType === targetType && b.targetId === targetId);
}

export function calculateExpenseFundingRequirement(
  expense: Expense,
  buckets: FundingBucket[],
  sources: IncomeSource[],
  asOf: Date,
): ExpenseFundingRequirement {
  const due = getExpenseDueDate(expense, asOf);
  const bucket = bucketFor(buckets, 'expense', expense.id);
  const funded = bucket?.fundedAmountCents ?? 0;
  const deficitBefore = bucket?.deficitCents ?? 0;
  const cycleAmount = expense.amountCents;
  const remaining = Math.max(0, cycleAmount - funded);
  const daysUntilDue = due ? getDaysUntilDue(asOf, due) : 30;
  const expectedEvents = due
    ? getExpectedIncomeEventsBeforeDue(sources, asOf, due)
    : 1;
  const baseNeed = Math.ceil(remaining / Math.max(1, expectedEvents));
  const requiredFromCurrentIncomeCents = baseNeed + deficitBefore;

  const explanation = [
    `${expense.name} amount: ${formatCAD(cycleAmount)}`,
    `Already funded: ${formatCAD(funded)}`,
    `Still needed: ${formatCAD(remaining)}`,
    deficitBefore > 0 ? `Previous deficit: ${formatCAD(deficitBefore)}` : null,
    `Expected income events before due date: ${expectedEvents}`,
    remaining > 0
      ? `${formatCAD(remaining)} ÷ ${expectedEvents} = ${formatCAD(baseNeed)}`
      : 'Fully funded for this cycle',
    deficitBefore > 0
      ? `Recommended with deficit: ${formatCAD(requiredFromCurrentIncomeCents)}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    expenseId: expense.id,
    label: expense.name,
    priority: expense.priority,
    cycleAmountCents: cycleAmount,
    fundedAmountCents: funded,
    deficitBeforeCents: deficitBefore,
    remainingCents: remaining,
    daysUntilDue,
    expectedEvents,
    requiredFromCurrentIncomeCents,
    dueDate: due ? toISODate(due) : undefined,
    explanation,
  };
}

function goalRecommendedAmount(
  goal: Goal,
  remainingIncomeCents: Cents,
  billsBehind: boolean,
): Cents {
  if (billsBehind && goal.pauseWhenBillsBehind) return 0;
  const stillNeeded = Math.max(0, goal.targetAmountCents - goal.fundedAmountCents);
  if (stillNeeded <= 0) return 0;

  switch (goal.contributionMethod) {
    case 'fixed_amount':
      return Math.min(stillNeeded, Math.max(0, Math.round(goal.contributionValue)));
    case 'percentage':
      return Math.min(
        stillNeeded,
        Math.max(0, Math.round((remainingIncomeCents * goal.contributionValue) / 100)),
      );
    case 'remainder':
      return stillNeeded;
    default:
      return 0;
  }
}

function sortGoals(goals: Goal[]): Goal[] {
  const typeRank = (t: Goal['type']): number => {
    if (t === 'emergency') return 0;
    if (t === 'debt') return 1;
    if (t === 'savings' || t === 'investment') return 2;
    return 3;
  };
  return [...goals].sort((a, b) => {
    const tr = typeRank(a.type) - typeRank(b.type);
    if (tr !== 0) return tr;
    return a.priority - b.priority;
  });
}

/**
 * Allocate income using the required priority waterfall.
 * Never allocates more than available income.
 */
export function generateAllocationDraft(input: {
  incomeEntry: IncomeEntry;
  sources: IncomeSource[];
  expenses: Expense[];
  goals: Goal[];
  buckets: FundingBucket[];
  asOf?: Date;
}): AllocationDraft {
  const asOf = input.asOf ?? parseISODate(input.incomeEntry.receivedDate);
  const income = input.incomeEntry.amountCents;
  let remaining = income;
  const items: AllocationDraftItem[] = [];

  const take = (want: Cents): Cents => {
    const got = Math.min(remaining, Math.max(0, want));
    remaining -= got;
    return got;
  };

  const activeExpenses = input.expenses.filter((e) => e.isActive);
  const required = activeExpenses.filter((e) => e.priority === 'required');
  const essential = activeExpenses.filter((e) => e.priority === 'essential');
  const optional = activeExpenses.filter((e) => e.priority === 'optional');

  const reqNeeds = required.map((e) =>
    calculateExpenseFundingRequirement(e, input.buckets, input.sources, asOf),
  );

  // 1) Previous deficits on required expenses (included in requiredFromCurrent via deficitBefore)
  // 2) Current required-expense funding
  for (const need of reqNeeds.sort(
    (a, b) => b.requiredFromCurrentIncomeCents - a.requiredFromCurrentIncomeCents,
  )) {
    const recommended = need.requiredFromCurrentIncomeCents;
    const allocated = take(recommended);
    const deficitAfter = Math.max(0, recommended - allocated);
    items.push({
      targetType: 'expense',
      targetId: need.expenseId,
      label: need.label,
      priority: 1,
      recommendedAmountCents: recommended,
      adjustedAmountCents: allocated,
      deficitBeforeCents: need.deficitBeforeCents,
      deficitAfterCents: deficitAfter,
      explanation: need.explanation,
      group: 'required',
    });
  }

  // 3) Essential expenses
  for (const expense of essential) {
    const need = calculateExpenseFundingRequirement(
      expense,
      input.buckets,
      input.sources,
      asOf,
    );
    const recommended = need.requiredFromCurrentIncomeCents;
    const allocated = take(recommended);
    items.push({
      targetType: 'expense',
      targetId: expense.id,
      label: expense.name,
      priority: 2,
      recommendedAmountCents: recommended,
      adjustedAmountCents: allocated,
      deficitBeforeCents: need.deficitBeforeCents,
      deficitAfterCents: Math.max(0, recommended - allocated),
      explanation: need.explanation,
      group: 'essential',
    });
  }

  const requiredShort = items
    .filter((i) => i.group === 'required')
    .some((i) => i.deficitAfterCents > 0);
  const billsBehind =
    requiredShort ||
    reqNeeds.some((n) => n.deficitBeforeCents > 0 || n.remainingCents > n.cycleAmountCents * 0.5);

  // 4–6) Goals: emergency, debt, savings/investment, then others
  for (const goal of sortGoals(input.goals)) {
    const recommended = goalRecommendedAmount(goal, remaining, billsBehind);
    const allocated = take(recommended);
    const stillNeeded = Math.max(0, goal.targetAmountCents - goal.fundedAmountCents);
    items.push({
      targetType: 'goal',
      targetId: goal.id,
      label: goal.name,
      priority: 3 + (goal.type === 'emergency' ? 0 : goal.type === 'debt' ? 1 : 2),
      recommendedAmountCents: recommended,
      adjustedAmountCents: allocated,
      deficitBeforeCents: 0,
      deficitAfterCents: Math.max(0, stillNeeded - allocated),
      explanation: [
        `Goal: ${goal.name}`,
        `Target: ${formatCAD(goal.targetAmountCents)}`,
        `Already funded: ${formatCAD(goal.fundedAmountCents)}`,
        `Still needed: ${formatCAD(stillNeeded)}`,
        `Contribution method: ${goal.contributionMethod}`,
        billsBehind && goal.pauseWhenBillsBehind
          ? 'Paused while required bills are behind.'
          : `Recommended this income: ${formatCAD(recommended)}`,
      ].join('\n'),
      group: 'goals',
    });
  }

  // 7) Optional expenses
  for (const expense of optional) {
    const need = calculateExpenseFundingRequirement(
      expense,
      input.buckets,
      input.sources,
      asOf,
    );
    const recommended = need.requiredFromCurrentIncomeCents;
    const allocated = take(recommended);
    items.push({
      targetType: 'expense',
      targetId: expense.id,
      label: expense.name,
      priority: 8,
      recommendedAmountCents: recommended,
      adjustedAmountCents: allocated,
      deficitBeforeCents: need.deficitBeforeCents,
      deficitAfterCents: Math.max(0, recommended - allocated),
      explanation: need.explanation,
      group: 'optional',
    });
  }

  // 8) Safe to spend = remainder
  const safe = remaining;
  items.push({
    targetType: 'safe_to_spend',
    label: 'Safe to spend',
    priority: 99,
    recommendedAmountCents: safe,
    adjustedAmountCents: safe,
    deficitBeforeCents: 0,
    deficitAfterCents: 0,
    explanation:
      'Unallocated income after required expenses, essential expenses, and goals.',
    group: 'safe_to_spend',
  });

  return {
    incomeEntryId: input.incomeEntry.id,
    totalIncomeCents: income,
    items,
  };
}

export function recalculateDraftAfterAdjustment(
  draft: AllocationDraft,
  targetKey: string,
  newAmountCents: Cents,
): AllocationDraft {
  const clamped = Math.max(0, Math.round(newAmountCents));
  const items = draft.items.map((item) => {
    const key = itemKey(item);
    if (key !== targetKey) return item;
    if (item.targetType === 'safe_to_spend') return item;
    const adjusted = clamped;
    const deficitAfter =
      item.group === 'required' || item.group === 'essential'
        ? Math.max(0, item.recommendedAmountCents - adjusted)
        : item.deficitAfterCents;
    return { ...item, adjustedAmountCents: adjusted, deficitAfterCents: deficitAfter };
  });

  const nonSafe = items.filter((i) => i.targetType !== 'safe_to_spend');
  const allocated = nonSafe.reduce((s, i) => s + i.adjustedAmountCents, 0);
  const overflow = allocated - draft.totalIncomeCents;

  let next = items;
  if (overflow > 0) {
    // Cap the adjusted item so total never exceeds income.
    next = items.map((item) => {
      if (itemKey(item) !== targetKey || item.targetType === 'safe_to_spend') return item;
      const reduced = Math.max(0, item.adjustedAmountCents - overflow);
      return {
        ...item,
        adjustedAmountCents: reduced,
        deficitAfterCents:
          item.group === 'required' || item.group === 'essential'
            ? Math.max(0, item.recommendedAmountCents - reduced)
            : item.deficitAfterCents,
      };
    });
  }

  const totalNonSafe = next
    .filter((i) => i.targetType !== 'safe_to_spend')
    .reduce((s, i) => s + i.adjustedAmountCents, 0);
  const safe = Math.max(0, draft.totalIncomeCents - totalNonSafe);

  return {
    ...draft,
    items: next.map((item) =>
      item.targetType === 'safe_to_spend'
        ? {
            ...item,
            recommendedAmountCents: safe,
            adjustedAmountCents: safe,
          }
        : item,
    ),
  };
}

export function restoreDraftRecommendations(draft: AllocationDraft): AllocationDraft {
  const restored = draft.items.map((item) =>
    item.targetType === 'safe_to_spend'
      ? item
      : {
          ...item,
          adjustedAmountCents: item.recommendedAmountCents,
          deficitAfterCents: Math.max(
            0,
            item.recommendedAmountCents - item.recommendedAmountCents,
          ),
        },
  );
  const totalNonSafe = restored
    .filter((i) => i.targetType !== 'safe_to_spend')
    .reduce((s, i) => s + i.adjustedAmountCents, 0);
  const safe = Math.max(0, draft.totalIncomeCents - totalNonSafe);
  return {
    ...draft,
    items: restored.map((item) =>
      item.targetType === 'safe_to_spend'
        ? {
            ...item,
            recommendedAmountCents: safe,
            adjustedAmountCents: safe,
            deficitAfterCents: 0,
          }
        : {
            ...item,
            deficitAfterCents: Math.max(
              0,
              item.recommendedAmountCents - item.adjustedAmountCents,
            ),
          },
    ),
  };
}

export function itemKey(item: AllocationDraftItem): string {
  return `${item.targetType}:${item.targetId ?? 'safe'}`;
}

export function draftTotals(draft: AllocationDraft): {
  totalAllocatedCents: Cents;
  unallocatedCents: Cents;
  safeToSpendCents: Cents;
} {
  const nonSafe = draft.items.filter((i) => i.targetType !== 'safe_to_spend');
  const totalAllocatedCents = nonSafe.reduce((s, i) => s + i.adjustedAmountCents, 0);
  const safe =
    draft.items.find((i) => i.targetType === 'safe_to_spend')?.adjustedAmountCents ?? 0;
  return {
    totalAllocatedCents,
    unallocatedCents: Math.max(0, draft.totalIncomeCents - totalAllocatedCents - safe),
    safeToSpendCents: clampNonNegative(safe),
  };
}

export function calculatePlanWarnings(draft: AllocationDraft): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  for (const item of draft.items) {
    if (
      (item.group === 'required' || item.group === 'essential') &&
      item.adjustedAmountCents < item.recommendedAmountCents
    ) {
      const short = item.recommendedAmountCents - item.adjustedAmountCents;
      warnings.push({
        id: `warn_${item.targetId ?? item.label}`,
        severity: item.group === 'required' ? 'warning' : 'info',
        title: `${item.label} may fall behind.`,
        detail: `This allocation provides ${formatCAD(item.adjustedAmountCents)}, but approximately ${formatCAD(item.recommendedAmountCents)} is needed. Projected shortfall this step: ${formatCAD(short)}.`,
        targetId: item.targetId,
      });
    }
  }
  const totals = draftTotals(draft);
  if (totals.totalAllocatedCents > draft.totalIncomeCents) {
    warnings.push({
      id: 'warn_over_allocate',
      severity: 'error',
      title: 'Allocation exceeds income',
      detail: 'Reduce one or more amounts so the total does not exceed income received.',
    });
  }
  return warnings;
}

export function applyAllocation(input: {
  draft: AllocationDraft;
  buckets: FundingBucket[];
  goals: Goal[];
  nowIso: string;
}): {
  record: AllocationRecord;
  buckets: FundingBucket[];
  goals: Goal[];
  safeToSpendCents: Cents;
} {
  const totals = draftTotals(input.draft);
  let buckets = [...input.buckets];
  let goals = [...input.goals];

  const upsertBucket = (
    targetType: 'expense' | 'goal',
    targetId: string,
    addFunded: Cents,
    deficitAfter: Cents,
  ) => {
    const idx = buckets.findIndex(
      (b) => b.targetType === targetType && b.targetId === targetId,
    );
    if (idx >= 0) {
      const prev = buckets[idx];
      buckets = [
        ...buckets.slice(0, idx),
        {
          ...prev,
          fundedAmountCents: prev.fundedAmountCents + addFunded,
          deficitCents: deficitAfter,
          updatedAt: input.nowIso,
        },
        ...buckets.slice(idx + 1),
      ];
    } else {
      buckets = [
        ...buckets,
        {
          id: createId('bucket'),
          targetType,
          targetId,
          fundedAmountCents: addFunded,
          deficitCents: deficitAfter,
          updatedAt: input.nowIso,
        },
      ];
    }
  };

  for (const item of input.draft.items) {
    if (item.targetType === 'expense' && item.targetId) {
      upsertBucket('expense', item.targetId, item.adjustedAmountCents, item.deficitAfterCents);
    }
    if (item.targetType === 'goal' && item.targetId) {
      upsertBucket('goal', item.targetId, item.adjustedAmountCents, 0);
      goals = goals.map((g) =>
        g.id === item.targetId
          ? {
              ...g,
              fundedAmountCents: g.fundedAmountCents + item.adjustedAmountCents,
            }
          : g,
      );
    }
  }

  const record: AllocationRecord = {
    id: createId('alloc'),
    incomeEntryId: input.draft.incomeEntryId,
    totalIncomeCents: input.draft.totalIncomeCents,
    totalAllocatedCents: totals.totalAllocatedCents + totals.safeToSpendCents,
    safeToSpendCents: totals.safeToSpendCents,
    items: input.draft.items,
    createdAt: input.nowIso,
  };

  return {
    record,
    buckets,
    goals,
    safeToSpendCents: totals.safeToSpendCents,
  };
}

export function calculateSafeToSpend(
  allocations: AllocationRecord[],
  flexibleSpendCents: Cents,
): Cents {
  const pool = allocations.reduce((s, a) => s + a.safeToSpendCents, 0);
  return clampNonNegative(pool - flexibleSpendCents);
}

export function calculateMonthlyPlanSummary(
  sources: IncomeSource[],
  expenses: Expense[],
  goals: Goal[],
): MonthlyPlanSummary {
  const expectedMonthlyIncomeCents = sources
    .filter((s) => s.isActive)
    .reduce((s, src) => s + normalizeIncomeToMonthlyCents(src), 0);

  const byPriority = (p: Expense['priority']) =>
    expenses
      .filter((e) => e.isActive && e.priority === p)
      .reduce((s, e) => s + normalizeExpenseToMonthlyCents(e.amountCents, e.frequency), 0);

  const requiredMonthlyCents = byPriority('required');
  const essentialMonthlyCents = byPriority('essential');
  const optionalMonthlyCents = byPriority('optional');

  const goalContributionMonthlyCents = goals.reduce((sum, g) => {
    if (g.contributionMethod === 'fixed_amount') {
      return sum + Math.round(g.contributionValue);
    }
    if (g.contributionMethod === 'percentage') {
      const afterBills =
        expectedMonthlyIncomeCents - requiredMonthlyCents - essentialMonthlyCents;
      return sum + Math.max(0, Math.round((afterBills * g.contributionValue) / 100));
    }
    return sum;
  }, 0);

  const estimatedRemainderCents =
    expectedMonthlyIncomeCents -
    requiredMonthlyCents -
    essentialMonthlyCents -
    optionalMonthlyCents -
    goalContributionMonthlyCents;

  return {
    expectedMonthlyIncomeCents,
    requiredMonthlyCents,
    essentialMonthlyCents,
    optionalMonthlyCents,
    goalContributionMonthlyCents,
    estimatedRemainderCents,
  };
}

export function buildExpenseFundingStatuses(
  expenses: Expense[],
  buckets: FundingBucket[],
  sources: IncomeSource[],
  asOf: Date,
): ExpenseFundingStatus[] {
  return expenses
    .filter((e) => e.isActive)
    .map((expense) => {
      const need = calculateExpenseFundingRequirement(expense, buckets, sources, asOf);
      const percentFunded =
        need.cycleAmountCents > 0
          ? Math.min(
              100,
              Math.round((need.fundedAmountCents / need.cycleAmountCents) * 100),
            )
          : 100;
      return {
        expense,
        fundedAmountCents: need.fundedAmountCents,
        requiredAmountCents: need.cycleAmountCents,
        remainingCents: need.remainingCents,
        percentFunded,
        deficitCents: need.deficitBeforeCents,
        dueDate: need.dueDate,
        requiredFromNextIncomeCents: need.requiredFromCurrentIncomeCents,
      };
    });
}

export function buildBillCliffSummary(
  expenses: Expense[],
  buckets: FundingBucket[],
  sources: IncomeSource[],
  asOf: Date,
): BillCliffSummary | null {
  const required = expenses.filter((e) => e.isActive && e.priority === 'required');
  if (required.length === 0) return null;

  const groups = new Map<
    string,
    {
      due: Date;
      expenses: { name: string; amountCents: Cents; fundedCents: Cents }[];
    }
  >();

  for (const expense of required) {
    const due = getExpenseDueDate(expense, asOf);
    if (!due) continue;
    const key = toISODate(due);
    const funded = bucketFor(buckets, 'expense', expense.id)?.fundedAmountCents ?? 0;
    const existing = groups.get(key) ?? { due, expenses: [] };
    existing.expenses.push({
      name: expense.name,
      amountCents: expense.amountCents,
      fundedCents: funded,
    });
    groups.set(key, existing);
  }

  let best: BillCliffSummary | null = null;
  for (const [key, g] of groups) {
    const totalCents = g.expenses.reduce((s, e) => s + e.amountCents, 0);
    const fundedCents = g.expenses.reduce((s, e) => s + e.fundedCents, 0);
    const remainingCents = Math.max(0, totalCents - fundedCents);
    const events = getExpectedIncomeEventsBeforeDue(sources, asOf, g.due);
    const cliff: BillCliffSummary = {
      dueDate: key,
      dueDateLabel: formatMonthDay(g.due),
      expenses: g.expenses.sort((a, b) => b.amountCents - a.amountCents),
      totalCents,
      fundedCents,
      remainingCents,
      equivalentPayments: events,
    };
    if (!best || cliff.totalCents > best.totalCents) best = cliff;
  }
  return best;
}

export function requiredFundingPercent(
  expenses: Expense[],
  buckets: FundingBucket[],
): number {
  const required = expenses.filter((e) => e.isActive && e.priority === 'required');
  if (required.length === 0) return 100;
  let total = 0;
  let funded = 0;
  for (const e of required) {
    total += e.amountCents;
    funded += bucketFor(buckets, 'expense', e.id)?.fundedAmountCents ?? 0;
  }
  if (total <= 0) return 100;
  return Math.min(100, Math.round((funded / total) * 100));
}

export function validatePositiveCents(cents: Cents): string | null {
  if (!Number.isFinite(cents) || cents <= 0) {
    return 'Amount must be greater than zero.';
  }
  return null;
}

export function validateIncomeSource(input: {
  name: string;
  expectedAmountCents: Cents;
  isVariable: boolean;
  minimumAmountCents?: Cents;
  typicalAmountCents?: Cents;
  maximumAmountCents?: Cents;
  expectedWorkdaysPerWeek?: number;
}): string[] {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push('Name is required.');
  if (input.expectedAmountCents <= 0) errors.push('Expected amount must be greater than zero.');
  if (input.isVariable) {
    const min = input.minimumAmountCents ?? 0;
    const typ = input.typicalAmountCents ?? 0;
    const max = input.maximumAmountCents ?? 0;
    if (min > typ) errors.push('Minimum cannot exceed typical.');
    if (typ > max) errors.push('Typical cannot exceed maximum.');
    const days = input.expectedWorkdaysPerWeek ?? 0;
    if (days < 1 || days > 7) errors.push('Expected workdays must be between 1 and 7.');
  }
  return errors;
}
