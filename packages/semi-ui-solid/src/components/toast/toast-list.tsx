import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, type Setter, untrack } from 'solid-js';
import clsx from 'clsx';
import { FreshItems, getStackDepths, hasLostFocus, isStackExpanded, isStackHidden, readNoticeText } from '@fibrae/semi-foundation/base';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import type { ToastListProps } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/toast/toast.scss';
import { useCSSAnimation } from '../../internal/index';
import { useAnnouncer } from '../../primitives/index';
import { mergeRefs } from '../../utils/index';
import { ToastListContext } from './context';
import Toast, { type ToastProps } from './toast';

const prefixCls = cssClasses.PREFIX;

export default function ToastList(props: ToastListProps) {
    const [hovered, setHovered] = createSignal(false);
    const [focused, setFocused] = createSignal(false);
    const [stackExpanded, setStackExpanded] = createSignal(false);
    const elements = new Map<string, HTMLElement>();
    let innerWrapper: HTMLDivElement | undefined;
    const fresh = new FreshItems();

    const [announcement, announcer] = useAnnouncer();

    // a list renders one store for its whole life
    const store = untrack(() => props.store);

    const [state, setState] = createSignal(store.getSnapshot());

    const list = createMemo(() => state().items as (ToastProps & { id: string })[]);
    const shown = createMemo(() => new Set(list().map((item) => item.id)));
    const byId = createMemo(() => new Map([...list(), ...(state().removedItems as ToastProps[])].map((item) => [item.id, item])));

    // keyed by id: an update in place replaces the item object, and the toast must keep its element and countdown
    const ids = createMemo(() => state().order.filter((id) => byId().has(id)));
    const depths = createMemo(() => getStackDepths(ids().toReversed(), shown()));
    const paused = createMemo(() => hovered() || focused());

    const expanded = () => isStackExpanded(state().stack, stackExpanded(), list().length);

    const enter = (setSource: Setter<boolean>) => {
        setSource(true);
        if (state().stack) {
            setStackExpanded(true);
        }
    };

    const leave = (setSource: Setter<boolean>) => {
        setSource(false);
        if (!paused()) {
            setStackExpanded(false);
        }
    };

    const renderToast = (id: string) => {
        const item = () => byId().get(id) as ToastProps;
        const leaving = () => !shown().has(id);
        const depth = () => depths().get(id) ?? 0;
        const animation = useCSSAnimation({
            startClassName: () => `${prefixCls}-animation-${leaving() ? 'hide' : 'show'}`,
            motion: () => item().motion ?? true,
            onAnimationStart: () => pinAnimatedHeight(elements.get(id)),
            // a late enter-animation end must not cut the leave short
            onAnimationEnd: () => {
                if (leaving()) {
                    store.finishLeave(id);
                }
            },
        });
        onCleanup(() => elements.delete(id));
        return (
            <Toast
                {...item()}
                ref={mergeRefs(animation.ref, (element: HTMLDivElement) => elements.set(id, element))}
                class={clsx(item().class, animation.className(), { [`${prefixCls}-stack-hidden`]: isStackHidden(expanded(), depth()) })}
                positionInList={{ length: list().length, index: list().length - 1 - depth() }}
                stack={state().stack > 0}
                // collapse the slot while leaving so toasts below move up instead of jumping on unmount
                stackExpanded={expanded() && !leaving()}
                close={(toastId) => store.remove(toastId)}
            />
        );
    };

    onMount(() => {
        onCleanup(store.subscribe(() => setState(store.getSnapshot())));
        // the store may have changed between the first read and the subscription
        setState(store.getSnapshot());
    });

    // Toasts new to the list or updated in place; alerts announce themselves
    createEffect(
        on(list, (items) => {
            for (const { id } of fresh.pick(items, state().updatedItems)) {
                announcer.announce(id, () => readNoticeText(elements.get(id), prefixCls));
            }
        })
    );

    createEffect(
        on(
            ids,
            (current) => {
                // An emptied list may fire no mouseleave (the pointer did not move); without this the next batch would start expanded.
                if (!current.length) {
                    setStackExpanded(false);
                }
                // an unmounting focused toast fires no focusout, which would leave every countdown paused
                if (hasLostFocus(focused(), innerWrapper)) {
                    leave(setFocused);
                }
            },
            { defer: true }
        )
    );

    return (
        <ToastListContext.Provider value={{ paused, state }}>
            {/* Stays mounted so it is registered as a live region before any message is written into it */}
            <div class={`${prefixCls}-announcer`} aria-atomic="true" aria-live="polite">
                {announcement()}
            </div>
            <div
                ref={(element) => (innerWrapper = element)}
                class={clsx(`${prefixCls}-innerWrapper`, { [`${prefixCls}-innerWrapper-hover`]: expanded() })}
                onFocusIn={() => enter(setFocused)}
                onFocusOut={(event) => {
                    if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
                        leave(setFocused);
                    }
                }}
                onMouseEnter={() => enter(setHovered)}
                onMouseLeave={() => leave(setHovered)}
            >
                <For each={ids()}>{(id) => renderToast(id)}</For>
            </div>
        </ToastListContext.Provider>
    );
}
