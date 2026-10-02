/**
 * Client-side CSV export utility.
 * Converts an array of objects to CSV and triggers a browser download.
 */

export function exportToCsv(filename: string, rows: Record<string, unknown>[], headers?: { key: string; label: string }[]) {
  if (rows.length === 0) {
    alert('No data to export')
    return
  }
  const cols = headers ?? Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
  const escape = (val: unknown) => {
    const s = val == null ? '' : String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const headerLine = cols.map((c) => escape(c.label)).join(',')
  const dataLines = rows.map((r) => cols.map((c) => escape(r[c.key])).join(','))
  const csv = [headerLine, ...dataLines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
