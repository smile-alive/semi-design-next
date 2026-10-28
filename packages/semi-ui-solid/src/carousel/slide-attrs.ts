const NAMES = ['id', 'role', 'aria-labelledby', 'aria-roledescription', 'aria-label'] as const;

type Name = (typeof NAMES)[number];

// A slide is the consumer's own element, so what Carousel writes must give back what the consumer set when the
// carousel switches between tab panels and plain groups
const originals = new WeakMap<Element, Record<Name, string | null>>();

/** Remembers the consumer's attributes; call before the first `writeSlideAttrs` of the element */
export function registerSlide(element: Element) {
    if (!originals.has(element)) {
        originals.set(element, Object.fromEntries(NAMES.map((name) => [name, element.getAttribute(name)])) as Record<Name, string | null>);
    }
}

export function originalAttr(element: Element, name: Name) {
    return originals.get(element)?.[name] ?? null;
}

/** Sets the given attributes; the others return to the consumer's value or disappear */
export function writeSlideAttrs(element: Element, attrs: Partial<Record<Name, string>>) {
    for (const name of NAMES) {
        const value = attrs[name] ?? originalAttr(element, name);
        if (value === null) {
            element.removeAttribute(name);
        } else {
            element.setAttribute(name, value);
        }
    }
}
