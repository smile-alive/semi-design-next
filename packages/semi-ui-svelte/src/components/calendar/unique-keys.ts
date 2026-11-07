/**
 * Pairs each item with a key that is unique in the list: its own `key`, or its position when that is empty or already
 * taken. A keyed `{#each}` throws on a duplicate key, while React and Vue only warn, and an event list comes from the caller.
 */
export function withKeys<T extends { key?: string }>(items: readonly T[], scope: string) {
    const seen = new Set<string>();
    return items.map((item, index) => {
        const id = item.key && !seen.has(item.key) ? item.key : `${scope}#${index}`;
        seen.add(id);
        return { id, item };
    });
}
