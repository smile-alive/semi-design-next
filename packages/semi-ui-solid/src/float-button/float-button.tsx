import { children, Show, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/float-button/constants';
import '@fibrae/semi-foundation/float-button/float-button.scss';
import useDefaultProps from '../_base/use-default-props';
import Badge from '../badge';
import Action from './action';
import type { FloatButtonProps } from './interface';

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    shape: 'round',
    colorful: false,
    size: 'default',
} satisfies Partial<FloatButtonProps>;

export default function FloatButton(rawProps: FloatButtonProps) {
    const props = useDefaultProps('FloatButton', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['class', 'colorful', 'size', 'icon', 'badge', 'shape', 'disabled']);

    const icon = children(() => local.icon);

    // A fresh span per call, so switching the badge on or off never moves one node between parents. A span: a native
    // button or link takes phrasing content only.
    const body = () => (
        <span
            class={clsx(`${prefixCls}-body`, {
                [`${prefixCls}-${local.shape}`]: local.shape,
                [`${prefixCls}-colorful`]: local.colorful,
                [`${prefixCls}-disabled`]: local.disabled,
                [`${prefixCls}-${local.size}`]: local.size,
            })}
        >
            {icon()}
        </span>
    );

    return (
        <Action
            {...rest}
            disabled={local.disabled}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-${local.size}`]: local.size,
                [`${prefixCls}-${local.shape}`]: local.shape,
            })}
        >
            <Show when={local.badge} fallback={body()}>
                {(badge) => <Badge {...badge()}>{body()}</Badge>}
            </Show>
        </Action>
    );
}
