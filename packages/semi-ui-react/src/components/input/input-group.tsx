import React, { useId, useMemo } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/input/constants';
import { type ElementProps, usePopupLayer, useDefaultProps } from '../../base/index';
import Label, { type LabelProps } from '../form/label';
import useLocale from '../locale/use-locale';
import { InputGroupContext } from './context';
import type { InputSize } from './input';

const prefixCls = cssClasses.PREFIX;

export interface InputGroupProps extends ElementProps<'span'> {
    /** Default size of the controls in the group, at any depth; a control's own size wins */
    size?: InputSize;
    onBlur?: (e: React.FocusEvent<HTMLSpanElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLSpanElement>) => void;
    label?: LabelProps;
    labelPosition?: string;
    /** Default disabled of the controls in the group, at any depth; a control's own disabled wins */
    disabled?: boolean;
    /** Attached to the role="group" span, also when a label wraps it */
    ref?: React.Ref<HTMLSpanElement>;
}

const defaultProps = {
    className: '',
} satisfies Partial<InputGroupProps>;

export default function InputGroup(rawProps: InputGroupProps) {
    const { ref, size, style, className, children, label, labelPosition, onBlur, onFocus, disabled, ...rest } = useDefaultProps('InputGroup', rawProps, defaultProps);

    const { locale } = useLocale('Input');
    const layer = usePopupLayer();

    const generatedLabelId = useId();

    const groupContext = useMemo(() => ({ size, disabled, layer }), [size, disabled, layer]);
    const labelId = label?.id ?? generatedLabelId;
    const sizeCls = size && size !== 'default' ? `${prefixCls}-${size}` : undefined;

    // the group's own span sees the controls' focus events by bubbling, so they are not passed down
    const content = <InputGroupContext value={groupContext}>{children}</InputGroupContext>;

    if (label && (label.text || label.text === 0)) {
        return (
            <div
                className={clsx({
                    [`${prefixCls}-group-wrapper`]: true,
                    [`${prefixCls}-group-wrapper-with-top-label`]: labelPosition === 'top',
                    [`${prefixCls}-group-wrapper-with-left-label`]: labelPosition === 'left',
                })}
            >
                <Label {...label} id={labelId} />
                <span id={label.name} className={clsx(`${prefixCls}-group`, className, sizeCls)} style={style} aria-labelledby={labelId} role="group" {...rest} ref={ref} onBlur={onBlur} onFocus={onFocus}>
                    {content}
                </span>
            </div>
        );
    }

    return (
        <span className={clsx(`${prefixCls}-group`, sizeCls, className)} style={style} aria-label={locale.group} role="group" {...rest} ref={ref} onBlur={onBlur} onFocus={onFocus}>
            {content}
        </span>
    );
}
