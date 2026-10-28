import type { JSX } from 'solid-js';

/**
 * Calls a consumer's event handler prop in either form Solid accepts: a function or a bound `[handler, data]` pair.
 * A component that handles the same event itself splits the prop out and calls this first, since spreading the prop
 * and writing its own handler would keep only one of them.
 */
export default function callHandler<T, E extends Event>(handler: JSX.EventHandlerUnion<T, E> | undefined, event: E & { currentTarget: T; target: Element }) {
    if (typeof handler === 'function') {
        handler(event);
    } else if (handler) {
        handler[0](handler[1], event);
    }
}
