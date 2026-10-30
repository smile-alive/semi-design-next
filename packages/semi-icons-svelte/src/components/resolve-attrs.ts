export function resolveAttrs(attrs: Record<string, string>, resolve: (value: string) => string): Record<string, string> {
    return Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, resolve(value)]));
}
