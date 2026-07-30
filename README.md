# Rich Horizon 💚📈

## Project Overview

A mobile app that helps workers with variable daily, hourly, or gig income allocate each paycheck **before** spending it.

**Target audience:** Daily earners, gig workers, and hourly workers whose income arrives in drips while large monthly bills arrive together.

## The Problem

Traditional budgeting apps show where money went. That is too late for people paid day by day.

Daily workers face a real cash-flow mismatch:

- **Income arrives in drips** — one shift, one delivery day, one gig at a time
- **Bills arrive in cliffs** — rent, phone, childcare, and utilities often hit on the same due dates
- **“Available balance” lies** — money that looks spendable is already spoken for by upcoming obligations
- **Low-income days get forgotten** — shortfalls are not carried forward into the next stronger day
- **Earned-wage advances feel like income** — borrowing against tomorrow quietly deepens the cliff

## The Solution

Rich Horizon replaces after-the-fact budgeting with **purpose-first allocation**.

Every dollar from today’s income is assigned in priority order:

1. Required monthly obligations
2. Emergency / volatility buffer
3. Savings or investment goal
4. Safe to spend

The hero number is **safe to spend today** — never a negative “spendable” balance. If bills are underfunded, the app shows a funding gap instead.

> Every dollar gets a purpose before it is spent.
>
> Daily earners are paid in drips. Their bills arrive in cliffs.

All money is stored and calculated as **integer cents**.

## How It Works

### 1. Load demo financial data

Open the welcome screen and choose a demo worker:

- **Moving helper · Calgary (W-0001)** — surplus path with room for goals
- **Cleaning · constrained (W-0202)** — tight cashflow / funding-gap demo

Tap **Load Demo Financial Data** to parse the bundled dataset, filter records for that worker, and calculate the financial summary.

### 2. Review today’s allocation

The Today dashboard shows:

- **Safe to spend today** — conservative value based on the income floor
- **Today’s income** — latest selected workday net earnings
- **Allocation waterfall** — how today’s pay is split across bills, buffer, goals, and spend
- **Next best action** — one deterministic recommendation derived from the calculated data

### 3. Understand the bill cliff

The Bill Cliff screen groups essential recurring obligations by next due date and highlights the date with the highest total. It shows:

- Bills due and amounts
- Total / funded / still needed
- Equivalent average workdays required to cover the cliff

### 4. Track goals and celebrate progress

Goals include:

- **First Horizon** — cover the next bill cliff without borrowing
- **Future Investment** — money reserved for future investing (no stock tips, no return promises)

Tap **Simulate goal completion** to trigger the original **Million-Dollar Face** celebration mascot with confetti.

### 5. Spot flexible spending trade-offs

Insights lists the top discretionary categories and one mathematically supported trade-off — for example, redirecting restaurant spend toward a phone bill — without judgmental language.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo SDK 53](https://docs.expo.dev/) / React Native 0.79 |
| Language | TypeScript |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| CSV parsing | [Papa Parse](https://www.papaparse.com/) |
| Animation | [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| Money math | Pure TypeScript domain engine (`src/domain/`) — integer cents |

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- iOS Simulator via [Xcode](https://developer.apple.com/xcode/) and/or [Expo Go](https://expo.dev/go) on a device
- Optional for native builds: Xcode (iOS) and/or [Android Studio](https://developer.android.com/studio) (Android)

### 1. Clone the repository

```bash
git clone https://github.com/gcjunior/rich-horizon.git
cd rich-horizon
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

Then press `i` for the iOS Simulator, scan the QR code with Expo Go, or run:

```bash
npm run ios      # iOS (requires Xcode)
npm run android  # Android (requires Android Studio / emulator)
```

No API keys or `.env` file are required for the demo — all data stays local.

## Project Structure

```
app/                 Screens — welcome, today, bill cliff, goals, insights (Expo Router)
src/components/      Safe-to-spend, allocation waterfall, bill cliff, goals, celebration UI
src/domain/          Pure financial engine, spending analysis, shared types
src/data/            Demo worker adapter + CSV helper (Papa Parse)
src/store/           Zustand app state
src/theme/           Rich Horizon colors and spacing
src/utils/           Money (cents) and date helpers
assets/demo/         Filtered CSV-derived demo dataset for W-0001 and W-0202
```

## Important Notes

- **Demo data is bundled** from the supplied CSVs into `assets/demo/demo_dataset.json` for reliable Expo loading. Interactive document-picker import is a documented next step.
- **Do not trust spreadsheet running balances.** Safe-to-spend, accruals, and cliffs are recomputed from earnings, obligations, and transaction direction/amount.
- **Earned-wage advances are never counted as income.**
- **Safe to spend is never shown as a negative spendable amount.** Shortfalls appear as a funding gap.
- **SQLite persistence** is intentionally deferred for this prototype; the demo uses an in-memory Zustand store.

## License

Private — see repository owner for usage terms.
