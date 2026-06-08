/** Descendants atteignables depuis `rootId` en suivant uniquement les arêtes `source → target`. */
export function descendantIds(
  rootId: string,
  edges: { source: string; target: string }[],
): Set<string> {
  const bySource = new Map<string, string[]>();
  for (const e of edges) {
    if (!bySource.has(e.source)) bySource.set(e.source, []);
    bySource.get(e.source)!.push(e.target);
  }
  const out = new Set<string>();
  const stack = [...(bySource.get(rootId) ?? [])];
  while (stack.length) {
    const c = stack.pop()!;
    if (out.has(c)) continue;
    out.add(c);
    for (const t of bySource.get(c) ?? []) stack.push(t);
  }
  return out;
}
