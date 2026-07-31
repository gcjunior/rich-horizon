import { createId } from '../domain/allocationEngine';
import type { Expense, Goal, IncomeSource } from '../domain/financeTypes';
import { toISODate } from '../utils/dates';

function addDays(from: Date, days: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function buildSampleFinance(asOf: Date = new Date()): {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  goals: Goal[];
} {
  const nextBiweekly = addDays(asOf, 7);
  const rentDue = addDays(asOf, 14);
  const monthEndish = addDays(asOf, 20);

  const incomeSources: IncomeSource[] = [
    {
      id: createId('inc'),
      name: 'Main job',
      expectedAmountCents: 180_000,
      frequency: 'biweekly',
      nextPaymentDate: toISODate(nextBiweekly),
      isVariable: false,
      taxesDeducted: true,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('inc'),
      name: 'Delivery work',
      expectedAmountCents: 18_000,
      frequency: 'irregular',
      isVariable: true,
      minimumAmountCents: 10_000,
      typicalAmountCents: 18_000,
      maximumAmountCents: 28_000,
      expectedWorkdaysPerWeek: 4,
      taxesDeducted: true,
      isActive: true,
      source: 'sample',
    },
  ];

  const expenses: Expense[] = [
    {
      id: createId('exp'),
      name: 'Rent',
      category: 'Housing',
      amountCents: 145_000,
      frequency: 'monthly',
      priority: 'required',
      nextDueDate: toISODate(rentDue),
      dueDayOfMonth: rentDue.getDate(),
      isVariable: false,
      isAutopay: false,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('exp'),
      name: 'Phone',
      category: 'Utilities',
      amountCents: 6_500,
      frequency: 'monthly',
      priority: 'required',
      nextDueDate: toISODate(monthEndish),
      dueDayOfMonth: monthEndish.getDate(),
      isVariable: false,
      isAutopay: true,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('exp'),
      name: 'Electricity',
      category: 'Utilities',
      amountCents: 12_000,
      frequency: 'monthly',
      priority: 'required',
      nextDueDate: toISODate(monthEndish),
      dueDayOfMonth: monthEndish.getDate(),
      isVariable: true,
      minimumAmountCents: 9_000,
      typicalAmountCents: 12_000,
      maximumAmountCents: 18_000,
      isAutopay: true,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('exp'),
      name: 'Insurance',
      category: 'Insurance',
      amountCents: 11_000,
      frequency: 'monthly',
      priority: 'required',
      nextDueDate: toISODate(monthEndish),
      dueDayOfMonth: monthEndish.getDate(),
      isVariable: false,
      isAutopay: true,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('exp'),
      name: 'Groceries',
      category: 'Food',
      amountCents: 15_000,
      frequency: 'weekly',
      priority: 'essential',
      nextDueDate: toISODate(addDays(asOf, 3)),
      isVariable: true,
      minimumAmountCents: 10_000,
      typicalAmountCents: 15_000,
      maximumAmountCents: 22_000,
      isAutopay: false,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('exp'),
      name: 'Transportation',
      category: 'Transit',
      amountCents: 6_000,
      frequency: 'weekly',
      priority: 'essential',
      nextDueDate: toISODate(addDays(asOf, 3)),
      isVariable: false,
      isAutopay: false,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('exp'),
      name: 'Restaurants',
      category: 'Dining',
      amountCents: 12_000,
      frequency: 'monthly',
      priority: 'optional',
      nextDueDate: toISODate(monthEndish),
      isVariable: false,
      isAutopay: false,
      isActive: true,
      source: 'sample',
    },
    {
      id: createId('exp'),
      name: 'Entertainment',
      category: 'Fun',
      amountCents: 8_000,
      frequency: 'monthly',
      priority: 'optional',
      nextDueDate: toISODate(monthEndish),
      isVariable: false,
      isAutopay: false,
      isActive: true,
      source: 'sample',
    },
  ];

  const goals: Goal[] = [
    {
      id: createId('goal'),
      name: 'Emergency buffer',
      type: 'emergency',
      targetAmountCents: 200_000,
      fundedAmountCents: 0,
      contributionMethod: 'percentage',
      contributionValue: 10,
      priority: 1,
      pauseWhenBillsBehind: true,
    },
    {
      id: createId('goal'),
      name: 'Future investment',
      type: 'investment',
      targetAmountCents: 50_000,
      fundedAmountCents: 0,
      contributionMethod: 'fixed_amount',
      contributionValue: 500,
      priority: 2,
      pauseWhenBillsBehind: true,
    },
  ];

  return { incomeSources, expenses, goals };
}
