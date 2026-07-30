import {
  calendarDaysInclusive,
  daysBetween,
  formatMonthDay,
  nextDueDate,
  parseISODate,
  toISODate,
} from '../utils/dates';
import { clampNonNegative, percentile, type Cents } from '../utils/money';
import type {
  AllocationLine,
  BillCliff,
  DailyEarning,
  FinancialSummary,
  GoalProgress,
  NextBestAction,
  Obligation,
  Transaction,
  Worker,
} from './types';
import { analyzeDiscretionarySpending } from './spendingAnalysis';

const EMERGENCY_RATE = 0.1;
const GOAL_RATE = 0.05;
const FIRST_HORIZON_TARGET_FALLBACK = 50_000; // $500 if cliff remaining is tiny

export function observedWorkRate(earnings: DailyEarning[]): number {
  if (earnings.length === 0) return 1;
  const dates = earnings.map((e) => e.workDate).sort();
  const start = parseISODate(dates[0]);
  const end = parseISODate(dates[dates.length - 1]);
  const distinct = new Set(dates).size;
  const calendar = calendarDaysInclusive(start, end);
  return Math.min(1, distinct / calendar);
}

export function averageDailyNet(earnings: DailyEarning[]): Cents {
  if (earnings.length === 0) return 0;
  const sum = earnings.reduce((acc, e) => acc + e.netPayCents, 0);
  return Math.round(sum / earnings.length);
}

/** Conservative income floor = 25th percentile of recent net daily earnings. */
export function incomeFloor(earnings: DailyEarning[], recentN = 20): Cents {
  const recent = earnings.slice(-recentN).map((e) => e.netPayCents).sort((a, b) => a - b);
  return Math.round(percentile(recent, 0.25));
}

export function expectedWorkdaysBefore(dueDate: Date, asOf: Date, workRate: number): number {
  const days = daysBetween(asOf, dueDate);
  return Math.max(1, days * workRate);
}

export interface AccrualResult {
  obligationId: string;
  name: string;
  amountCents: Cents;
  remainingCents: Cents;
  fundedCents: Cents;
  perWorkdayCents: Cents;
  dueDate: string;
  expectedWorkdays: number;
}

/**
 * Transparent demo funding assumption:
 * Expected cycle progress = 1 − (days until due / 30).
 * Surplus workers are assumed to have reserved more of that progress;
 * constrained workers less — recomputed, never from CSV balances.
 */
export function estimateFundedCents(
  amountCents: Cents,
  asOf: Date,
  dueDate: Date,
  reserveEfficiency = 0.7,
): Cents {
  const daysUntil = daysBetween(asOf, dueDate);
  const theoretical = Math.min(0.95, Math.max(0.05, 1 - daysUntil / 30));
  const reservedShare = theoretical * reserveEfficiency;
  return Math.round(amountCents * reservedShare);
}

export function requiredBillAccruals(
  obligations: Obligation[],
  asOf: Date,
  workRate: number,
  deficits: Record<string, Cents> = {},
  reserveEfficiency = 0.7,
): AccrualResult[] {
  const essential = obligations.filter((o) => o.essential);
  return essential.map((o) => {
    const due = nextDueDate(asOf, o.dueDayOfMonth);
    const funded = estimateFundedCents(o.amountCents, asOf, due, reserveEfficiency);
    const remaining = Math.max(0, o.amountCents - funded);
    const expected = expectedWorkdaysBefore(due, asOf, workRate);
    const basePerDay = Math.ceil(remaining / expected);
    const deficit = deficits[o.obligationId] ?? 0;
    return {
      obligationId: o.obligationId,
      name: o.name,
      amountCents: o.amountCents,
      remainingCents: remaining,
      fundedCents: funded,
      perWorkdayCents: basePerDay + deficit,
      dueDate: toISODate(due),
      expectedWorkdays: expected,
    };
  });
}

export function buildBillCliff(
  obligations: Obligation[],
  asOf: Date,
  avgDailyNet: Cents,
  reserveEfficiency = 0.7,
): BillCliff {
  const essential = obligations.filter((o) => o.essential);
  const groups = new Map<string, { due: Date; bills: { name: string; amountCents: Cents }[]; funded: Cents }>();

  for (const o of essential) {
    const due = nextDueDate(asOf, o.dueDayOfMonth);
    const key = toISODate(due);
    const funded = estimateFundedCents(o.amountCents, asOf, due, reserveEfficiency);
    const existing = groups.get(key) ?? { due, bills: [], funded: 0 };
    existing.bills.push({ name: o.name, amountCents: o.amountCents });
    existing.funded += funded;
    groups.set(key, existing);
  }

  let best: BillCliff | null = null;
  for (const [key, g] of groups) {
    const total = g.bills.reduce((s, b) => s + b.amountCents, 0);
    const remaining = Math.max(0, total - g.funded);
    const cliff: BillCliff = {
      dueDate: key,
      dueDateLabel: formatMonthDay(g.due),
      bills: g.bills.sort((a, b) => b.amountCents - a.amountCents),
      totalCents: total,
      fundedCents: g.funded,
      remainingCents: remaining,
      equivalentWorkdays: avgDailyNet > 0 ? Math.round((total / avgDailyNet) * 10) / 10 : 0,
    };
    if (!best || cliff.totalCents > best.totalCents) best = cliff;
  }

  return (
    best ?? {
      dueDate: toISODate(asOf),
      dueDateLabel: formatMonthDay(asOf),
      bills: [],
      totalCents: 0,
      fundedCents: 0,
      remainingCents: 0,
      equivalentWorkdays: 0,
    }
  );
}

export function allocateIncome(
  incomeCents: Cents,
  billAccrualCents: Cents,
  emergencyCents: Cents,
  goalCents: Cents,
): AllocationLine[] {
  let remaining = incomeCents;
  const take = (want: Cents): Cents => {
    const got = Math.min(remaining, Math.max(0, want));
    remaining -= got;
    return got;
  };

  const bills = take(billAccrualCents);
  const buffer = take(emergencyCents);
  const goal = take(goalCents);
  const spend = remaining;

  return [
    { label: 'Rent and required bills', amountCents: bills, kind: 'bills' },
    { label: 'Emergency milestone', amountCents: buffer, kind: 'buffer' },
    { label: 'Investment goal', amountCents: goal, kind: 'goal' },
    { label: 'Safe to spend', amountCents: spend, kind: 'spend' },
  ];
}

/**
 * Carry-forward deficits when today's income cannot cover required bill accrual.
 */
export function applyDeficitCarryForward(
  accruals: AccrualResult[],
  availableForBills: Cents,
  previous: Record<string, Cents>,
): { allocated: Record<string, Cents>; nextDeficits: Record<string, Cents>; totalRequired: Cents } {
  const totalRequired = accruals.reduce((s, a) => s + a.perWorkdayCents, 0);
  const nextDeficits: Record<string, Cents> = { ...previous };
  const allocated: Record<string, Cents> = {};

  if (totalRequired <= 0) {
    for (const a of accruals) {
      allocated[a.obligationId] = 0;
      nextDeficits[a.obligationId] = 0;
    }
    return { allocated, nextDeficits, totalRequired };
  }

  let leftover = availableForBills;
  for (const a of accruals) {
    const need = a.perWorkdayCents;
    const got = Math.min(leftover, need);
    allocated[a.obligationId] = got;
    leftover -= got;
    nextDeficits[a.obligationId] = Math.max(0, need - got);
  }
  return { allocated, nextDeficits, totalRequired };
}

export function buildNextBestAction(
  accruals: AccrualResult[],
  billCliff: BillCliff,
  asOf: Date,
): NextBestAction {
  const sorted = [...accruals].sort((a, b) => b.remainingCents - a.remainingCents);
  const top = sorted[0];
  if (!top || top.remainingCents <= 0) {
    return {
      title: 'Keep your Horizon funded',
      detail: 'Required bills are on track. Consider adding a little more to your emergency milestone.',
    };
  }
  const reserve = Math.min(top.perWorkdayCents, top.remainingCents);
  const daysUntil = daysBetween(asOf, parseISODate(top.dueDate));
  return {
    title: `Reserve ${formatMoneyHint(reserve)} toward ${top.name.toLowerCase()} today.`,
    detail: `${top.name} is due in ${Math.max(1, daysUntil)} days and still needs ${formatMoneyHint(top.remainingCents)}. Next cliff: ${billCliff.dueDateLabel}.`,
  };
}

function formatMoneyHint(cents: Cents): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString('en-CA')}`;
}

export function buildGoals(
  billCliff: BillCliff,
  bufferReserved: Cents,
  investmentReserved: Cents,
  suggestedGoalToday: Cents,
  avgDailyNet: Cents,
): { firstHorizon: GoalProgress; investmentGoal: GoalProgress } {
  const target = Math.max(billCliff.remainingCents, FIRST_HORIZON_TARGET_FALLBACK);
  const current = Math.min(bufferReserved, target);
  const remaining = Math.max(0, target - current);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;
  const days =
    avgDailyNet > 0 && remaining > 0
      ? Math.ceil(remaining / Math.max(1, Math.round(avgDailyNet * EMERGENCY_RATE)))
      : remaining === 0
        ? 0
        : null;

  return {
    firstHorizon: {
      id: 'first-horizon',
      title: 'First Horizon',
      subtitle: 'Cover the next bill cliff without borrowing.',
      targetCents: target,
      currentCents: current,
      percentComplete: pct,
      remainingCents: remaining,
      estimatedDaysRemaining: days,
      suggestedTodayCents: Math.round(avgDailyNet * EMERGENCY_RATE),
    },
    investmentGoal: {
      id: 'future-investment',
      title: 'Future Investment',
      subtitle: 'Money reserved for future investing — not a stock pick.',
      targetCents: 50_000,
      currentCents: investmentReserved,
      percentComplete: Math.min(100, Math.round((investmentReserved / 50_000) * 100)),
      remainingCents: Math.max(0, 50_000 - investmentReserved),
      estimatedDaysRemaining:
        avgDailyNet > 0
          ? Math.ceil(Math.max(0, 50_000 - investmentReserved) / Math.max(1, Math.round(avgDailyNet * GOAL_RATE)))
          : null,
      suggestedTodayCents: suggestedGoalToday,
    },
  };
}

function pickDemoEarningDay(earnings: DailyEarning[]): DailyEarning {
  // Prefer a mid-cycle workday in the latest month so surplus vs shortfall
  // is visible (near due-date accrual correctly collapses safe-to-spend to $0).
  const latest = earnings[earnings.length - 1];
  const month = latest.workDate.slice(0, 7);
  const midCycle = earnings.filter((e) => {
    if (!e.workDate.startsWith(month)) return false;
    const day = Number.parseInt(e.workDate.slice(8), 10);
    return day >= 10 && day <= 18;
  });
  if (midCycle.length === 0) return latest;
  return midCycle.reduce((best, e) => (e.netPayCents > best.netPayCents ? e : best));
}

export function computeFinancialSummary(input: {
  worker: Worker;
  earnings: DailyEarning[];
  transactions: Transaction[];
  obligations: Obligation[];
  deficits?: Record<string, Cents>;
  bufferReservedCents?: Cents;
  investmentReservedCents?: Cents;
  forceGoalComplete?: boolean;
}): FinancialSummary {
  const { worker, earnings, transactions, obligations } = input;
  if (earnings.length === 0) {
    throw new Error('No earnings for worker');
  }

  const latest = pickDemoEarningDay(earnings);
  const asOf = parseISODate(latest.workDate);
  const workRate = observedWorkRate(earnings);
  const avg = averageDailyNet(earnings);
  const floor = incomeFloor(earnings.filter((e) => e.workDate <= latest.workDate));
  const todayIncome = latest.netPayCents;

  const deficits = input.deficits ?? {};
  const reserveEfficiency = worker.label === 'surplus' ? 0.92 : 0.42;
  const accruals = requiredBillAccruals(obligations, asOf, workRate, deficits, reserveEfficiency);
  const requiredBillAccrual = accruals.reduce((s, a) => s + a.perWorkdayCents, 0);

  // Buffer and goals only fund from surplus after required bill accruals.
  const afterBills = floor - requiredBillAccrual;
  let emergencyContribution = 0;
  let goalContribution = 0;
  let rawSafe = afterBills;
  if (afterBills > 0) {
    emergencyContribution = Math.min(
      Math.round(floor * EMERGENCY_RATE),
      Math.round(afterBills * 0.45),
    );
    const afterBuffer = afterBills - emergencyContribution;
    goalContribution = Math.min(
      Math.round(floor * GOAL_RATE),
      Math.max(0, Math.round(afterBuffer * 0.35)),
    );
    rawSafe = afterBills - emergencyContribution - goalContribution;
  }
  const fundingGap = rawSafe < 0 ? Math.abs(rawSafe) : 0;
  const safeToSpend = clampNonNegative(rawSafe);

  const allocation = allocateIncome(
    todayIncome,
    requiredBillAccrual,
    emergencyContribution,
    goalContribution,
  );

  const billCliff = buildBillCliff(obligations, asOf, avg, reserveEfficiency);

  // Demo reserved amounts: cycle-progress funding toward cliff + modest investment reserve from surplus days
  const progressFunded = billCliff.fundedCents;
  const bufferReserved = input.forceGoalComplete
    ? Math.max(billCliff.remainingCents, FIRST_HORIZON_TARGET_FALLBACK)
    : (input.bufferReservedCents ?? Math.round(progressFunded * 0.35));
  const investmentReserved =
    input.investmentReservedCents ??
    (worker.label === 'surplus' ? 12_000 : 2_500);

  const { firstHorizon, investmentGoal } = buildGoals(
    billCliff,
    bufferReserved,
    investmentReserved,
    goalContribution,
    avg,
  );

  const nextBestAction = buildNextBestAction(accruals, billCliff, asOf);
  const spending = analyzeDiscretionarySpending(transactions, obligations, asOf);

  return {
    worker,
    asOfDate: latest.workDate,
    todayIncomeCents: todayIncome,
    incomeFloorCents: floor,
    averageDailyNetCents: avg,
    observedWorkRate: workRate,
    safeToSpendCents: safeToSpend,
    fundingGapCents: fundingGap,
    allocation,
    requiredBillAccrualCents: requiredBillAccrual,
    emergencyContributionCents: emergencyContribution,
    goalContributionCents: goalContribution,
    billCliff,
    firstHorizon,
    investmentGoal,
    nextBestAction,
    spending,
    deficits,
  };
}
