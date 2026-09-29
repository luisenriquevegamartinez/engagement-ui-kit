const COUNTER = Symbol.for('cw-ui-kit.unique-id');

/**
 * Returns a document-unique id such as `cw-select-3`.
 *
 * The counter lives on `globalThis` under a `Symbol.for` key rather than in
 * module scope, so two copies of the kit loaded into one page (e.g. different
 * versions pulled in by federated remotes) share one sequence. With a
 * module-level counter each copy would start at 1, and ARIA references such as
 * `aria-activedescendant` could resolve to another component's element.
 */
export function uniqueId(prefix: string): string {
  const registry = globalThis as unknown as Record<symbol, number | undefined>;
  const next = (registry[COUNTER] ?? 0) + 1;
  registry[COUNTER] = next;
  return `${prefix}-${next}`;
}
