import { createEffect, createMemo, createSignal, For, type JSX, on, onCleanup, onMount, Show, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, getStackItemTransform, getStackThreshold, numbers } from '@fibrae/semi-foundation/notification/constants';
import type { NotificationListProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
import { pickFreshAnnouncements, readNoticeText } from '@fibrae/semi-foundation/utils/announcer';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/notification/notification.scss';
import useCSSAnimation from '../_base/css-animation';
import mergeRefs from '../_base/merge-refs';
import useAnnouncer from '../_base/use-announcer';
import useConfig from '../config-provider/use-config';
import { NotificationListContext } from './context';
import Notice, { type NoticeProps } from './notice';

const prefixCls = cssClasses.NOTICE;

const positions = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'] as const;

type Position = (typeof positions)[number];

function positionStyle(notice: NoticeProps) {
    const style: JSX.CSSProperties = {};
    for (const pos of ['top', 'left', 'bottom', 'right'] as const) {
        if (pos in notice) {
            style[pos] = toCssLength(notice[pos]);
        }
    }
    return style;
}

/** Renders the notices of a store, one list per position */
export default function NotificationList(props: NotificationListProps) {
    const config = useConfig();

    const [hoveredPosition, setHoveredPosition] = createSignal<Position | null>(null);

    // focus pauses and opens a list like the pointer, so keyboard users get the same time and no hidden tab stop
    const [focusedPosition, setFocusedPosition] = createSignal<Position | null>(null);
    const elements = new Map<string, HTMLElement>();
    const lists = new Map<Position, HTMLDivElement>();
    let shownIds = new Set<string | undefined>();

    const [announcement, announcer] = useAnnouncer();

    // a list renders one store for its whole life
    const store = untrack(() => props.store);

    const [state, setState] = createSignal(store.getSnapshot());

    // the store holds the options as given to Notification.open and the hooks
    const notices = createMemo(() => state().notices as NoticeProps[]);
    const shown = createMemo(() => new Set(notices().map((notice) => notice.id)));
    const byId = createMemo(() => new Map([...notices(), ...(state().removedItems as NoticeProps[])].map((notice) => [notice.id as string, notice])));

    // keyed by id: an update in place replaces the notice object, and the notice must keep its element and countdown
    const idsInPosition = createMemo(() => {
        const groups = Object.fromEntries(positions.map((position) => [position, [] as string[]])) as Record<Position, string[]>;
        for (const id of state().order) {
            const notice = byId().get(id);
            if (notice) {
                const defaultPosition = (notice.direction || config().direction) === 'rtl' ? 'topLeft' : 'topRight';
                groups[notice.position || defaultPosition].push(id);
            }
        }
        return groups;
    });

    const releaseFocus = () => setFocusedPosition(null);

    const renderNotice = (id: string, position: Position, expanded: () => boolean, stack: () => number) => {
        const notice = () => byId().get(id) as NoticeProps;
        const leaving = () => !shown().has(id);
        const ids = () => idsInPosition()[position];
        const index = () => ids().indexOf(id);
        // leaving notices are not counted, or the ones behind would sink and spring back on unmount
        const depth = () =>
            ids()
                .slice(0, index())
                .filter((newer) => shown().has(newer)).length;
        const collapsed = () => !expanded() && depth() > 0;
        const animation = useCSSAnimation({
            startClassName: () => `${prefixCls}-animation-${leaving() ? 'hide' : 'show'}_${position}`,
            onAnimationStart: () => pinAnimatedHeight(elements.get(id)),
            // the enter animation ends here too
            onAnimationEnd: () => {
                if (leaving()) {
                    store.finishLeave(id);
                }
            },
        });
        onCleanup(() => elements.delete(id));
        // The item is there without stack too: the list decides stacking from its newest notice, so a notice can switch
        // modes while shown, and a changed element structure would remount it, restarting its countdown and entrance and
        // losing its state and focus.
        return (
            <div
                class={
                    stack()
                        ? clsx(`${prefixCls}-stack-item`, {
                              [`${prefixCls}-stack-item-expanded`]: expanded(),
                              [`${prefixCls}-stack-item-hidden`]: !expanded() && depth() >= numbers.stackVisibleCount,
                          })
                        : undefined
                }
                style={
                    stack()
                        ? {
                              'z-index': ids().length - index(),
                              transform: collapsed() ? getStackItemTransform(depth(), position) : undefined,
                          }
                        : undefined
                }
            >
                <Notice {...notice()} ref={mergeRefs(animation.ref, (element: HTMLDivElement) => elements.set(id, element))} class={clsx(notice().class, animation.className())} close={(noticeId) => store.remove(String(noticeId))} />
            </div>
        );
    };

    const renderList = (position: Position) => {
        const ids = () => idsInPosition()[position];
        const paused = () => hoveredPosition() === position || focusedPosition() === position;
        // the newest notice decides, so Notification.config({ stack }) applies from the next notice
        const stack = () => getStackThreshold(byId().get(ids()[0])?.stack);
        const expanded = () => paused() || ids().filter((id) => shown().has(id)).length <= stack();
        // a list unmounting under the pointer never gets mouseleave or focusout
        onCleanup(() => {
            lists.delete(position);
            setHoveredPosition((current) => (current === position ? null : current));
            setFocusedPosition((current) => (current === position ? null : current));
        });
        return (
            <NotificationListContext.Provider value={{ paused, state }}>
                <div
                    ref={(element) => lists.set(position, element)}
                    class={cssClasses.LIST}
                    style={positionStyle(byId().get(ids()[0]) as NoticeProps)}
                    x-placement={position}
                    onFocusIn={() => setFocusedPosition(position)}
                    onFocusOut={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                            releaseFocus();
                        }
                    }}
                    onMouseEnter={() => setHoveredPosition(position)}
                    onMouseLeave={() => setHoveredPosition(null)}
                >
                    <For each={ids()}>{(id) => renderNotice(id, position, expanded, stack)}</For>
                </div>
            </NotificationListContext.Provider>
        );
    };

    onMount(() => {
        onCleanup(store.subscribe(() => setState(store.getSnapshot())));
        // the store may have changed between the first read and the subscription
        setState(store.getSnapshot());
    });

    // Notices new to the store or updated in place; alerts announce themselves
    createEffect(
        on(notices, (items) => {
            const { updatedItems } = state();
            const fresh = pickFreshAnnouncements(items, shownIds, updatedItems);
            shownIds = new Set(items.map((notice) => notice.id));
            for (const { id } of fresh) {
                announcer.announce(id as string, () => readNoticeText(elements.get(id as string), prefixCls));
            }
        })
    );

    // an unmounting focused notice fires no focusout, which would keep the list paused
    createEffect(
        on(
            idsInPosition,
            () => {
                const position = focusedPosition();
                const list = position ? lists.get(position) : undefined;
                if (position && !list?.contains(FocusTrapHandle.getActiveElement(list))) {
                    releaseFocus();
                }
            },
            { defer: true }
        )
    );

    return (
        <>
            {/* Stays mounted so it is registered as a live region before any message is written into it */}
            <div class={`${prefixCls}-announcer`} aria-atomic="true" aria-live="polite">
                {announcement()}
            </div>
            <For each={positions}>{(position) => <Show when={idsInPosition()[position].length}>{renderList(position)}</Show>}</For>
        </>
    );
}
