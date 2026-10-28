import type React from 'react';
import { useId } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import CheckboxGroupFoundation, { type CheckboxGroupAdapter, type CheckboxValue } from '@fibrae/semi-foundation/checkbox/checkbox-group-foundation';
import { checkboxGroupClasses as css, strings } from '@fibrae/semi-foundation/checkbox/constants';
import { noop } from '@fibrae/semi-foundation/utils/function';
import type { ArrayElement, ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { hasContent } from '../_utils';
import Checkbox, { type CheckboxProps } from './checkbox';
import { CheckboxGroupContext } from './context';

export type CheckboxDirection = ArrayElement<typeof strings.DIRECTION_SET>;
export type CheckboxType = typeof strings.TYPE_DEFAULT | typeof strings.TYPE_CARD | typeof strings.TYPE_PURECARD;

export type { CheckboxValue };

export interface CheckboxOptionItem {
    label?: React.ReactNode;
    value?: CheckboxValue;
    disabled?: boolean;
    extra?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    onChange?: CheckboxProps['onChange'];
}

export interface CheckboxGroupProps extends ElementProps<'div', 'onChange' | 'defaultValue'> {
    defaultValue?: CheckboxValue[];
    disabled?: boolean;
    name?: string;
    options?: Array<string | CheckboxOptionItem>;
    value?: CheckboxValue[];
    onChange?: (value: CheckboxValue[]) => void;
    children?: React.ReactNode;
    prefixCls?: string;
    direction?: CheckboxDirection;
    style?: React.CSSProperties;
    className?: string;
    type?: CheckboxType;
    id?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export type CheckboxGroupState = {
    value?: CheckboxValue[];
};

const defaultProps = {
    disabled: false,
    onChange: noop,
    type: strings.TYPE_DEFAULT,
    defaultValue: [],
    direction: strings.DEFAULT_DIRECTION,
} satisfies Partial<CheckboxGroupProps>;

export default function CheckboxGroup(rawProps: CheckboxGroupProps) {
    const props = useDefaultProps('CheckboxGroup', rawProps, defaultProps);

    const {
        ref,
        children,
        options,
        prefixCls,
        direction,
        className,
        type,
        disabled,
        name,
        value,
        defaultValue,
        onChange,
        // role="group" supports none of these; invalid/errormessage go to each checkbox, required is dropped
        // since on each checkbox it would mean every one is required
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-required': ariaRequired,
        // Tooltip injects these for a dialog trigger; group supports none of them and tabIndex adds a stray Tab stop
        'aria-expanded': ariaExpanded,
        'aria-haspopup': ariaHaspopup,
        'aria-controls': ariaControls,
        tabIndex,
        validateStatus,
        insetLabel,
        insetLabelId,
        onBlur,
        ...rest
    } = props as CheckboxGroupProps & {
        validateStatus?: unknown;
        insetLabel?: unknown;
        insetLabelId?: unknown;
        'aria-expanded'?: unknown;
        'aria-haspopup'?: unknown;
        'aria-controls'?: unknown;
        tabIndex?: unknown;
        onBlur?: React.FocusEventHandler<HTMLDivElement>;
    };

    const generatedName = useId();
    let inner: React.ReactNode;

    const [foundation, state] = useFoundation<CheckboxGroupFoundation<CheckboxGroupProps, CheckboxGroupState>, CheckboxGroupAdapter<CheckboxGroupProps, CheckboxGroupState>, CheckboxGroupProps, CheckboxGroupState>(
        CheckboxGroupFoundation,
        props,
        () => ({ value: props.value || props.defaultValue }),
        (base) => ({
            updateGroupValue: (value) => base.setState({ value }),
            notifyChange: (value) => base.getProps().onChange?.(value),
        })
    );

    const isPureCardType = type === strings.TYPE_PURECARD;
    const isCardType = type === strings.TYPE_CARD || isPureCardType;
    const prefix = prefixCls || css.PREFIX;

    const prefixClsDisplay = clsx(
        {
            [prefix]: true,
            [`${prefix}-wrapper`]: true,
            [`${prefix}-${direction}`]: direction,
            [`${prefix}-${direction}-cardType`]: direction && isCardType,
            [`${prefix}-${direction}-pureCardType`]: direction && isPureCardType,
        },
        className
    );

    // deep comparison: Tree and TreeSelect pass a new array on every render
    useDidUpdate(props.value, (value, previous) => {
        if (!isEqual(previous, value)) {
            foundation.handlePropValueChange(value);
        }
    });

    if (options) {
        inner = options.map((option, index) =>
            typeof option === 'string' ? (
                <Checkbox key={index} disabled={disabled} value={option} prefixCls={prefixCls}>
                    {option}
                </Checkbox>
            ) : (
                <Checkbox key={index} className={option.className} style={option.style} disabled={option.disabled || disabled} value={option.value} prefixCls={prefixCls} extra={option.extra} onChange={option.onChange}>
                    {option.label}
                </Checkbox>
            )
        );
    } else if (hasContent(children)) {
        inner = children;
    }

    return (
        <div
            {...rest}
            ref={ref}
            className={prefixClsDisplay}
            role="group"
            // moving between the boxes is not leaving the group: Form's blur validation waits until focus is outside
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    onBlur?.(e);
                }
            }}
        >
            <CheckboxGroupContext
                value={{
                    checkboxGroup: {
                        onChange: (evt) => foundation.handleChange(evt),
                        value: CheckboxGroupFoundation.deriveValue(props, state),
                        disabled,
                        name: name || generatedName,
                        isCardType,
                        isPureCardType,
                        ariaInvalid,
                        ariaErrormessage,
                    },
                }}
            >
                {inner}
            </CheckboxGroupContext>
        </div>
    );
}
