import type { JSX } from 'solid-js';

const tokenType = Symbol('semi-token');

/** What a collecting parent reads from a child token; the tag stays private to this module */
export interface Token<P> {
    readonly props: P;
}

/**
 * A child component's data for its collecting parent (Tabs.TabPane for Tabs). The props object is kept as received, so
 * every field the parent reads stays reactive and a changed child prop needs no new collection.
 */
// An object, not a function: children() calls zero-argument functions while resolving, objects pass through.
// Inserted alone it renders nothing (Solid warns "Unrecognized value" in dev only), but inside an array Solid turns it
// into "[object Object]" text, so a collecting parent filters tokens out of what it inserts.
// shortcut: content reads context from where the parent renders it, not from where the token was created, so a Provider
// between parent and child does not reach it; if needed, store getOwner() here and read through createRoot((dispose) => ..., owner).
export function createToken<P extends object>(type: string, props: P) {
    return { [tokenType]: type, props } as unknown as JSX.Element;
}

export function isToken<P>(node: unknown, type: string): node is Token<P> {
    return typeof node === 'object' && node !== null && (node as { [tokenType]?: string })[tokenType] === type;
}
