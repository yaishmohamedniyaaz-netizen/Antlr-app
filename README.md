# Antlr POS (front end)

Point-of-sale app for shops, cafés and restaurants in the Maldives: sales, tables, kitchen orders, takeaway, products, refunds, shifts and reports. Prices are in MVR with GST.

This repository is the **user interface only**. It runs on demo data kept in memory. There is no backend, login or database yet.

**Backend developer: start with [HANDOFF.md](HANDOFF.md).**

## Run it

Needs Node.js 22 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit and screen tests (Vitest)
npm run lint       # oxlint
npm run build      # type check + production build into dist/
```

## Folder map

```
src/
  app/          router, layout (sidebar + top bar), menu items per business type
  brand/        Antlr logo components (same shapes as design/logo/final)
  components/   shared pieces: Money, PageHeader, EmptyState, Numpad, ShiftGate
  components/ui shadcn/ui components (Radix + Tailwind), lightly restyled
  features/     one folder per screen
    sales/        till: product grid, cart, hold/resume, keyboard shortcuts
    checkout/     payment, discount and receipt dialogs (shared)
    orders/       floor, orders list, takeaway, order builder
    products/     product list, product form, categories, CSV import
    history/      past sales, refunds, reprint, CSV export
    shifts/       open/close shift, pay-ins and pay-outs
    reports/      totals, by payment type, by hour, top products
    settings/     settings sections and the first-run setup steps
  data/         demo data and everything that reads or changes it
  lib/          money, GST, formatting, CSV and other plain helpers
  types/        shared TypeScript types
design/logo/    final logo SVG files
docs/           decisions.md: product and code decisions, with reasons
```

## Data

- All data is **demo data** in `src/data/`: `seed.ts` (starting data), `store.ts` (an in-memory store and the actions that change it) and `hooks.ts`.
- Screens read and change data **only** through the hooks in `src/data/hooks.ts` (`useProducts()`, `useActions()` and so on). No screen imports `store.ts` or `seed.ts`.
- Every action returns a Promise. Screens show "Saving…" while it runs and the error message if it fails. Settings → Data has a switch that makes every save fail.
- The store's actions copy what the old app did so the demo feels real (sale numbers, stock going down, shift totals, table status). They are **not** an API design. How the real backend works, and how it connects to these hooks, is for the backend developer to decide.
- Reloading the page resets the demo data.

## Money and tax

- All money is stored as whole **laari** (1 MVR = 100 laari) to avoid rounding errors. See `src/lib/money.ts`.
- The GST rate is stored in **basis points** (`800` = 8%) in settings, never written in code.
- GST is worked out per line and rounded to the laari, then added up (`src/lib/tax.ts`). Check this rounding rule, and the current GST rate, against MIRA rules before going live.

## Design rules

- Font: Manrope, numbers in tabular figures, plain zero.
- Grey and white; one orange accent (`#E0591B`) for the main action on each screen only (`<Button variant="primary">`). The default button is neutral.
- 6 px corners, 1 px borders, shadows only on dialogs and menus, no gradients.
- Cashier controls are at least 44 px tall. Target screens are 1024 px wide and up.
