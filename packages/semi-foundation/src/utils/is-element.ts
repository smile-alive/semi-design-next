// Returns a plain boolean: an inferred `obj is HTMLElement` predicate would wrongly narrow callers' Element types.
// Also called during SSR (e.g. Tooltip), where HTMLElement does not exist.
export default function isElement(obj: any) {
    return typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement;
}
