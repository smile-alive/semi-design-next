import { Index, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, cssClassesGroup } from '@fibrae/semi-foundation/float-button/constants';
import '@fibrae/semi-foundation/float-button/float-button.scss';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import useDefaultProps from '../_base/use-default-props';
import Badge from '../badge';
import Action from './action';
import type { FloatButtonProps } from './interface';

const prefixCls = cssClassesGroup.PREFIX;
const buttonPrefixCls = cssClasses.PREFIX;

export interface FloatButtonGroupItem extends FloatButtonProps {
    value?: string;
    content?: JSX.Element;
    /** Accessible name, required when the item shows only an icon */
    'aria-label'?: string;
}

export interface FloatButtonGroupProps extends ElementProps<'div', 'onClick' | 'children'> {
    disabled?: boolean;
    items: FloatButtonGroupItem[];
    /** `value` is the clicked item's, which is optional */
    onClick?: (value: string | undefined, event: MouseEvent) => void;
}

const defaultProps = {} satisfies Partial<FloatButtonGroupProps>;

interface GroupItemProps extends FloatButtonGroupItem {
    groupDisabled?: boolean;
    onGroupClick?: FloatButtonGroupProps['onClick'];
}

function GroupItem(props: GroupItemProps) {
    const [local, rest] = splitProps(props, ['value', 'content', 'icon', 'badge', 'shape', 'size', 'colorful', 'class', 'disabled', 'onClick', 'groupDisabled', 'onGroupClick']);

    const disabled = () => local.groupDisabled || local.disabled;

    const handleClick = (event: MouseEvent & { currentTarget: HTMLButtonElement | HTMLAnchorElement; target: Element }) => {
        callHandler(local.onClick, event);
        local.onGroupClick?.(local.value, event);
    };

    const action = () => (
        <Action
            {...rest}
            disabled={disabled()}
            data-value={local.value}
            class={clsx(`${prefixCls}-item`, local.class, {
                [`${buttonPrefixCls}-${local.shape}`]: local.shape,
                [`${buttonPrefixCls}-${local.size}`]: local.size,
                [`${buttonPrefixCls}-colorful`]: local.colorful,
                [`${prefixCls}-item-disabled`]: disabled(),
            })}
            onClick={handleClick}
        >
            {local.icon}
            {local.content}
        </Action>
    );

    return (
        <Show when={local.badge} fallback={action()}>
            {(badge) => <Badge {...badge()}>{action()}</Badge>}
        </Show>
    );
}

export default function FloatButtonGroup(rawProps: FloatButtonGroupProps) {
    const props = useDefaultProps('FloatButtonGroup', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['class', 'disabled', 'items', 'onClick']);

    return (
        <div
            role="group"
            {...rest}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-disabled`]: local.disabled,
            })}
        >
            <Index each={local.items}>{(item) => <GroupItem {...item()} groupDisabled={local.disabled} onGroupClick={local.onClick} />}</Index>
        </div>
    );
}
