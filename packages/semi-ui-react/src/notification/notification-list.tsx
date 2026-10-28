import { type CSSProperties, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { cssClasses, getStackItemTransform, getStackThreshold, numbers } from '@fibrae/semi-foundation/notification/constants';
import type { NoticeInstance } from '@fibrae/semi-foundation/notification/notification-foundation';
import type { ConfigProps, NotificationListProps } from '@fibrae/semi-foundation/notification/notification-list-foundation';
import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/notification/notification.scss';
import useNoticeListEffects from '../_base/use-notice-list-effects';
import CSSAnimation from '../_css-animation';
import { useConfigContext } from '../config-provider/context';
import Notice, { type NoticeHandle } from './notice';

const positions = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'] as const;

export type NoticesInPosition = {
    top: NoticeInstance[];
    topLeft: NoticeInstance[];
    topRight: NoticeInstance[];
    bottom: NoticeInstance[];
    bottomLeft: NoticeInstance[];
    bottomRight: NoticeInstance[];
};

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

/** Renders the notices of a store, one list per position */
export default function NotificationList({ store }: NotificationListProps) {
    const { direction } = useConfigContext();

    // the server snapshot lets useNotification's contextHolder render on the server
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    const [handles] = useState(() => new Map<string, NoticeHandle>());
    const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);

    // focus pauses and opens a list like the pointer, so keyboard users get the same time and no hidden tab stop
    const [focusedPosition, setFocusedPosition] = useState<string | null>(null);
    const [lists] = useState(() => new Map<string, HTMLDivElement>());

    // a list unmounting under the pointer never gets mouseleave or blur, so the ref cleanup resets the state
    const [listRefs] = useState(() =>
        Object.fromEntries(
            positions.map((position) => [
                position,
                (element: HTMLDivElement) => {
                    lists.set(position, element);
                    return () => {
                        lists.delete(position);
                        setHoveredPosition((current) => (current === position ? null : current));
                        setFocusedPosition((current) => (current === position ? null : current));
                    };
                },
            ])
        )
    );

    const { removedItems, order, updatedItems } = state;

    const byId = new Map([...state.notices, ...removedItems].map((notice) => [notice.id, notice]));

    const announcement = useNoticeListEffects(state.notices, updatedItems, removedItems, handles);

    const noticesInPosition = Object.fromEntries(positions.map((position) => [position, []])) as NoticesInPosition;

    const remove = (id: string) => store.remove(String(id));

    for (const notice of order.filter((id) => byId.has(id)).map((id) => byId.get(id))) {
        const defaultPosition = (notice.direction || direction) === 'rtl' ? 'topLeft' : 'topRight';
        noticesInPosition[notice.position || defaultPosition].push(notice);
    }

    const resumeIfIdle = (position: string, pointer: boolean, focus: boolean) => {
        if (!pointer && !focus) {
            noticesInPosition[position as keyof NoticesInPosition].forEach((notice) => handles.get(notice.id)?.resumeCloseTimer());
        }
    };

    const releaseFocus = (position: string) => {
        setFocusedPosition(null);
        resumeIfIdle(position, hoveredPosition === position, false);
    };

    // an unmounting focused notice fires no blur, which would keep the list paused
    useLayoutEffect(() => {
        const list = focusedPosition ? lists.get(focusedPosition) : undefined;
        if (focusedPosition && !list?.contains(FocusTrapHandle.getActiveElement(list))) {
            releaseFocus(focusedPosition);
        }
    });

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
                const hoveredHere = hoveredPosition === position;
                const focusedHere = focusedPosition === position;
                const hovered = hoveredHere || focusedHere;
                const shown = notices.filter((notice) => !removedItems.includes(notice));
                // the newest notice decides, so Notification.config({ stack }) applies from the next notice
                const stack = getStackThreshold(notices[0].stack);
                const expanded = hovered || shown.length <= stack;
                return (
                    <div
                        key={position}
                        ref={listRefs[position]}
                        className={cssClasses.LIST}
                        style={positionStyle(notices[0])}
                        x-placement={position}
                        onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) {
                                releaseFocus(position);
                            }
                        }}
                        onFocus={() => {
                            setFocusedPosition(position);
                            notices.forEach((notice) => handles.get(notice.id)?.pauseCloseTimer());
                        }}
                        onMouseEnter={() => {
                            setHoveredPosition(position);
                            notices.forEach((notice) => handles.get(notice.id)?.pauseCloseTimer());
                        }}
                        onMouseLeave={() => {
                            setHoveredPosition(null);
                            resumeIfIdle(position, false, focusedHere);
                        }}
                    >
                        {notices.map((notice, index) => {
                            const isRemoved = removedItems.includes(notice);
                            const depth = notices.slice(0, index).filter((newer) => shown.includes(newer)).length;
                            const animation = (
                                <CSSAnimation
                                    startClassName={`${cssClasses.NOTICE}-animation-${isRemoved ? 'hide' : 'show'}_${position}`}
                                    animationState={isRemoved ? 'leave' : 'enter'}
                                    getElement={() => handles.get(notice.id)?.element()}
                                    onAnimationEnd={() => {
                                        // the enter animation ends here too
                                        if (isRemoved) {
                                            store.finishLeave(notice.id);
                                        }
                                    }}
                                    onAnimationStart={() => pinAnimatedHeight(handles.get(notice.id)?.element())}
                                >
                                    {({ animationClassName, animationEventsNeedBind, isAnimating }) =>
                                        isRemoved && !isAnimating ? null : (
                                            <Notice
                                                {...notice}
                                                ref={(handle) => {
                                                    handles.set(notice.id, handle);
                                                    if (hovered) {
                                                        handle.pauseCloseTimer();
                                                    }
                                                    return () => {
                                                        handles.delete(notice.id);
                                                    };
                                                }}
                                                className={clsx(notice.className, animationClassName)}
                                                {...animationEventsNeedBind}
                                                close={remove}
                                            />
                                        )
                                    }
                                </CSSAnimation>
                            );
                            // The item is there without stack too: the list decides stacking from its newest notice, so a
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
                                                  [`${cssClasses.NOTICE}-stack-item-hidden`]: !expanded && depth >= numbers.stackVisibleCount,
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
