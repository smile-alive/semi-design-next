import { type Accessor, type ChildrenReturn, type JSX, children, createComponent, createRenderEffect } from 'solid-js';
import { isServer } from 'solid-js/web';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { type IconSize, type IconSlot, IconSlotContext } from '@fibrae/semi-icons-solid';
import hasContent from './has-content';

export type SlotKind = 'text' | 'icon' | 'node' | undefined;

export interface IconSlotReturn extends ChildrenReturn {
    // How an input-like field styles the slot: a lone text, a lone Semi icon, other content, or nothing
    kind: Accessor<SlotKind>;
}

const iconClass = `${BASE_CLASS_PREFIX}-icon`;

// Sizes this module set, keyed by node: an icon shows `default` both when it is unsized and when it was sized so, and
// only the former may be resized. A node that was already resized is ours, whatever class it carries now.
const fitted = new WeakMap<Element, string>();

function fitSize(node: Element, size: string) {
    if (!node.classList.contains(iconClass)) {
        return;
    }
    const current = fitted.get(node) ?? (node.classList.contains(`${iconClass}-default`) ? 'default' : undefined);
    // an icon that carries another size class chose its own size
    if (current === undefined) {
        return;
    }
    if (current !== size) {
        node.classList.replace(`${iconClass}-${current}`, `${iconClass}-${size}`);
    }
    fitted.set(node, size);
}

/**
 * Resolves a slot whose Semi icons take `size` unless they carry their own, and whose elements take `className`.
 *
 * An icon created inside the slot reads the slot from context and registers the node it renders, so its size, class
 * and the slot's kind come out the same on the server and in the browser. Content created before it reached the slot
 * (JSX in a data object such as `Modal.confirm({ icon })`) cannot see the context; the browser fits
 * those elements as React's cloneElement would, and the server HTML goes without (registered in component-issues).
 *
 * shortcut: size and class reach every Semi icon created under the slot, also one nested in other content
 * (`<Badge><IconX /></Badge>`); upgrade when such nesting shows up in a sized slot, by resetting the context in the
 * nesting component.
 */
export function createIconSlot(source: () => JSX.Element, size?: Accessor<IconSize | undefined>, className?: Accessor<string | undefined>): IconSlotReturn {
    // Not a signal: icons register while `resolved` evaluates, and a re-evaluation disposes the old icons before the
    // new ones register, so a reader that reads `resolved` first sees the matching set
    const icons = new Set<JSX.Element>();
    const slot: IconSlot = {
        size,
        class: className,
        register: (node) => {
            icons.add(node);
            return () => icons.delete(node);
        },
    };
    const resolved = children(() =>
        createComponent(IconSlotContext.Provider, {
            value: slot,
            get children() {
                return source();
            },
        })
    );
    createRenderEffect((previous?: { nodes: Element[]; className?: string }) => {
        if (isServer) {
            return previous;
        }
        const nodes = resolved.toArray().filter((node): node is Element => node instanceof Element && !icons.has(node));
        const next = className?.();
        const fitTo = size?.();
        if (previous?.className) {
            for (const node of previous.nodes) {
                node.classList.remove(previous.className);
            }
        }
        for (const node of nodes) {
            if (next) {
                node.classList.add(next);
            }
            if (fitTo) {
                fitSize(node, fitTo);
            }
        }
        return { nodes, className: next };
    });
    const kind = (): SlotKind => {
        const node = resolved();
        if (!hasContent(node)) {
            return undefined;
        }
        if (typeof node === 'string' || typeof node === 'number') {
            return 'text';
        }
        const lateIcon = !isServer && node instanceof Element && node.classList.contains(iconClass);
        return icons.has(node as JSX.Element) || lateIcon ? 'icon' : 'node';
    };
    return Object.assign(resolved, { kind });
}
