# Antlr: handoff note for the backend developer

This repository is the **front end only**. It runs on demo data kept in memory.
**How the backend works (API style, endpoints, database, login, rules on the server) is your decision.** Nothing here is an API design.
This note tells you where the screens get their data, and what each screen expects to happen when it saves something.

## 1. Where the data comes from

```
src/types/index.ts   every data shape (Product, Sale, Order, Shift, …)
src/data/hooks.ts    the ONLY file screens import for data  ← connect here
src/data/store.ts    demo store: in-memory data + the actions that change it
src/data/seed.ts     starting demo data
src/data/network.ts  fake network: short wait, and a switch to make saves fail
```

- **Reading:** screens call `useProducts()`, `useOrders()`, `useOpenShift()` and so on. They re-render when the data changes.
- **Saving:** screens call `useActions()`. Every action returns a **Promise**. The screens already wait for it, show "Saving…", and show the error message if it rejects. The text of a rejected `Error` is shown to the cashier, so keep it short and plain.
- To connect a real backend, you can replace what `hooks.ts` returns. The screens should not need changes.
- To see every error message in the app: **Settings → Data → Make every save fail**.

## 2. Money and tax

- All money is a whole number of **laari** (1 MVR = 100 laari). No decimals anywhere.
- GST rate is in **basis points** in settings (`gstRateBps: 800` = 8%).
- The demo works out totals with `src/lib/tax.ts` (GST per line, rounded to the laari, then added up). The screens show these totals, but a real server should work out the final totals itself. **Check the rounding rule and the current rate with MIRA.**

## 3. What each save is expected to do

These are what the screens expect to see after a save succeeds. How you make it happen is up to you.

### Sales
| Action | What the screen sends | What the screen expects |
|---|---|---|
| `completeSale(cart, payments)` | product ids, quantities, line discounts, cart discount, payments | returns the new `Sale` (the receipt is printed from it). Sale number `ANTLR-YYYYMMDD-NNN`, restarting at 001 each day. Stock goes down for products that track stock (not below 0). The open shift's totals per payment type go up. **Fails if no shift is open.** |
| `refundSale(saleId, lines, method, reason?)` | which lines and how many | returns the updated `Sale`. Status becomes "Part refunded" or "Refunded". Stock comes back. The shift's refund totals go up. **Fails if more than what is left is refunded.** |
| `holdSale(draft, label, total)` / `removeHeldSale(id)` | the cart | held sales list changes (used to park a sale and resume it later) |

### Restaurant
| Action | What the screen expects |
|---|---|
| `createOrder(input)` | returns the new `Order` (the screen opens it). For a table: table becomes "Ordering" and points to the order. **Fails if no shift is open.** |
| `updateOrderItems(orderId, items)` | order lines and totals updated. Options (modifiers) add their extra price. |
| `setOrderItemStatus(orderId, itemId, 'void' \| 'comp', reason)` | the line stays visible but no longer counts toward the total. A reason is always given. |
| `setOrderStatus(orderId, status)` | Open → In kitchen → Served → Bill requested. The table status follows the order. "Cancelled" frees the table. |
| `mergeOrders(fromId, toId)` | all lines move to the second order. The first order is gone and its table is free. |
| `payOrder(orderId, payments)` | returns the new `Sale`, made from the lines that still count. The order becomes Paid and the table is free. |
| `addTable`, `updateTable`, `deleteTable`, `setTableCount(n)` | table list changes. **`deleteTable` fails if the table has an open order.** `setTableCount` never removes a busy table. |

### Shifts
| Action | What the screen expects |
|---|---|
| `openShift(name, openingFloat)` | returns the new open shift. **Fails if a shift is already open.** Only one shift can be open. |
| `addCashMovement('pay_in' \| 'pay_out', amount, reason)` | added to the open shift |
| `closeShift(countedCash)` | returns the closed shift with expected cash and the difference (variance). Expected cash = opening float + cash sales − cash refunds + pay-ins − pay-outs (`src/lib/shift.ts`). |

### Products and settings
| Action | What the screen expects |
|---|---|
| `addProduct`, `updateProduct`, `updateProducts(ids, patch)`, `deleteProducts(ids)` | product list changes. Hide/show uses `isHidden`. Product photos are sent as data URLs today. |
| `addCategory`, `renameCategory`, `deleteCategory(id, moveProductsTo?)` | **`deleteCategory` fails if the category still has products and no target category is given.** |
| `updateSettings(patch)` | settings change everywhere at once (shop details, GST, receipt text, payment types, business type). |
| `resetDemoData()` | demo only. A real backend does not need this. |

## 4. What the front end does not have yet

- No login or staff accounts. The cashier name is typed when a shift opens.
- Sale numbers are made by the demo store. With more than one till, they must come from one place.
- Data is lost when the page reloads (demo only).
- No real printer driver. Receipts use the browser's print, sized for 80 mm paper.
- An open order in the order builder is not remembered when you switch screens. The order itself is saved; open it again from Floor or Orders.
- A settings section being edited keeps its own copy. If the same setting changes elsewhere while it is open, it shows the old value until reopened.
- A refund made when no shift is open is saved on the sale but not added to any shift's refund totals.

## 5. Hosting

The front end is deployed to Cloudflare Workers as static files (`wrangler.jsonc`, Node 22 in `.node-version`). Pushes to `main` build and deploy automatically. Adding a backend (a Worker script, another service, a database) is up to you; `wrangler.jsonc` is the place to add Worker code or bindings if you choose Cloudflare.

## 6. Run and check

```bash
npm install && npm run dev     # http://localhost:5173
npm test                       # 102 tests; they describe the expected behaviour above
npm run lint && npm run build
```

More detail: `README.md` (folders and design rules) and `docs/decisions.md` (product and code decisions, with reasons).
