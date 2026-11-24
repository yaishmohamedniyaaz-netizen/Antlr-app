import type { Laari, SaleItem } from '@/types'
import { divRound } from './money'

/** Money back for `qty` of a sale line: the share of what the customer paid for that line. */
export const refundLineAmount = (item: Pick<SaleItem, 'paidTotal' | 'quantity'>, qty: number): Laari =>
  divRound(item.paidTotal * qty, item.quantity)
