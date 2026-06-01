/** Colonne Excel/Sheets (1 = A, 27 = AA). */
export function sheetColumnLetter(columnIndex1Based: number): string {
  let n = columnIndex1Based;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function sheetRowRange(tab: string, rowIndex: number, columnCount: number): string {
  const end = sheetColumnLetter(columnCount);
  return `${tab}!A${rowIndex}:${end}${rowIndex}`;
}

export function sheetAppendRange(tab: string, columnCount: number): string {
  const end = sheetColumnLetter(columnCount);
  return `${tab}!A:${end}`;
}
