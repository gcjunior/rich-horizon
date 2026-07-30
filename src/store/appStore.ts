import { create } from 'zustand';
import { loadWorkerBundle, DEMO_WORKERS } from '../data/demoWorker';
import { computeFinancialSummary } from '../domain/financialEngine';
import type { FinancialSummary, WorkerId } from '../domain/types';
import type { Cents } from '../utils/money';

interface AppState {
  loaded: boolean;
  loading: boolean;
  workerId: WorkerId;
  summary: FinancialSummary | null;
  deficits: Record<string, Cents>;
  celebrationVisible: boolean;
  goalCompleted: boolean;
  loadDemo: (workerId?: WorkerId) => Promise<void>;
  switchWorker: (workerId: WorkerId) => Promise<void>;
  simulateGoalCompletion: () => void;
  dismissCelebration: () => void;
  demoWorkers: WorkerId[];
}

export const useAppStore = create<AppState>((set, get) => ({
  loaded: false,
  loading: false,
  workerId: 'W-0001',
  summary: null,
  deficits: {},
  celebrationVisible: false,
  goalCompleted: false,
  demoWorkers: DEMO_WORKERS,

  loadDemo: async (workerId) => {
    set({ loading: true });
    // Brief intentional delay for the welcome loading state
    await new Promise((r) => setTimeout(r, 700));
    const id = workerId ?? get().workerId;
    const bundle = loadWorkerBundle(id);
    const summary = computeFinancialSummary({
      worker: bundle.worker,
      earnings: bundle.earnings,
      transactions: bundle.transactions,
      obligations: bundle.obligations,
      deficits: get().deficits,
      forceGoalComplete: get().goalCompleted && id === get().workerId,
    });
    set({
      loaded: true,
      loading: false,
      workerId: id,
      summary,
    });
  },

  switchWorker: async (workerId) => {
    set({ loading: true, goalCompleted: false, celebrationVisible: false, deficits: {} });
    await new Promise((r) => setTimeout(r, 400));
    const bundle = loadWorkerBundle(workerId);
    const summary = computeFinancialSummary({
      worker: bundle.worker,
      earnings: bundle.earnings,
      transactions: bundle.transactions,
      obligations: bundle.obligations,
      deficits: {},
    });
    set({ loaded: true, loading: false, workerId, summary });
  },

  simulateGoalCompletion: () => {
    const { workerId, deficits } = get();
    const bundle = loadWorkerBundle(workerId);
    const summary = computeFinancialSummary({
      worker: bundle.worker,
      earnings: bundle.earnings,
      transactions: bundle.transactions,
      obligations: bundle.obligations,
      deficits,
      forceGoalComplete: true,
    });
    set({
      goalCompleted: true,
      celebrationVisible: true,
      summary,
    });
  },

  dismissCelebration: () => set({ celebrationVisible: false }),
}));
