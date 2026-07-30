import { parseISODate } from '../utils/dates';
import type { Cents } from '../utils/money';
import type {
  DiscretionaryCategory,
  Obligation,
  SpendingInsight,
  Transaction,
} from './types';

const DISCRETIONARY_CATEGORIES = new Set([
  'restaurants',
  'restaurant',
  'food_out',
  'food out',
  'dining',
  'clothing',
  'clothes',
  'activities',
  'parties',
  'party',
  'entertainment',
  'shopping',
  'misc',
  'miscellaneous',
  'leisure',
  'alcohol',
  'coffee',
  'games',
  'hobbies',
  'personal_care',
  'cash_withdrawal',
]);

function isDiscretionary(txn: Transaction): boolean {
  if (txn.direction !== 'debit') return false;
  if (txn.isEssential) return false;
  const cat = txn.category.toLowerCase();
  const merchant = txn.merchantType.toLowerCase();
  if (DISCRETIONARY_CATEGORIES.has(cat) || DISCRETIONARY_CATEGORIES.has(merchant)) return true;
  // Broad non-essential catch for demo categories in the dataset
  const hints = [
    'restaurant',
    'clothing',
    'entertainment',
    'shopping',
    'party',
    'activity',
    'leisure',
    'coffee',
    'alcohol',
    'streaming',
  ];
  return hints.some((h) => cat.includes(h) || merchant.includes(h));
}

function prettyCategory(raw: string): string {
  const map: Record<string, string> = {
    restaurants: 'Restaurants',
    restaurant: 'Restaurants',
    food_out: 'Restaurants',
    personal_care: 'Personal care',
    cash_withdrawal: 'Cash withdrawals',
    entertainment: 'Entertainment',
    clothing: 'Clothing',
    shopping: 'Shopping',
    activities: 'Activities',
    parties: 'Parties',
    misc: 'Miscellaneous',
    miscellaneous: 'Miscellaneous',
    coffee: 'Coffee',
    alcohol: 'Alcohol',
    leisure: 'Leisure',
  };
  return map[raw.toLowerCase()] ?? raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ');
}

export function analyzeDiscretionarySpending(
  transactions: Transaction[],
  obligations: Obligation[],
  asOf: Date,
): SpendingInsight {
  const month = asOf.getMonth();
  const year = asOf.getFullYear();

  const inMonth = transactions.filter((t) => {
    const d = parseISODate(t.txnTs.slice(0, 10));
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const byCat = new Map<string, Cents>();
  const accumulate = (list: Transaction[]) => {
    for (const t of list) {
      if (!isDiscretionary(t)) continue;
      const key = t.category.toLowerCase();
      byCat.set(key, (byCat.get(key) ?? 0) + t.amountCents);
    }
  };

  accumulate(inMonth);

  // Prefer a 45-day window when the current month is sparse
  if ([...byCat.values()].reduce((s, v) => s + v, 0) < 5000) {
    byCat.clear();
    const cutoff = new Date(asOf);
    cutoff.setDate(cutoff.getDate() - 45);
    accumulate(
      transactions.filter((t) => parseISODate(t.txnTs.slice(0, 10)) >= cutoff),
    );
  }

  const topCategories: DiscretionaryCategory[] = [...byCat.entries()]
    .map(([category, totalCents]) => ({ category: prettyCategory(category), totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 3);

  const totalDiscretionaryCents = [...byCat.values()].reduce((s, v) => s + v, 0);

  const tradeOff = buildTradeOff(topCategories, obligations);

  return { topCategories, totalDiscretionaryCents, tradeOff };
}

function buildTradeOff(
  top: DiscretionaryCategory[],
  obligations: Obligation[],
): string | null {
  if (top.length === 0) return null;
  const source = top[0];
  const phone = obligations.find((o) => o.category.toLowerCase().includes('phone') || o.name.toLowerCase().includes('phone'));
  const smallBill =
    phone ??
    [...obligations]
      .filter((o) => o.essential)
      .sort((a, b) => a.amountCents - b.amountCents)[0];

  if (!smallBill) return null;

  const redirect = Math.min(source.totalCents, smallBill.amountCents);
  if (redirect < 1000) return null; // at least $10

  const dollars = Math.round(redirect / 100);
  if (redirect >= smallBill.amountCents) {
    return `Redirecting $${dollars} from ${source.category.toLowerCase()} would fully fund your ${smallBill.name.toLowerCase()}.`;
  }
  return `Redirecting $${dollars} from ${source.category.toLowerCase()} would cover part of your ${smallBill.name.toLowerCase()}.`;
}
