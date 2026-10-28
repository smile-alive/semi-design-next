import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, type Setter, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/toast/constants';
import type { ToastListProps } from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
import { pickFreshAnnouncements } from '@fibrae/semi-foundation/utils/announcer';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/toast/toast.scss';
import useCSSAnimation from '../_base/css-animation';
import mergeRefs from '../_base/merge-refs';
import useAnnouncer from '../_base/use-announcer';
import { ToastListContext } from './context';
import Toast, { type ToastProps } from './toast';

const prefixCls = cssClasses.PREFIX;

/** Renders the toasts of a store in display order */
export default function ToastList(props: ToastListProps) {
    const [hovered, setHovered] = createSignal(false);
    const [focused, setFocused] = createSignal(false);
    const [stackExpanded, setStackExpanded] = createSignal(false);
    const elements = new Map<string, HTMLElement>();
    let innerWrapper: HTMLDivElement | undefined;
    let shownIds = new Set<string | undefined>();

    const [announcement, announcer] = useAnnouncer();

    // a list renders one store for its whole life
    const store = untrack(() => props.store);

    const [state, setState] = createSignal(store.getSnapshot());

    // the store holds the options as given to Toast.info and the hooks
    const list = createMemo(() => state().list as ToastProps[]);
    const shown = createMemo(() => new Set(list().map((item) => item.id)));
    const byId = createMemo(() => new Map([...list(), ...(state().removedItems as ToastProps[])].map((item) => [item.id, item])));

    // keyed by id: an update in place replaces the item object, and the toast must keep its element and countdown
    const ids = createMemo(() => state().order.filter((id) => byId().has(id)));
    const paused = createMemo(() => hovered() || focused());

    const expanded = () => state().stack === 0 || stackExpanded() || list().length <= state().stack;

    const enter = (setSource: Setter<boolean>) => {
        setSource(true);
        if (state().stack) {
            setStackExpanded(true);
        }
    };

    const leave = (setSource: Setter<boolean>) => {
        setSource(false);
        if (paused()) {
            return;
        }
        if (state().stack && innerWrapper?.getBoundingClientRect().height) {
            setStackExpanded(false);
        }
    };

    const renderToast = (id: string) => {
        const item = () => byId().get(id) as ToastProps;
        const leaving = () => !shown().has(id);
        // leaving toasts are not counted, or the ones behind would sink and spring back on unmount
        const newerShown = () => {
            const order = ids();
            return order.slice(order.indexOf(id) + 1).filter((newer) => shown().has(newer)).length;
        };
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
                class={clsx(item().class, animation.className(), { [`${prefixCls}-stack-hidden`]: !expanded() && newerShown() >= numbers.stackVisibleCount })}
                positionInList={{ length: list().length, index: list().length - 1 - newerShown() }}
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
            const { updatedItems } = state();
            const fresh = pickFreshAnnouncements(items, shownIds, updatedItems);
            shownIds = new Set(items.map((item) => item.id));
            for (const { id } of fresh) {
                announcer.announce(id as string, () => elements.get(id as string)?.textContent ?? '');
            }
        })
    );

    createEffect(
        on(
            ids,
            (current) => {
                // An emptied list has no height, so leave() never collapses it; without this the next batch would start expanded.
                if (!current.length) {
                    setStackExpanded(false);
                }
                // an unmounting focused toast fires no focusout, which would leave every countdown paused
                if (focused() && !innerWrapper?.contains(FocusTrapHandle.getActiveElement(innerWrapper))) {
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
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
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
