# Rich Horizon Workflow Implementation

## Existing repository structure

- Expo Router app under `app/` with welcome entry and tab destinations
- Domain, store, theme, utils, and components under `src/`
- Brand theme: Woodland Green `#346023`, Apple Green `#3DA542`, white
- Money helpers store values as integer cents and format with `en-CA`
- Prior demo-worker engine (`financialEngine.ts`, `demoWorker.ts`) kept on disk

## Architecture decisions

- **State:** Zustand `financeStore` holds income sources, expenses, goals, buckets, income entries, allocations, transactions, and the current allocation draft (in-memory)
- **Persistence boundary:** No AsyncStorage yet; store is the single in-memory source of truth
- **Navigation:** Expo Router stack for setup/forms/allocation; tabs are Today | Plan | Add | Activity | Goals
- **Calculations:** Pure functions in `src/domain/allocationEngine.ts` (normalization, funding requirements, waterfall allocation, deficits, warnings, bill cliff)
- **Money:** Integer cents throughout; Canadian dollar display via `formatCAD`

## Files added or changed

### Added

- `src/domain/financeTypes.ts`
- `src/domain/allocationEngine.ts`
- `src/data/sampleFinance.ts`
- `src/store/financeStore.ts`
- `src/components/{EmptyState,ProgressBar,SetupProgress,PrimaryButton,FormField}.tsx`
- `src/utils/labels.ts`
- `app/setup/*` onboarding screens
- `app/income/*`, `app/expense/form.tsx`, `app/goal/form.tsx`, `app/transaction/form.tsx`
- `app/allocation/[incomeEntryId].tsx`
- `app/(tabs)/add.tsx`, `app/(tabs)/activity.tsx`
- `docs/RICH_HORIZON_WORKFLOW_IMPLEMENTATION.md`

### Changed

- Welcome, root layout, tabs layout, Today, Plan, Goals
- `SafeToSpendCard` copy/props for the manual workflow

### Removed from tabs

- Insights tab replaced by Activity (old insights screen removed from routing)

## Simplifications for the prototype

- In-memory store only (no local persistence)
- Custom allocation method starts from recommendations and edits on review
- Date fields use `YYYY-MM-DD` text input
- Import spreadsheets not exposed (CSV helper remains unused)
- Demo-worker path is no longer the primary welcome flow

## Remaining limitations

- State resets when the app reloads
- No automated tests for the allocation engine
- No spreadsheet import UI
- Advanced forecasting beyond next-bill cliff is not implemented
- Deleted income sources show as “Deleted income source” in history rather than cascading cleanup
