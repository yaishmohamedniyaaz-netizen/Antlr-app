/** Next text value of a numpad after pressing `key` (a digit, ".", "delete" or "clear"). */
export function nextValue(value: string, key: string, maxDecimals = 2): string {
  if (key === 'clear') return ''
  if (key === 'delete') return value.slice(0, -1)
  if (key === '.') return value.includes('.') || maxDecimals === 0 ? value : (value || '0') + '.'
  const [, frac] = value.split('.')
  if (frac !== undefined && frac.length >= maxDecimals) return value
  if (value === '0') return key
  return value + key
}

