import { createEffect, createMemo, createSignal, For, type JSX, on, onCleanup, onMount, Show, untrack } from 'solid-js';
import clsx from 'clsx';
import { FreshItems, getStackDepths, hasLostFocus, isStackExpanded, isStackHidden, readNoticeText } from '@fibrae/semi-foundation/base/list-store';
import { cssClasses, getStackItemTransform } from '@fibrae/semi-foundation/components/notification/constants';
import { groupNoticesByPosition, noticePositions, type NotificationListProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/components/notification/notification.scss';
import useCSSAnimation from '../../internal/css-animation';
import useAnnouncer from '../../primitives/use-announcer';
import mergeRefs from '../../utils/merge-refs';
import useConfig from '../config-provider/use-config';
import { NotificationListContext } from './context';
import Notice, { type NoticeProps } from './notice';

const prefixCls = cssClasses.NOTICE;

type Position = (typeof noticePositions)[number];

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
    const fresh = new FreshItems();

    const [announcement, announcer] = useAnnouncer();

    const store = untrack(() => props.store);

    const [state, setState] = createSignal(store.getSnapshot());

    const notices = createMemo(() => state().items as (NoticeProps & { id: string })[]);
    const shown = createMemo(() => new Set(notices().map((notice) => notice.id)));
    const byId = createMemo(() => new Map([...notices(), ...(state().removedItems as NoticeProps[])].map((notice) => [notice.id as string, notice])));

    // keyed by id: an update in place replaces the notice object, and the notice must keep its element and countdown
    const idsInPosition = createMemo(() => {
        const grouped = groupNoticesByPosition(state(), config().direction);
        return Object.fromEntries(noticePositions.map((position) => [position, grouped[position].map((notice) => notice.id as string)])) as Record<Position, string[]>;
    });

    const releaseFocus = () => setFocusedPosition(null);

    const renderNotice = (id: string, position: Position, expanded: () => boolean, depths: () => Map<string, number>) => {
        const notice = () => byId().get(id) as NoticeProps;
        const leaving = () => !shown().has(id);
        const ids = () => idsInPosition()[position];
        const index = () => ids().indexOf(id);
        const depth = () => depths().get(id) ?? 0;
        const stack = () => state().stack;
        const collapsed = () => !expanded() && depth() > 0;
        const animation = useCSSAnimation({
            startClassName: () => `${prefixCls}-animation-${leaving() ? 'hide' : 'show'}_${position}`,
            onAnimationStart: () => pinAnimatedHeight(elements.get(id)),
            onAnimationEnd: () => {
                if (leaving()) {
                    store.finishLeave(id);
                }
            },
        });
        onCleanup(() => elements.delete(id));
        // The item is there without stack too: the latest open decides the list's stacking, so a notice can switch
        // modes while shown, and a changed element structure would remount it, restarting its countdown and entrance and
        // losing its state and focus.
        return (
            <div
                class={
                    stack()
                        ? clsx(`${prefixCls}-stack-item`, {
                              [`${prefixCls}-stack-item-expanded`]: expanded(),
                              [`${prefixCls}-stack-item-hidden`]: isStackHidden(expanded(), depth()),
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
        const expanded = () => isStackExpanded(state().stack, paused(), ids().filter((id) => shown().has(id)).length);
        const depths = createMemo(() => getStackDepths(ids(), shown()));
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
                        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
                            releaseFocus();
                        }
                    }}
                    onMouseEnter={() => setHoveredPosition(position)}
                    onMouseLeave={() => setHoveredPosition(null)}
                >
                    <For each={ids()}>{(id) => renderNotice(id, position, expanded, depths)}</For>
                </div>
            </NotificationListContext.Provider>
        );
    };

    onMount(() => {
        onCleanup(store.subscribe(() => setState(store.getSnapshot())));
        setState(store.getSnapshot());
    });

    // Notices new to the store or updated in place; alerts announce themselves
    createEffect(
        on(notices, (items) => {
            for (const { id } of fresh.pick(items, state().updatedItems)) {
                announcer.announce(id, () => readNoticeText(elements.get(id), prefixCls));
            }
        })
    );

    // an unmounting focused notice fires no focusout, which would keep the list paused
    createEffect(
        on(
            idsInPosition,
            () => {
                const position = focusedPosition();
                if (position && hasLostFocus(true, lists.get(position))) {
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
            <For each={noticePositions}>{(position) => <Show when={idsInPosition()[position].length}>{renderList(position)}</Show>}</For>
        </>
    );
}
