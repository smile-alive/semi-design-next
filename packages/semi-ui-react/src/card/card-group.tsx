import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/card/constants';
import useDefaultProps from '../_base/use-default-props';
import Space, { type SpaceProps } from '../space';

const prefixcls = cssClasses.PREFIX;

export type CardGroupType = 'grid';

export interface CardGroupProps extends Omit<SpaceProps, 'spacing'> {
    /** Card group style class name */
    className?: string;
    children?: React.ReactNode;
    /** Card Spacing */
    spacing?: number | [number, number];
    /** Card group inline style */
    style?: React.CSSProperties;
    /** Card set type */
    type?: CardGroupType;
    /** Attached to the root div of the Space */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = { spacing: 16 } satisfies Partial<CardGroupProps>;

function CardGroup(rawProps: CardGroupProps) {
    const { ref, children, className, spacing, style, type, wrap = true, ...rest } = useDefaultProps('CardGroup', rawProps, defaultProps);

    const isGrid = type === 'grid';

    const cardGroupCls = clsx(`${prefixcls}-group`, className, {
        [`${prefixcls}-group-grid`]: isGrid,
    });

    return (
        <Space ref={ref} className={cardGroupCls} style={style} spacing={isGrid ? 0 : spacing} wrap={wrap} {...rest}>
            {children}
        </Space>
    );
}

export default memo(CardGroup);
