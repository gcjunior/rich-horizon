/**
 * Demo dataset adapter.
 * Source: filtered rows from the supplied CSVs for W-0001 and W-0202.
 * Bundled as JSON for reliable Expo loading (full CSVs are large).
 * Interactive CSV import / SQLite persistence are documented next steps.
 */
import raw from '../../assets/demo/demo_dataset.json';
import { dollarsToCents } from '../utils/money';
import type {
  DailyEarning,
  EarnedWageAdvance,
  Obligation,
  Transaction,
  Worker,
  WorkerId,
} from '../domain/types';

interface RawDataset {
  _source: string;
  workers: Record<string, string>[];
  daily_earnings: Record<string, string>[];
  transactions: Record<string, string>[];
  recurring_obligations: Record<string, string>[];
  earned_wage_advances: Record<string, string>[];
}

const dataset = raw as RawDataset;

const LABELS: Record<string, 'surplus' | 'constrained'> = {
  'W-0001': 'surplus',
  'W-0202': 'constrained',
};

export const DEMO_WORKERS: WorkerId[] = ['W-0001', 'W-0202'];

export function getWorkers(): Worker[] {
  return dataset.workers.map((w) => ({
    workerId: w.worker_id,
    city: w.city,
    province: w.province,
    occupation: w.occupation,
    payType: w.pay_type,
    typicalDailyNetCents: dollarsToCents(w.typical_daily_net_cad),
    incomeVolatility: Number.parseFloat(w.income_volatility),
    rentBurdenBand: w.rent_burden_band,
    label: LABELS[w.worker_id] ?? 'surplus',
  }));
}

export function getEarnings(workerId: WorkerId): DailyEarning[] {
  return dataset.daily_earnings
    .filter((e) => e.worker_id === workerId)
    .map((e) => ({
      earningsId: e.earnings_id,
      workerId: e.worker_id,
      workDate: e.work_date,
      netPayCents: dollarsToCents(e.net_pay_cad),
      grossPayCents: dollarsToCents(e.gross_pay_cad),
      tipsCents: dollarsToCents(e.tips_cad),
      deductionsCents: dollarsToCents(e.deductions_cad),
    }))
    .sort((a, b) => a.workDate.localeCompare(b.workDate));
}

export function getTransactions(workerId: WorkerId): Transaction[] {
  return dataset.transactions
    .filter((t) => t.worker_id === workerId)
    .map((t) => ({
      txnId: t.txn_id,
      workerId: t.worker_id,
      txnTs: t.txn_ts,
      direction: t.direction as 'debit' | 'credit',
      amountCents: dollarsToCents(t.amount_cad),
      category: t.category,
      merchantType: t.merchant_type,
      isEssential: t.is_essential === '1',
      notes: t.notes ?? '',
    }));
}

export function getObligations(workerId: WorkerId): Obligation[] {
  return dataset.recurring_obligations
    .filter((o) => o.worker_id === workerId)
    .map((o) => ({
      obligationId: o.obligation_id,
      workerId: o.worker_id,
      name: o.name,
      category: o.category,
      amountCents: dollarsToCents(o.amount_cad),
      frequency: o.frequency,
      dueDayOfMonth: Number.parseInt(o.due_day_of_month, 10),
      essential: o.essential === '1',
    }));
}

/** Earned-wage advances are tracked but NEVER counted as income. */
export function getAdvances(workerId: WorkerId): EarnedWageAdvance[] {
  return dataset.earned_wage_advances
    .filter((a) => a.worker_id === workerId)
    .map((a) => ({
      advanceId: a.advance_id,
      workerId: a.worker_id,
      amountCents: dollarsToCents(a.amount_cad),
      feeCents: dollarsToCents(a.fee_cad),
      status: a.status,
      reasonCode: a.reason_code,
    }));
}

export function loadWorkerBundle(workerId: WorkerId) {
  const worker = getWorkers().find((w) => w.workerId === workerId);
  if (!worker) throw new Error(`Unknown worker ${workerId}`);
  return {
    worker,
    earnings: getEarnings(workerId),
    transactions: getTransactions(workerId),
    obligations: getObligations(workerId),
    advances: getAdvances(workerId),
    source: dataset._source,
  };
}
