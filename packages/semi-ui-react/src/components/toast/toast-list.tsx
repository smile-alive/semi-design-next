import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { getStackDepths, hasLostFocus, isStackExpanded, isStackHidden } from '@fibrae/semi-foundation/base/list-store';
import { cssClasses } from '@fibrae/semi-foundation/components/toast/constants';
import type { ToastListProps } from '@fibrae/semi-foundation/components/toast/toast-list-foundation';
import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
import '@fibrae/semi-foundation/components/toast/toast.scss';
import useNoticeListEffects from '../../hooks/use-notice-list-effects';
import CSSAnimation from '../../internal/css-animation';
import Toast from './toast';

export default function ToastList({ store }: ToastListProps) {
    const { items: shown, removedItems, order, stack, updatedItems } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    const elementsRef = useRef(new Map<string, HTMLDivElement>());
    const [stackExpanded, setStackExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const innerWrapper = useRef<HTMLDivElement>(null);
    const byId = new Map([...shown, ...removedItems].map((item) => [item.id, item]));

    const announcement = useNoticeListEffects(shown, updatedItems, elementsRef, cssClasses.PREFIX);

    const items = order.filter((id) => byId.has(id)).map((id) => byId.get(id));
    const depths = getStackDepths(items.map(({ id }) => id).reverse(), new Set(shown.map(({ id }) => id)));
    const listState = { paused: hovered || focused, removedItems, updatedItems };

    // An emptied list may fire no mouseleave (the pointer did not move); without this the next batch would start expanded.
    if (stackExpanded && items.length === 0) {
        setStackExpanded(false);
    }

    const expanded = isStackExpanded(stack, stackExpanded, shown.length);

    const enter = (setSource: (value: boolean) => void) => {
        setSource(true);
        if (stack) {
            setStackExpanded(true);
        }
    };

    const leave = (setSource: (value: boolean) => void, otherSource: boolean) => {
        setSource(false);
        if (!otherSource) {
            setStackExpanded(false);
        }
    };

    // an item unmounts when the list's order changes
    useLayoutEffect(() => {
        if (hasLostFocus(focused, innerWrapper.current)) {
            leave(setFocused, hovered);
        }
    }, [focused, hovered, order]);

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
                        leave(setFocused, hovered);
                    }
                }}
                onFocus={() => enter(setFocused)}
                onMouseEnter={() => enter(setHovered)}
                onMouseLeave={() => leave(setHovered, focused)}
            >
                {items.map((item) => {
                    const isRemoved = removedItems.includes(item);
                    const depth = depths.get(item.id);
                    const animationState = isRemoved ? 'leave' : 'enter';
                    return (
                        <CSSAnimation
                            key={item.id}
                            startClassName={isRemoved ? `${cssClasses.PREFIX}-animation-hide` : `${cssClasses.PREFIX}-animation-show`}
                            animationState={animationState}
                            getElement={() => elementsRef.current.get(item.id)}
                            motion={item.motion}
                            onAnimationEnd={() => {
                                // a late enter-animation end must not cut the leave short
                                if (animationState === 'leave') {
                                    store.finishLeave(item.id);
                                }
                            }}
                            onAnimationStart={() => pinAnimatedHeight(elementsRef.current.get(item.id))}
                        >
                            {({ animationClassName, animationEventsNeedBind }) => (
                                <Toast
                                    {...item}
                                    className={clsx(item.className, animationClassName, {
                                        [`${cssClasses.PREFIX}-stack-hidden`]: isStackHidden(expanded, depth),
                                    })}
                                    listState={listState}
                                    positionInList={{ length: shown.length, index: shown.length - 1 - depth }}
                                    stack={stack > 0}
                                    // collapse the slot while leaving so toasts below move up instead of jumping on unmount
                                    stackExpanded={expanded && !isRemoved}
                                    {...animationEventsNeedBind}
                                    ref={(element) => {
                                        elementsRef.current.set(item.id, element);
                                        return () => {
                                            elementsRef.current.delete(item.id);
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
