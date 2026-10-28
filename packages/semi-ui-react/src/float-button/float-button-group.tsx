import { Fragment } from 'react';
import type React from 'react';
import clsx from 'clsx';
import { cssClasses, cssClassesGroup } from '@fibrae/semi-foundation/float-button/constants';
import '@fibrae/semi-foundation/float-button/float-button.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import Badge from '../badge';
import type { FloatButtonProps } from './interface';
import renderAction from './render-action';

const prefixCls = cssClassesGroup.PREFIX;
const buttonPrefixCls = cssClasses.PREFIX;

export interface FloatButtonGroupItem extends FloatButtonProps {
    value?: string;
    content?: React.ReactNode;
    /** Accessible name, required when the item shows only an icon */
    'aria-label'?: string;
}

export interface FloatButtonGroupProps extends ElementProps<'div', 'onClick' | 'children'> {
    disabled?: boolean;
    items: FloatButtonGroupItem[];
    className?: string;
    style?: React.CSSProperties;
    /** `value` is the clicked item's, which is optional */
    onClick?: (value: string | undefined, e: React.MouseEvent) => void;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {} satisfies Partial<FloatButtonGroupProps>;

export default function FloatButtonGroup(rawProps: FloatButtonGroupProps) {
    const { ref, className, style, disabled, items, onClick, ...rest } = useDefaultProps('FloatButtonGroup', rawProps, defaultProps);

    return (
        <div
            role="group"
            {...rest}
            ref={ref}
            className={clsx(prefixCls, className, {
                [`${prefixCls}-disabled`]: disabled,
            })}
            style={style}
        >
            {items.map((item, index) => {
                const { value, content, icon, badge, shape, size, colorful, className: itemClassName, ...itemRest } = item;
                const itemDisabled = disabled || item.disabled;
                const node = renderAction({
                    ...itemRest,
                    disabled: itemDisabled,
                    'data-value': value,
                    className: clsx(`${prefixCls}-item`, itemClassName, {
                        [`${buttonPrefixCls}-${shape}`]: shape,
                        [`${buttonPrefixCls}-${size}`]: size,
                        [`${buttonPrefixCls}-colorful`]: colorful,
                        [`${prefixCls}-item-disabled`]: itemDisabled,
                    }),
                    onClick: (e: React.MouseEvent) => {
                        item.onClick?.(e);
                        onClick?.(value, e);
                    },
                    children: (
                        <>
                            {icon}
                            {content}
                        </>
                    ),
                });
                return <Fragment key={index}>{badge ? <Badge {...badge}>{node}</Badge> : node}</Fragment>;
            })}
        </div>
    );
}
