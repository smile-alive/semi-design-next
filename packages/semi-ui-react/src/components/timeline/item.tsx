import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses, type TimelineItemPart } from '@fibrae/semi-foundation/components/timeline/constants';
import '@fibrae/semi-foundation/components/timeline/timeline.scss';
import type { ElementProps } from '../../base/index';
import { useTimelineContext } from './context';

export interface TimelineItemProps extends ElementProps<'li', 'content'> {
    color?: string;
    children?: React.ReactNode;
    time?: React.ReactNode;
    type?: 'default' | 'ongoing' | 'success' | 'warning' | 'error';
    dot?: React.ReactNode;
    extra?: React.ReactNode;
    position?: 'left' | 'right';
    className?: string;
    style?: React.CSSProperties;
    /** Applied after the `item*` classNames of the parent Timeline */
    classNames?: Partial<Record<TimelineItemPart, string>>;
    styles?: Partial<Record<TimelineItemPart, React.CSSProperties>>;
    /** Attached to the li */
    ref?: React.Ref<HTMLLIElement>;
}

const prefixCls = cssClasses.ITEM;
// React bubbles synthetic events through portals, where DOM containment fails, so the extra marks its own clicks
// with the li they belong to; a nested Timeline's extra then does not silence the outer item
const extraClicks = new WeakMap<Event, Element | null>();

// Timeline reads position from the element to pick the item's side
function Item({ ref, className, style, color, children, dot, type = 'default', time = '', extra, position, onClick, classNames, styles, ...rest }: TimelineItemProps) {
    const { classNames: parentClassNames, styles: parentStyles } = useTimelineContext();

    return (
        <li
            {...rest}
            ref={ref}
            className={clsx(prefixCls, parentClassNames?.item, className)}
            style={{ ...parentStyles?.item, ...style }}
            onClick={
                onClick &&
                ((e) => {
                    // Interactive content in extra must not also trigger the item
                    if (extraClicks.get(e.nativeEvent) === e.currentTarget) {
                        return;
                    }
                    onClick(e);
                })
            }
        >
            <div className={clsx(`${prefixCls}-tail`, parentClassNames?.itemRail, classNames?.rail)} style={{ ...parentStyles?.itemRail, ...styles?.rail }} aria-hidden />
            <div
                className={clsx(
                    `${prefixCls}-head`,
                    {
                        [`${prefixCls}-head-custom`]: dot,
                        [`${prefixCls}-head-${type}`]: type,
                    },
                    parentClassNames?.itemIcon,
                    classNames?.icon
                )}
                style={{ ...(color && { backgroundColor: color }), ...parentStyles?.itemIcon, ...styles?.icon }}
                aria-hidden
            >
                {dot}
            </div>
            <div className={clsx(`${prefixCls}-content`, parentClassNames?.itemContent, classNames?.content)} style={{ ...parentStyles?.itemContent, ...styles?.content }}>
                {onClick ? (
                    // The li stays a plain list item; only a clickable item exposes its children as the keyboard
                    // target, so extra and time are not nested inside the button. The synthetic click bubbles to the
                    // li, so onClick runs once with a real MouseEvent.
                    <div
                        className={`${prefixCls}-content-main`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                e.currentTarget.click();
                            }
                        }}
                    >
                        {children}
                    </div>
                ) : (
                    children
                )}
                {(extra || extra === 0) && (
                    <div className={clsx(`${prefixCls}-content-extra`, parentClassNames?.itemExtra, classNames?.extra)} style={{ ...parentStyles?.itemExtra, ...styles?.extra }} onClick={(e) => extraClicks.set(e.nativeEvent, e.currentTarget.closest('li'))}>
                        {extra}
                    </div>
                )}
                {(time || time === 0) && (
                    <div className={clsx(`${prefixCls}-content-time`, parentClassNames?.itemTime, classNames?.time)} style={{ ...parentStyles?.itemTime, ...styles?.time }}>
                        {time}
                    </div>
                )}
            </div>
        </li>
    );
}

export default memo(Item);
