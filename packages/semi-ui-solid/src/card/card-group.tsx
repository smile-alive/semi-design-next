import { splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/card/constants';
import useDefaultProps from '../_base/use-default-props';
import Space, { type SpaceProps } from '../space';

const prefixCls = cssClasses.PREFIX;

export type CardGroupType = 'grid';

export interface CardGroupProps extends Omit<SpaceProps, 'spacing'> {
    /** Gap between the cards; ignored by the `grid` type, whose cards touch */
    spacing?: number | [number, number];
    type?: CardGroupType;
}

const defaultProps = { spacing: 16, wrap: true } satisfies Partial<CardGroupProps>;

export default function CardGroup(rawProps: CardGroupProps) {
    const props = useDefaultProps('CardGroup', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['class', 'spacing', 'type']);

    const isGrid = () => local.type === 'grid';

    return <Space {...rest} class={clsx(`${prefixCls}-group`, local.class, { [`${prefixCls}-group-grid`]: isGrid() })} spacing={isGrid() ? 0 : local.spacing} />;
}
