import { type JSX, createMemo, onCleanup, untrack } from 'solid-js';
import { isServer } from 'solid-js/web';

const placedNodes = new WeakSet<Node>();

function place(content: unknown) {
    if (typeof content === 'function') {
        return untrack(content as () => JSX.Element);
    }
    // server markup is a string, which renders in any number of places
    if (!isServer && content instanceof Node) {
        if (placedNodes.has(content)) {
            return content.cloneNode(true);
        }
        placedNodes.add(content);
        onCleanup(() => placedNodes.delete(content));
    }
    return content as JSX.Element;
}

/**
 * An event's content, rendered in every place the event shows: a span split across week rows or day columns, the month
 * card. A function is called once per place. A DOM node can sit in one place only, so the first live place shows the
 * node itself and the others a copy, which has no event handlers.
 */
export default function EventContent(props: { of: unknown }) {
    // by identity: the layout code hands over new event objects with the same content on every update
    const content = createMemo(() => props.of);

    return <>{place(content())}</>;
}
