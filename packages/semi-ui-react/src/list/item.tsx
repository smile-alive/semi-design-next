import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { omitBy, pickBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/list/constants';
import type { ElementProps } from '../_base/base';
import { hasContent } from '../_utils';
import { Col } from '../grid';
import { useListContext } from './list-context';

export interface ListItemProps extends ElementProps<'li'> {
    extra?: React.ReactNode;
    header?: React.ReactNode;
    main?: React.ReactNode;
    align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    onRightClick?: React.MouseEventHandler<HTMLLIElement>;
    /** Attached to the li, which sits inside a Col when the List has `grid` */
    ref?: React.Ref<HTMLLIElement>;
}

const prefixCls = cssClasses.PREFIX;
// ColProps declares only the Col's own props (F6); role still lands on its div (F2)
const noRole = { role: 'none' };
// React bubbles synthetic events through portals, where DOM containment fails, so the extra marks its own clicks
// with the li they belong to; a nested List's extra then does not silence the outer item
const extraClicks = new WeakMap<Event, Element | null>();

function ListItem({ ref, header, main, className, extra, children, align = 'flex-start', onClick, onRightClick, ...rest }: ListItemProps) {
    const { grid, onClick: listOnClick, onRightClick: listOnRightClick } = useListContext();

    const handleClick = onClick || listOnClick;
    const handleRightClick = onRightClick || listOnRightClick;
    const clickable = Boolean(handleClick || handleRightClick);

    // a button holds phrasing content only
    const Box = clickable ? 'span' : 'div';

    const body =
        hasContent(header) || hasContent(main) ? (
            <Box className={clsx(`${prefixCls}-item-body`, { [`${prefixCls}-item-body-${align}`]: align })}>
                {hasContent(header) && <Box className={`${prefixCls}-item-body-header`}>{header}</Box>}
                {hasContent(main) && <Box className={`${prefixCls}-item-body-main`}>{main}</Box>}
            </Box>
        ) : null;

    // The button is the only tab stop, so what a Tooltip injects for focus and naming belongs there, not on the li
    const isControlProp = (_: unknown, key: string) => key === 'tabIndex' || key.startsWith('aria-');

    const controlProps: React.AriaAttributes & Pick<React.HTMLAttributes<HTMLElement>, 'tabIndex'> = clickable ? pickBy(rest, isControlProp) : {};
    const liProps = clickable ? omitBy(rest, isControlProp) : rest;

    const content = (
        <li
            {...liProps}
            ref={ref}
            className={clsx(`${prefixCls}-item`, { [`${prefixCls}-item-clickable`]: clickable }, className)}
            onClick={
                handleClick &&
                ((e) => {
                    if (extraClicks.get(e.nativeEvent) === e.currentTarget) {
                        return;
                    }
                    handleClick(e);
                })
            }
            onContextMenu={handleRightClick}
        >
            {clickable ? (
                // extra stays outside so interactive extras are never nested in the button
                <button type="button" className={`${prefixCls}-item-button`} {...controlProps}>
                    {body ?? children}
                </button>
            ) : (
                body
            )}
            {!(clickable && !body) && children}
            {hasContent(extra) && (
                <div className={`${prefixCls}-item-extra`} onClick={(e) => extraClicks.set(e.nativeEvent, e.currentTarget.parentElement)}>
                    {extra}
                </div>
            )}
        </li>
    );

    if (!grid) {
        return content;
    }

    const { gutter, justify, type, align: rowAlign, ...colProps } = grid;

    return (
        <Col {...colProps} {...noRole}>
            {content}
        </Col>
    );
}

export default memo(ListItem);
