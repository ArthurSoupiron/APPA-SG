export function formatBcDisplayLabel(type: string, bcNumber: string): string {
  const t = type.trim();
  const n = bcNumber.trim();
  if (n.length === 0) return t;
  if (n.toUpperCase().startsWith(t.toUpperCase())) return n;
  return `${t} ${n}`;
}
