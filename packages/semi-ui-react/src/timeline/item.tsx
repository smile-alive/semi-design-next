import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/timeline/constants';
import '@fibrae/semi-foundation/timeline/timeline.scss';
import type { ElementProps } from '../_base/base';

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
    /** Attached to the li */
    ref?: React.Ref<HTMLLIElement>;
}

const prefixCls = cssClasses.ITEM;
// React bubbles synthetic events through portals, where DOM containment fails, so the extra marks its own clicks
// with the li they belong to; a nested Timeline's extra then does not silence the outer item
const extraClicks = new WeakMap<Event, Element | null>();

// Timeline reads position from the element to pick the item's side
function Item({ ref, className, color, children, dot, type = 'default', time = '', extra, position, onClick, ...rest }: TimelineItemProps) {
    return (
        <li
            {...rest}
            ref={ref}
            className={clsx(prefixCls, className)}
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
            <div className={`${prefixCls}-tail`} aria-hidden />
            <div
                className={clsx(`${prefixCls}-head`, {
                    [`${prefixCls}-head-custom`]: dot,
                    [`${prefixCls}-head-${type}`]: type,
                })}
                style={color ? { backgroundColor: color } : undefined}
                aria-hidden
            >
                {dot}
            </div>
            <div className={`${prefixCls}-content`}>
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
                {extra && (
                    <div className={`${prefixCls}-content-extra`} onClick={(e) => extraClicks.set(e.nativeEvent, e.currentTarget.closest('li'))}>
                        {extra}
                    </div>
                )}
                {time && <div className={`${prefixCls}-content-time`}>{time}</div>}
            </div>
        </li>
    );
}

// memo keeps the PureComponent behaviour
export default memo(Item);
