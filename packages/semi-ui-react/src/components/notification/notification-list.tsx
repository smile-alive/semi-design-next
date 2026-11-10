import { type CSSProperties, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { getStackDepths, hasLostFocus, isStackExpanded, isStackHidden } from '@fibrae/semi-foundation/base';
import { cssClasses, getStackItemTransform } from '@fibrae/semi-foundation/components/notification/constants';
import type { NoticeInstance } from '@fibrae/semi-foundation/components/notification/notification-foundation';
import { type ConfigProps, groupNoticesByPosition, noticePositions, type NotificationListProps } from '@fibrae/semi-foundation/components/notification/notification-list-foundation';
import { pinAnimatedHeight, toCssLength } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/notification/notification.scss';
import { useNoticeListEffects } from '../../hooks/index';
import CSSAnimation from '../../internal/css-animation';
import { useConfigContext } from '../config-provider/context';
import Notice from './notice';

// NoticeInstance does not declare the offsets, but they reach the store from Notification.config()
function positionStyle(notice: NoticeInstance & Pick<ConfigProps, 'top' | 'left' | 'bottom' | 'right'>) {
    const style: CSSProperties = {};
    for (const pos of ['top', 'left', 'bottom', 'right'] as const) {
        if (pos in notice) {
            style[pos] = toCssLength(notice[pos]);
        }
    }
    return style;
}

export default function NotificationList({ store }: NotificationListProps) {
    const { direction } = useConfigContext();

    // the server snapshot lets useNotification's contextHolder render on the server
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    const elementsRef = useRef(new Map<string, HTMLDivElement>());
    const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

    // focus pauses and opens a list like the pointer, so keyboard users get the same time and no hidden tab stop
    const [focusedPosition, setFocusedPosition] = useState<string | null>(null);
    const listsRef = useRef(new Map<string, HTMLDivElement>());

    // a list unmounting under the pointer never gets mouseleave or blur, so the ref cleanup resets the state
    const [listRefs] = useState(() =>
        Object.fromEntries(
            noticePositions.map((position) => [
                position,
                (element: HTMLDivElement) => {
                    listsRef.current.set(position, element);
                    return () => {
                        listsRef.current.delete(position);
                        setHoveredPosition((current) => (current === position ? null : current));
                        setFocusedPosition((current) => (current === position ? null : current));
                    };
                },
            ])
        )
    );

    const { items, removedItems, updatedItems, stack } = state;

    const shownIds = new Set(items.map(({ id }) => id));

    const announcement = useNoticeListEffects(items, updatedItems, elementsRef, cssClasses.NOTICE);

    const noticesInPosition = groupNoticesByPosition(state, direction);

    const remove = (id: string) => store.remove(String(id));

    // a notice unmounts on a store change
    useLayoutEffect(() => {
        if (focusedPosition && hasLostFocus(true, listsRef.current.get(focusedPosition))) {
            setFocusedPosition(null);
        }
    }, [focusedPosition, state]);

    return (
        <>
            {/* Stays mounted so it is registered as a live region before any message is written into it */}
            <div className={`${cssClasses.NOTICE}-announcer`} aria-atomic="true" aria-live="polite">
                {announcement}
            </div>
            {Object.entries(noticesInPosition).map(([position, notices]) => {
                if (!notices.length) {
                    return null;
                }
                const paused = hoveredPosition === position || focusedPosition === position;
                const listState = { paused, removedItems, updatedItems };
                const depths = getStackDepths(
                    notices.map(({ id }) => id),
                    shownIds
                );
                const expanded = isStackExpanded(stack, paused, notices.filter(({ id }) => shownIds.has(id)).length);
                return (
                    <div
                        key={position}
                        ref={listRefs[position]}
                        className={cssClasses.LIST}
                        style={positionStyle(notices[0])}
                        x-placement={position}
                        onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) {
                                setFocusedPosition(null);
                            }
                        }}
                        onFocus={() => setFocusedPosition(position)}
                        onMouseEnter={() => setHoveredPosition(position)}
                        onMouseLeave={() => setHoveredPosition(null)}
                    >
                        {notices.map((notice, index) => {
                            const isRemoved = removedItems.includes(notice);
                            const depth = depths.get(notice.id);
                            const animation = (
                                <CSSAnimation
                                    startClassName={`${cssClasses.NOTICE}-animation-${isRemoved ? 'hide' : 'show'}_${position}`}
                                    animationState={isRemoved ? 'leave' : 'enter'}
                                    getElement={() => elementsRef.current.get(notice.id)}
                                    onAnimationEnd={() => {
                                        // the enter animation ends here too
                                        if (isRemoved) {
                                            store.finishLeave(notice.id);
                                        }
                                    }}
                                    onAnimationStart={() => pinAnimatedHeight(elementsRef.current.get(notice.id))}
                                >
                                    {({ animationClassName, animationEventsNeedBind, isAnimating }) =>
                                        isRemoved && !isAnimating ? null : (
                                            <Notice
                                                {...notice}
                                                ref={(element) => {
                                                    elementsRef.current.set(notice.id, element);
                                                    return () => {
                                                        elementsRef.current.delete(notice.id);
                                                    };
                                                }}
                                                className={clsx(notice.className, animationClassName)}
                                                listState={listState}
                                                {...animationEventsNeedBind}
                                                close={remove}
                                            />
                                        )
                                    }
                                </CSSAnimation>
                            );
                            // The item is there without stack too: the latest open decides the list's stacking, so a
                            // notice can switch modes while shown, and a changed element structure would remount it,
                            // restarting its countdown and entrance and losing its state and focus.
                            const collapsed = !expanded && depth > 0;
                            return (
                                <div
                                    key={notice.id}
                                    className={
                                        stack
                                            ? clsx(`${cssClasses.NOTICE}-stack-item`, {
                                                  [`${cssClasses.NOTICE}-stack-item-expanded`]: expanded,
                                                  [`${cssClasses.NOTICE}-stack-item-hidden`]: isStackHidden(expanded, depth),
                                              })
                                            : undefined
                                    }
                                    style={
                                        stack
                                            ? {
                                                  zIndex: notices.length - index,
                                                  transform: collapsed ? getStackItemTransform(depth, position) : undefined,
                                              }
                                            : undefined
                                    }
                                >
                                    {animation}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
}
