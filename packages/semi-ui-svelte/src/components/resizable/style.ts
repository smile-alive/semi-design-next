/** Joins CSS declaration strings in order; later declarations of the same property win */
export function joinStyle(...layers: (string | Record<string, string | undefined> | undefined)[]) {
    return layers
        .map((layer) =>
            typeof layer === 'string'
                ? layer
                : Object.entries(layer ?? {})
                      .flatMap(([name, value]) => (value === undefined ? [] : [`${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}:${value}`]))
                      .join(';')
        )
        .filter(Boolean)
        .join(';');
}
