import type React from 'react';
import { memo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/card/constants';
import useDefaultProps from '../_base/use-default-props';
import Space, { type SpaceProps } from '../space';

const prefixcls = cssClasses.PREFIX;

export type CardGroupType = 'grid';

export interface CardGroupProps extends Omit<SpaceProps, 'spacing'> {
    className?: string;
    children?: React.ReactNode;
    spacing?: number | [number, number];
    style?: React.CSSProperties;
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
