import type { Category, ProductInput } from '@/types'
import { parseCsv } from '@/lib/csv'
import { parseMvr } from '@/lib/money'

export const PRODUCT_CSV_HEADER = 'name,category,price,cost_price,barcode,track_stock,current_stock,gst_applicable'

export const productCsvTemplate = () => `${PRODUCT_CSV_HEADER}\nCoca-Cola 330ml,Beverages,12.00,9.50,1234567890123,true,24,true`

const bool = (v: string) => /^(true|yes|1)$/i.test(v.trim())

export function parseProductCsv(text: string, categories: Category[]) {
  const rows: ProductInput[] = []
  const errors: { line: number; message: string }[] = []
  const [head, ...body] = parseCsv(text)
  if (!head || head.map((h) => h.trim().toLowerCase()).join(',') !== PRODUCT_CSV_HEADER) {
    return { rows, errors: [{ line: 1, message: 'The first line must be the template header' }] }
  }
  body.forEach((r, i) => {
    const line = i + 2
    const [name = '', category = '', price = '', cost = '', barcode = '', track = '', stock = '', gst = ''] = r.map((f) => f.trim())
    const err = (message: string) => errors.push({ line, message })
    if (!name) return err('Name is empty')
    const cat = categories.find((c) => c.name.toLowerCase() === category.toLowerCase())
    if (!cat) return err(`Unknown category "${category}"`)
    const p = parseMvr(price)
    if (p === null) return err('Price is not a valid amount')
    const c = cost ? parseMvr(cost) : undefined
    if (c === null) return err('Cost price is not a valid amount')
    const s = stock ? Number(stock) : 0
    if (!Number.isInteger(s) || s < 0) return err('Stock must be a whole number')
    rows.push({
      name, categoryId: cat.id, price: p, costPrice: c, barcode: barcode || undefined,
      trackStock: bool(track), currentStock: s, lowStockThreshold: 5, gstApplicable: gst ? bool(gst) : true, isHidden: false,
    })
  })
  return { rows, errors }
}
