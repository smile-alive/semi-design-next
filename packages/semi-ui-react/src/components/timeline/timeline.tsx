import type React from 'react';
import { cloneElement, isValidElement, memo, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses, type TimelinePart } from '@fibrae/semi-foundation/components/timeline/constants';
import { getPosCls } from '@fibrae/semi-foundation/components/timeline/utils';
import '@fibrae/semi-foundation/components/timeline/timeline.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { flattenChildren } from '../../utils/index';
import { TimelineContext } from './context';
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
    /** `item*` keys apply to every Timeline.Item, before the item's own classNames */
    classNames?: Partial<Record<TimelinePart, string>>;
    styles?: Partial<Record<TimelinePart, React.CSSProperties>>;
    /** Attached to the ul */
    ref?: React.Ref<HTMLUListElement>;
}

const prefixCls = cssClasses.PREFIX;

const defaultProps = { mode: 'left' } satisfies Partial<TimelineProps>;

function Timeline(rawProps: TimelineProps) {
    const { ref, children, className, mode, dataSource, classNames, styles, ...rest } = useDefaultProps('Timeline', rawProps, defaultProps);

    const context = useMemo(() => ({ classNames, styles }), [classNames, styles]);

    const items = dataSource?.length
        ? dataSource.map(({ content, ...item }, index) => (
              <Item key={`timeline-item-${index}`} {...item}>
                  {content}
              </Item>
          ))
        : children;

    return (
        <ul {...rest} ref={ref} className={clsx(prefixCls, className, { [`${prefixCls}-${mode}`]: mode })}>
            <TimelineContext value={context}>
                {/* null and false are dropped, so alternate counts only rendered items */}
                {flattenChildren(items).map((ele, idx) =>
                    isValidElement<TimelineItemProps>(ele)
                        ? cloneElement(ele, {
                              className: clsx(ele.props.className, getPosCls(mode, ele.props.position, idx)),
                          })
                        : ele
                )}
            </TimelineContext>
        </ul>
    );
}

export default memo(Timeline);
