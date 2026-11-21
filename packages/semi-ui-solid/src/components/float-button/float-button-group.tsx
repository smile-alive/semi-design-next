import { Index, Show, splitProps, type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, cssClassesGroup, type FloatButtonGroupPart } from '@fibrae/semi-foundation/components/float-button/constants';
import '@fibrae/semi-foundation/components/float-button/float-button.scss';
import { type ElementProps, useDefaultProps } from '../../base/index';
import { callHandler, mergeStyles } from '../../utils/index';
import Badge from '../badge';
import Action from './action';
import type { FloatButtonProps } from './interface';

const prefixCls = cssClassesGroup.PREFIX;
const buttonPrefixCls = cssClasses.PREFIX;

type Style = JSX.CSSProperties | string;

// An item has no body element, so the button's parts do not apply
export interface FloatButtonGroupItem extends Omit<FloatButtonProps, 'classNames' | 'styles'> {
    value?: string;
    content?: JSX.Element;
    /** Accessible name, required when the item shows only an icon */
    'aria-label'?: string;
}

export interface FloatButtonGroupProps extends ElementProps<'div', 'onClick' | 'children'> {
    classNames?: Partial<Record<FloatButtonGroupPart, string>>;
    disabled?: boolean;
    items: FloatButtonGroupItem[];
    styles?: Partial<Record<FloatButtonGroupPart, Style>>;
    /** `value` is the clicked item's, which is optional */
    onClick?: (value: string | undefined, event: MouseEvent) => void;
}

const defaultProps = {} satisfies Partial<FloatButtonGroupProps>;

interface GroupItemProps extends FloatButtonGroupItem {
    groupClassNames?: FloatButtonGroupProps['classNames'];
    groupStyles?: FloatButtonGroupProps['styles'];
    groupDisabled?: boolean;
    onGroupClick?: FloatButtonGroupProps['onClick'];
}

function GroupItem(props: GroupItemProps) {
    const [local, rest] = splitProps(props, ['value', 'content', 'icon', 'badge', 'shape', 'size', 'colorful', 'class', 'style', 'disabled', 'onClick', 'groupClassNames', 'groupStyles', 'groupDisabled', 'onGroupClick']);

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
            class={clsx(`${prefixCls}-item`, local.groupClassNames?.item, local.class, {
                [`${buttonPrefixCls}-${local.shape}`]: local.shape,
                [`${buttonPrefixCls}-${local.size}`]: local.size,
                [`${buttonPrefixCls}-colorful`]: local.colorful,
                [`${prefixCls}-item-disabled`]: disabled(),
            })}
            style={mergeStyles(local.groupStyles?.item, local.style)}
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
    const [local, rest] = splitProps(props, ['class', 'classNames', 'disabled', 'items', 'onClick', 'styles']);

    return (
        <div
            role="group"
            {...rest}
            class={clsx(prefixCls, local.class, {
                [`${prefixCls}-disabled`]: local.disabled,
            })}
        >
            <Index each={local.items}>{(item) => <GroupItem {...item()} groupClassNames={local.classNames} groupStyles={local.styles} groupDisabled={local.disabled} onGroupClick={local.onClick} />}</Index>
        </div>
    );
}
