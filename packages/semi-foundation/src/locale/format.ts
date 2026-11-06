/**
 * Fills `${name}` placeholders of a locale string. Values are inserted verbatim (a string `replace` would interpret
 * `$&` and `$1` in them); placeholders without a value are kept as written.
 */
export function formatLocale(template: string, values: Record<string, string | number>): string {
    return template.replace(/\$\{(\w+)\}/g, (placeholder, key: string) => (Object.hasOwn(values, key) ? String(values[key]) : placeholder));
}
