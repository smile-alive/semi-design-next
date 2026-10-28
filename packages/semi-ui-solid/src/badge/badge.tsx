import { children, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/badge/constants';
import '@fibrae/semi-foundation/badge/badge.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import useDefaultProps from '../_base/use-default-props';
import useConfig from '../config-provider/use-config';

const prefixCls = cssClasses.PREFIX;

export type BadgeType = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'success';
export type BadgeTheme = 'solid' | 'light' | 'inverted';
export type BadgePosition = 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';

export interface BadgeProps extends ElementProps<'span'> {
    count?: JSX.Element;
    dot?: boolean;
    type?: BadgeType;
    theme?: BadgeTheme;
    /** Defaults to `leftTop` in an RTL ConfigProvider and `rightTop` otherwise */
    position?: BadgePosition;
    overflowCount?: number;
    countClassName?: string;
    countStyle?: JSX.CSSProperties | string;
}

const defaultProps = {
    dot: false,
    type: 'primary',
    theme: 'solid',
} satisfies Partial<BadgeProps>;

export default function Badge(rawProps: BadgeProps) {
    const props = useDefaultProps('Badge', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['count', 'dot', 'type', 'theme', 'position', 'overflowCount', 'countClassName', 'countStyle', 'children', 'class']);

    const config = useConfig();

    const count = children(() => (local.dot ? undefined : local.count));
    const attached = children(() => local.children);

    const position = () => local.position ?? (config().direction === 'rtl' ? 'leftTop' : 'rightTop');

    const hasAttached = () => hasContent(attached());

    const showBadge = () => count() != null;

    const custom = () => {
        const value = count();
        return Boolean(value) && typeof value !== 'number' && typeof value !== 'string';
    };

    // An overflowCount of 0 means unset, and only numbers overflow: a string count is shown as given
    const content = () => {
        const value = count();
        return typeof value === 'number' && local.overflowCount && local.overflowCount < value ? `${local.overflowCount}+` : value;
    };

    return (
        <span {...rest} class={clsx(prefixCls, local.class)}>
            {attached()}
            <span
                class={clsx(local.countClassName, {
                    [`${prefixCls}-${local.type}`]: !custom(),
                    [`${prefixCls}-${local.theme}`]: !custom(),
                    [`${prefixCls}-${position()}`]: hasAttached(),
                    [`${prefixCls}-block`]: !hasAttached(),
                    [`${prefixCls}-dot`]: local.dot,
                    [`${prefixCls}-count`]: !local.dot && !custom() && showBadge(),
                    [`${prefixCls}-custom`]: custom(),
                })}
                style={local.countStyle}
                x-semi-prop="count"
            >
                <Show when={!local.dot}>{content()}</Show>
            </span>
        </span>
    );
}
