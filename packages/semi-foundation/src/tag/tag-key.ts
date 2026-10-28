/**
 * Item keys for a TagGroup list. A caller's tagKey wins; text labels are keyed by text and occurrence so that
 * removing a tag in its close callback does not hand the next tag the closed instance's hidden state; anything else
 * falls back to the index.
 */
export function getTagListKeys(tags: ReadonlyArray<{ tagKey?: string | number; children?: unknown }>) {
    const seen = new Map<string, number>();
    return tags.map(({ tagKey, children }, index) => {
        if (tagKey != null) {
            return tagKey;
        }
        if (typeof children !== 'string' && typeof children !== 'number') {
            return index;
        }
        const text = String(children);
        const nth = seen.get(text) ?? 0;
        seen.set(text, nth + 1);
        // shortcut: removing the earlier of two tags with the same text still shifts the later one onto its
        // instance; upgrade by asking callers to provide tagKey
        return `${text}#${nth}`;
    });
}
