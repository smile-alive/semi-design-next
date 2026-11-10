import { type ReactNode, use } from 'react';
import { REACT_LAZY_TYPE } from '../utils/element-type';

interface LazyNode {
    $$typeof: symbol;
    _payload: PromiseLike<ReactNode>;
}

function isLazyNode(node: unknown): node is LazyNode {
    if (typeof node !== 'object' || node === null) {
        return false;
    }
    const { $$typeof, _payload } = node as Partial<LazyNode>;
    return $$typeof === REACT_LAZY_TYPE && typeof _payload?.then === 'function';
}

/**
 * In dev the Flight client hands a Server Component's element to the browser as a lazy node while its owner and debug
 * stack chunks are pending; the server gets the plain element. Code that inspects a child (`isValidElement`,
 * `cloneElement`) reads it through this hook, or client and server render different trees. The payload is a Flight
 * chunk that `use()` reads; it can resolve to another lazy node, so this loops like Radix Slot does.
 */
export default function useUnwrappedLazy<T>(node: T) {
    let resolved: unknown = node;
    while (isLazyNode(resolved)) {
        resolved = use(resolved._payload);
    }
    return resolved as T;
}
