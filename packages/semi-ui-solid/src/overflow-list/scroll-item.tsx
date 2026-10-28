import { type Accessor, type JSX, children, createMemo, createRenderEffect, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import { isHTMLElement } from '@fibrae/semi-foundation/utils/dom';
import isMarkup from '../_base/is-markup';

export interface ScrollItemProps<T> {
    scrollKey: string;
    entry: Accessor<{ item: T; index: number }>;
    render: (item: T, index: number) => JSX.Element;
    /** Called with the item's element; the returned function is called when the element goes away */
    register: (node: HTMLElement) => () => void;
}

// A Solid element already exists when the renderer returns it, so the key the foundation reports by is written onto
// it instead of cloned in. An item without an element (null, text) renders nothing.
export default function ScrollItem<T>(props: ScrollItemProps<T>) {
    const resolved = children(() => props.render(props.entry().item, props.entry().index));

    // On the server the element is markup that cannot take the key, so it renders as given
    const node = createMemo(() => resolved.toArray().find((candidate): candidate is HTMLElement => (isServer ? isMarkup(candidate) : isHTMLElement(candidate))));

    createRenderEffect(() => {
        const element = node();
        if (isServer || !element) {
            return;
        }
        element.dataset.scrollkey = props.scrollKey;
        onCleanup(props.register(element));
    });

    return <>{node()}</>;
}
