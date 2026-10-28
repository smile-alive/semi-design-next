import React, { useId } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/input/constants';
import { noop } from '@fibrae/semi-foundation/utils/function';
import useDefaultProps from '../_base/use-default-props';
import Label, { type LabelProps } from '../form/label';
import useLocale from '../locale/use-locale';
import type { InputSize } from './index';

const prefixCls = cssClasses.PREFIX;

export interface InputGroupProps {
    className?: string;
    children?: React.ReactNode;
    size?: InputSize;
    style?: Record<string, any>;
    onBlur?: (e: React.FocusEvent<HTMLSpanElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLSpanElement>) => void;
    label?: LabelProps;
    labelPosition?: string;
    disabled?: boolean;
    /** Attached to the role="group" span, also when a label wraps it */
    ref?: React.Ref<HTMLSpanElement>;
}

const defaultProps = {
    size: 'default',
    className: '',
    onBlur: noop,
    onFocus: noop,
} satisfies Partial<InputGroupProps>;

export default function InputGroup(rawProps: InputGroupProps) {
    const props = useDefaultProps('InputGroup', rawProps, defaultProps);
    const { ref, size, style, className, children, label, onBlur: groupOnBlur, onFocus: groupOnFocus, disabled: groupDisabled, ...rest } = props;

    const { locale } = useLocale('Input');

    const generatedLabelId = useId();

    const labelId = label?.id ?? generatedLabelId;

    const inner = React.Children.map(children, (item: React.ReactNode) => {
        if (React.isValidElement<Record<string, unknown>>(item)) {
            const disabled = typeof item.props.disabled === 'boolean' ? item.props.disabled : groupDisabled;
            // onBlur / onFocus are not passed down: the group's span sees them by bubbling, so they would fire twice
            // the group's other props (labelPosition included) go to every child, not to the group element
            return React.cloneElement(item, { ...rest, size, disabled });
        }
        return item;
    });

    if (label && (label.text || label.text === 0)) {
        return (
            <div
                className={clsx({
                    [`${prefixCls}-group-wrapper`]: true,
                    [`${prefixCls}-group-wrapper-with-top-label`]: props.labelPosition === 'top',
                    [`${prefixCls}-group-wrapper-with-left-label`]: props.labelPosition === 'left',
                })}
            >
                <Label {...label} id={labelId} />
                <span
                    ref={ref}
                    id={label.name}
                    className={clsx(`${prefixCls}-group`, className, {
                        [`${prefixCls}-${size}`]: size !== 'default',
                    })}
                    style={style}
                    aria-labelledby={labelId}
                    role="group"
                    onBlur={groupOnBlur}
                    onFocus={groupOnFocus}
                >
                    {inner}
                </span>
            </div>
        );
    }

    return (
        <span
            ref={ref}
            className={clsx(
                `${prefixCls}-group`,
                {
                    [`${prefixCls}-${size}`]: size !== 'default',
                },
                className
            )}
            style={style}
            aria-label={locale.group}
            role="group"
            onBlur={groupOnBlur}
            onFocus={groupOnFocus}
        >
            {inner}
        </span>
    );
}
