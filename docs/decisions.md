# Decisions

Product and code decisions made in this front end, with the reason for each. For the handoff summary, read `HANDOFF.md` first.

## Stack

- Vite 8, React 19, TypeScript 7, Tailwind v4, oxlint, Vitest.
- UI components are shadcn/ui (new-york style) in `src/components/ui`. Zoom and slide animations were removed; dialogs only fade, 150 ms or less.
- Screens are lazy-loaded per route, which keeps the first load small.
- Button variants: `default` is the neutral bordered button; `primary` is the orange accent. Orange is opt-in, so each screen has only one accent action.

## Money and tax

- All money is whole laari (1 MVR = 100 laari). `divRound` in `lib/money.ts` rounds half-up with integers only.
- A cart discount is split across lines in proportion to their amounts. Refunds use the share the customer actually paid for each line (`lib/refund.ts`), so the refund total on screen matches what is recorded.
- A split payment is several payments on one sale. There is no separate "split" payment type.
- The only `toFixed` in the code formats the GST percent label (`formatRate`), not money.

## Demo data

- Sale numbers look like `ANTLR-YYYYMMDD-NNN` (local date).
- Sale totals in the demo data are computed with the same GST math as the app.
- The demo store refuses some actions with a message ("No open shift", "Refund is more than was sold", "This table has an open order", "Category has products"). The screens check these first; the store messages are a safety net and describe the expected behaviour, not an API.

## Sales screen

- The current sale is kept when you leave the Sales screen and come back.
- Cart lines use the product's current price, so a price edit shows up in the cart.
- Pressing Enter in search adds the product when exactly one product matches (name or barcode).
- Each cart line can have its own discount.
- Right-click or long-press on a product tile opens a small menu.

## Checkout and receipts

- Split payment: press "Split payment", then pay each part. Non-cash parts take a typed amount; the cash part takes the cash received.
- The receipt is one component, used at checkout and for reprints from History. "Show logo on receipt" prints a small Antlr mark.

## Restaurant

- The order builder replaces the page (it is not a dialog) on Floor, Orders and Takeaway, and reuses the Sales product grid.
- Adding items to an order already sent to the kitchen puts it back to "Open", so "Send to kitchen" shows for the new items. Quantity steppers only show while an order is Open; after that, use Void or Make free with a reason.
- A dine-in order with no active items can be cancelled, which frees the table.

## Products

- CSV rows with an unknown category are skipped with an error, not created. This avoids new categories from typos.
- Manage categories, Import CSV and Download template are under a "More" menu next to "Add product".

## Shifts and reports

- Expected cash = opening float + cash sales + pay-ins − pay-outs − cash refunds (`lib/shift.ts`).
- Report revenue is after refunds. The hourly chart shows 6:00 to 23:00; sales outside those hours are still in the totals.

## Settings and setup

- First-run setup asks the business type. Food businesses get the dish options step; takeaway types get the Viber switch; restaurant types get tables.
- Settings > Business has "Run the setup steps again".

## Logo

- The mark has 3 points per side at every size. At 16 px it uses a pixel-grid version (1-pixel bars and gaps); up to 24 px it uses a 12-unit version. The app snaps small marks to 16 or 24 px so the bars stay sharp.
- `src/brand/logoPaths.ts` has the same shapes as the SVG files in `design/logo/final`. A white lockup is there for dark backgrounds.
