import { isValidElement } from 'react';

export const REACT_LAZY_TYPE = Symbol.for('react.lazy');

interface MarkedType {
    elementType?: string;
    $$typeof?: symbol;
    _payload?: unknown;
    _init?: (payload: unknown) => MarkedType;
}

/**
 * Components mark themselves with a static elementType (Icon, Button, Tabs.TabPane) so a parent can recognize them
 * among its children. Property access, not `in`: the type of Fragment, Suspense and StrictMode is a symbol.
 * A Server Component's element carries a client component as a lazy type; `_init` returns the component once the
 * module is loaded (the Flight payload preloads it). A type still loading reads as unmarked, since this also runs
 * outside render where its thrown thenable cannot suspend.
 */
export default function elementTypeOf(node: unknown): string | undefined {
    if (!isValidElement(node)) {
        return undefined;
    }
    let type = node.type as MarkedType;
    while (type?.$$typeof === REACT_LAZY_TYPE) {
        try {
            type = type._init(type._payload);
        } catch (thrown) {
            if (typeof (thrown as PromiseLike<unknown>)?.then === 'function') {
                return undefined;
            }
            throw thrown;
        }
    }
    return type?.elementType;
}
