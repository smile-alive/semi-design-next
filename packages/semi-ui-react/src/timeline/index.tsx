import type React from 'react';
import { cloneElement, isValidElement, memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/timeline/constants';
import { getPosCls } from '@fibrae/semi-foundation/timeline/utils';
import '@fibrae/semi-foundation/timeline/timeline.scss';
import type { ElementProps } from '../_base/base';
import flattenChildren from '../_base/flatten-children';
import useDefaultProps from '../_base/use-default-props';
import Item, { type TimelineItemProps } from './item';

export type { TimelineItemProps } from './item';

export interface Data extends Omit<TimelineItemProps, 'children'> {
    content: React.ReactNode;
}

export interface TimelineProps extends ElementProps<'ul'> {
    mode?: 'left' | 'right' | 'center' | 'alternate';
    className?: string;
    style?: React.CSSProperties;
    dataSource?: Data[];
    children?: React.ReactNode;
    /** Attached to the ul */
    ref?: React.Ref<HTMLUListElement>;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = { mode: 'left' } satisfies Partial<TimelineProps>;

function Timeline(rawProps: TimelineProps) {
    const { ref, children, className, mode, dataSource, ...rest } = useDefaultProps('Timeline', rawProps, defaultProps);

    const items = dataSource?.length
        ? dataSource.map(({ content, ...item }, index) => (
              <Item key={`timeline-item-${index}`} {...item}>
                  {content}
              </Item>
          ))
        : children;

    return (
        <ul {...rest} ref={ref} className={clsx(prefixCls, className, { [`${prefixCls}-${mode}`]: mode })}>
            {/* null and false are dropped, so alternate counts only rendered items */}
            {flattenChildren(items).map((ele, idx) =>
                isValidElement<TimelineItemProps>(ele)
                    ? cloneElement(ele, {
                          className: clsx(ele.props.className, getPosCls(mode, ele.props.position, idx)),
                      })
                    : ele
            )}
        </ul>
    );
}

// memo keeps the PureComponent behaviour
export default Object.assign(memo(Timeline), { Item });
