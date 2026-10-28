import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers } from '@fibrae/semi-foundation/toast/constants';
import type { ToastListProps } from '@fibrae/semi-foundation/toast/toast-list-foundation';
import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/toast/toast.scss';
import useNoticeListEffects from '../_base/use-notice-list-effects';
import CSSAnimation from '../_css-animation';
import Toast, { type ToastItemHandle } from './toast';

/** Renders the toasts of a store in display order */
export default function ToastList({ store }: ToastListProps) {
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    const [handles] = useState(() => new Map<string, ToastItemHandle>());
    const [stackExpanded, setStackExpanded] = useState(false);
    const innerWrapper = useRef<HTMLDivElement>(null);
    const hovered = useRef(false);
    const focused = useRef(false);

    const { list, removedItems, order, stack, updatedItems } = state;

    const byId = new Map([...list, ...removedItems].map((item) => [item.id, item]));

    const announcement = useNoticeListEffects(list, updatedItems, removedItems, handles);

    const items = order.filter((id) => byId.has(id)).map((id) => byId.get(id));

    // An emptied list has no height, so leave() never collapses it; without this the next batch would start expanded.
    if (stackExpanded && items.length === 0) {
        setStackExpanded(false);
    }

    const expanded = stack === 0 || stackExpanded || list.length <= stack;

    const enter = (source: typeof hovered) => {
        source.current = true;
        handles.forEach((handle) => handle.pauseCloseTimer());
        if (stack) {
            setStackExpanded(true);
        }
    };

    const leave = (source: typeof hovered) => {
        source.current = false;
        if (hovered.current || focused.current) {
            return;
        }
        handles.forEach((handle) => handle.resumeCloseTimer());
        if (stack && innerWrapper.current?.getBoundingClientRect().height) {
            setStackExpanded(false);
        }
    };

    // an unmounting focused toast fires no blur, which would leave every timer paused
    useLayoutEffect(() => {
        if (focused.current && !innerWrapper.current?.contains(FocusTrapHandle.getActiveElement(innerWrapper.current))) {
            leave(focused);
        }
    });

    return (
        <>
            {/* Stays mounted so it is registered as a live region before any message is written into it */}
            <div className={`${cssClasses.PREFIX}-announcer`} aria-atomic="true" aria-live="polite">
                {announcement}
            </div>
            <div
                ref={innerWrapper}
                className={clsx(`${cssClasses.PREFIX}-innerWrapper`, {
                    [`${cssClasses.PREFIX}-innerWrapper-hover`]: expanded,
                })}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        leave(focused);
                    }
                }}
                onFocus={() => enter(focused)}
                onMouseEnter={() => enter(hovered)}
                onMouseLeave={() => leave(hovered)}
            >
                {items.map((item, index) => {
                    const isRemoved = removedItems.some((removed) => removed.id === item.id);
                    // leaving toasts are not counted, or the ones behind would sink and spring back on unmount
                    const newerShown = items.slice(index + 1).filter((newer) => list.includes(newer)).length;
                    const animationState = isRemoved ? 'leave' : 'enter';
                    return (
                        <CSSAnimation
                            key={item.id}
                            startClassName={isRemoved ? `${cssClasses.PREFIX}-animation-hide` : `${cssClasses.PREFIX}-animation-show`}
                            animationState={animationState}
                            getElement={() => handles.get(item.id)?.element()}
                            motion={item.motion}
                            onAnimationEnd={() => {
                                // a late enter-animation end must not cut the leave short
                                if (animationState === 'leave') {
                                    store.finishLeave(item.id);
                                }
                            }}
                            onAnimationStart={() => pinAnimatedHeight(handles.get(item.id)?.element())}
                        >
                            {({ animationClassName, animationEventsNeedBind }) => (
                                <Toast
                                    {...item}
                                    className={clsx(item.className, animationClassName, {
                                        [`${cssClasses.PREFIX}-stack-hidden`]: !expanded && newerShown >= numbers.stackVisibleCount,
                                    })}
                                    positionInList={{ length: list.length, index: list.length - 1 - newerShown }}
                                    stack={stack > 0}
                                    // collapse the slot while leaving so toasts below move up instead of jumping on unmount
                                    stackExpanded={expanded && !isRemoved}
                                    {...animationEventsNeedBind}
                                    ref={(handle) => {
                                        handles.set(item.id, handle);
                                        if (hovered.current || focused.current) {
                                            handle.pauseCloseTimer();
                                        }
                                        return () => {
                                            handles.delete(item.id);
                                        };
                                    }}
                                    style={{ ...item.style }}
                                    close={(id) => store.remove(id)}
                                />
                            )}
                        </CSSAnimation>
                    );
                })}
            </div>
        </>
    );
}
