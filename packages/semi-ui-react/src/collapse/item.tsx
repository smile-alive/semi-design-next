import type React from 'react';
import { memo, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/collapse/constants';
import CollapseFoundation from '@fibrae/semi-foundation/collapse/foundation';
import { isEventInside } from '@fibrae/semi-foundation/utils/dom';
import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import { hasContent } from '../_utils';
import Collapsible from '../collapsible';
import { useCollapseContext } from './collapse-context';

export interface CollapsePanelProps extends ElementProps<'div'> {
    itemKey: string;
    extra?: React.ReactNode;
    header?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    showArrow?: boolean;
    disabled?: boolean;
    onMotionEnd?: () => void;
    /** Attached to the panel's root div */
    ref?: React.Ref<HTMLDivElement>;
}

const prefixCls = cssClasses.PREFIX;

function CollapsePanel({ ref, className, children, itemKey, header, extra, showArrow = true, disabled = false, onMotionEnd, ...rest }: CollapsePanelProps) {
    const context = useCollapseContext('Collapse.Panel');

    // Collapsible fills a keepDOM that Collapse leaves undefined from its own global defaults; resolve it the same way.
    // Collapse always passes lazyRender (its own default is false), so the Collapsible default never applies to it.
    const { keepDOM } = useDefaultProps('Collapsible', { keepDOM: context.keepDOM }, { keepDOM: false });

    const iconRef = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { expandIconPosition, activeSet, motion, clickHeaderToExpand, onClick } = context;
    const { lazyRender } = context;

    // JSX as a destructuring default makes the Compiler skip the component; null still means no icon
    const expandIcon = context.expandIcon === undefined ? <IconChevronDown /> : context.expandIcon;
    const collapseIcon = context.collapseIcon === undefined ? <IconChevronUp /> : context.collapseIcon;
    const ariaID = `${prefixCls}-${useId()}`;
    const headerID = `${ariaID}-header`;
    const active = activeSet.has(itemKey);

    const [latchedEverOpened, setLatchedEverOpened] = useState(active);

    const hasBody = hasContent(children);
    const everOpened = CollapseFoundation.isEverOpened({ hasBody, active, everOpened: latchedEverOpened });

    if (everOpened !== latchedEverOpened) {
        setLatchedEverOpened(everOpened);
    }

    const contentMounted = CollapseFoundation.isContentMounted({ hasBody, active, keepDOM, lazyRender, everOpened });
    const expandIconEnable = hasBody && !disabled;

    const icon = showArrow && (
        <span ref={iconRef} className={clsx(`${prefixCls}-header-icon`, { [`${prefixCls}-header-iconDisabled`]: !expandIconEnable })} aria-hidden="true">
            {expandIconEnable && active ? collapseIcon : expandIcon}
        </span>
    );

    const iconPosLeft = expandIconPosition === 'left';

    return (
        <div {...rest} ref={ref} className={clsx(className, `${prefixCls}-item`, { [`${prefixCls}-item-active`]: active })}>
            <div
                className={clsx(`${prefixCls}-header`, {
                    [`${prefixCls}-header-disabled`]: disabled,
                    [`${prefixCls}-header-iconLeft`]: iconPosLeft,
                })}
                onClick={(e) => {
                    // the button's click (Enter, Space, assistive tech) bubbles here;
                    // a button handler would toggle twice
                    const target = e.target as Node;
                    // React bubbles through portals: a click inside a popup that extra or header renders is not on this header
                    if (!isEventInside(e.nativeEvent, e.currentTarget)) {
                        return;
                    }
                    if (!disabled && (clickHeaderToExpand || buttonRef.current?.contains(target) || iconRef.current?.contains(target))) {
                        onClick(itemKey, e);
                    }
                }}
            >
                {iconPosLeft && icon}
                {/* APG heading; role="heading" so host h3 styles cannot beat Semi layers;
                    level 3 as in Radix Accordion */}
                <div className={`${prefixCls}-header-title`} aria-level={3} role="heading">
                    <button ref={buttonRef} id={headerID} type="button" className={`${prefixCls}-header-button`} aria-controls={contentMounted ? ariaID : undefined} aria-expanded={active} disabled={disabled}>
                        {header}
                    </button>
                </div>
                {/* extra sits outside the button (own controls); a string header keeps the slot for its end
                    padding */}
                {typeof header === 'string' || hasContent(extra) ? (
                    <span className={`${prefixCls}-header-right`}>
                        <span>{extra}</span>
                        {!iconPosLeft && icon}
                    </span>
                ) : (
                    !iconPosLeft && icon
                )}
            </div>
            {hasBody && (
                <Collapsible isOpen={active} keepDOM={keepDOM} motion={motion} lazyRender={lazyRender} onMotionEnd={onMotionEnd}>
                    <div id={ariaID} className={`${prefixCls}-content`} aria-labelledby={headerID} inert={!active} role="region">
                        <div className={`${prefixCls}-content-wrapper`}>{children}</div>
                    </div>
                </Collapsible>
            )}
        </div>
    );
}

export default memo(CollapsePanel);
