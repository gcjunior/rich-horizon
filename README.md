# Rich Horizon

iOS prototype (Expo + React Native + TypeScript) that helps daily / gig workers allocate each paycheck before spending it.

> Every dollar gets a purpose before it is spent.
>
> Daily earners are paid in drips. Their bills arrive in cliffs.

## Run

```bash
npm install
npx expo start
```

Then open in iOS Simulator or Expo Go.

## Demo data

`assets/demo/demo_dataset.json` contains filtered rows from the supplied CSVs for:

- **W-0001** — Moving helper (surplus path)
- **W-0202** — Cleaning / janitorial (constrained path)

Earned-wage advances are loaded but **never counted as income**. Spreadsheet running balances are ignored; values are recomputed in `src/domain/financialEngine.ts`.

## Next steps (not in this prototype)

1. `expo-sqlite` persistence for deficits and reserved amounts
2. Interactive CSV import via `expo-document-picker`
3. Local notifications on goal completion
4. Full multi-worker browse experience
