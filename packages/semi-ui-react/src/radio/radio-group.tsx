import type React from 'react';
import { Children, isValidElement, useId } from 'react';
import clsx from 'clsx';
import { radioGroupClasses as css, strings } from '@fibrae/semi-foundation/radio/constants';
import type { RadioChangeEvent } from '@fibrae/semi-foundation/radio/radio-foundation';
import RadioGroupFoundation, { type RadioGroupAdapter } from '@fibrae/semi-foundation/radio/radio-group-foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import type { ArrayElement, ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { hasContent } from '../_utils';
import { RadioGroupContext, type RadioGroupButtonSize, type RadioMode } from './context';
import Radio, { type RadioType } from './radio';

export interface OptionItem {
    label?: React.ReactNode;
    value?: string | number | boolean;
    disabled?: boolean;
    extra?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    addonId?: string;
    addonStyle?: React.CSSProperties;
    addonClassName?: string;
    extraId?: string;
}
export type Options = string[] | Array<OptionItem>;

export interface RadioGroupProps extends ElementProps<'div', 'onChange' | 'defaultValue'> {
    defaultValue?: string | number | boolean;
    disabled?: boolean;
    name?: string;
    options?: Options;
    value?: string | number | boolean;
    onChange?: (event: RadioChangeEvent) => void;
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    direction?: ArrayElement<typeof strings.DIRECTION_SET>;
    mode?: RadioMode;
    type?: RadioType;
    buttonSize?: RadioGroupButtonSize;
    prefixCls?: string;
    id?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export interface RadioGroupState {
    value?: any;
}

const defaultProps = {
    disabled: false,
    onChange: noop,
    direction: strings.DEFAULT_DIRECTION,
    mode: '',
    type: strings.TYPE_DEFAULT,
    buttonSize: 'middle',
} satisfies Partial<RadioGroupProps>;

export default function RadioGroup(rawProps: RadioGroupProps) {
    const props = useDefaultProps('RadioGroup', rawProps, defaultProps);

    const {
        ref,
        children,
        options,
        mode,
        prefixCls,
        className,
        style,
        direction,
        type,
        buttonSize,
        defaultValue,
        disabled,
        name,
        value: valueProp,
        onChange,
        validateStatus,
        insetLabel,
        insetLabelId,
        onBlur,
        // injected by Tooltip; unsupported on radiogroup, and tabIndex adds a stray Tab stop
        'aria-expanded': ariaExpanded,
        'aria-haspopup': ariaHaspopup,
        'aria-controls': ariaControls,
        tabIndex,
        ...rest
    } = props as RadioGroupProps & {
        validateStatus?: unknown;
        insetLabel?: unknown;
        insetLabelId?: unknown;
        'aria-expanded'?: unknown;
        'aria-haspopup'?: unknown;
        'aria-controls'?: unknown;
        tabIndex?: unknown;
        onBlur?: React.FocusEventHandler<HTMLDivElement>;
    };

    // one name per group keeps native arrow keys and form submission from crossing groups
    const generatedName = useId();
    let inner;

    const [foundation, state] = useFoundation<RadioGroupFoundation<RadioGroupProps, RadioGroupState>, RadioGroupAdapter<RadioGroupProps, RadioGroupState>, RadioGroupProps, RadioGroupState>(
        RadioGroupFoundation,
        props,
        () => ({ value: props.value === undefined ? props.defaultValue : props.value }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            notifyChange: (evt) => base.getProps().onChange?.(evt),
        })
    );

    const isButtonRadio = type === strings.TYPE_BUTTON;
    const isPureCardRadio = type === strings.TYPE_PURECARD;
    const isCardRadio = type === strings.TYPE_CARD || isPureCardRadio;
    const isDefaultRadio = type === strings.TYPE_DEFAULT;
    const prefix = prefixCls || css.PREFIX;

    const prefixClsDisplay = clsx(className, {
        [prefix]: true,
        [`${prefix}-wrapper`]: true,
        [`${prefix}-${direction}`]: direction && !isButtonRadio,
        [`${prefix}-${direction}-default`]: direction && isDefaultRadio,
        [`${prefix}-${direction}-card`]: direction && isCardRadio,
        [`${prefix}-buttonRadio`]: isButtonRadio,
    });

    // Object.is treats NaN as unchanged, so a NaN value does not loop
    useDidUpdate(props.value, (value) => foundation.handlePropValueChange(value));

    if (options) {
        inner = options.map((option, index) =>
            typeof option === 'string' ? (
                <Radio key={index} disabled={disabled} value={option}>
                    {option}
                </Radio>
            ) : (
                <Radio key={index} addonClassName={option.addonClassName} className={option.className} addonStyle={option.addonStyle} style={option.style} disabled={option.disabled || disabled} value={option.value} addonId={option.addonId} extraId={option.extraId} extra={option.extra}>
                    {option.label}
                </Radio>
            )
        );
    } else if (hasContent(children)) {
        inner = Children.map(children, (itm) => (isValidElement(itm) ? itm : null));
    }

    return (
        <div
            {...rest}
            ref={ref}
            className={prefixClsDisplay}
            style={style}
            role="radiogroup"
            // Form's blur validation waits until focus leaves the group
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    onBlur?.(e);
                }
            }}
        >
            <RadioGroupContext
                value={{
                    radioGroup: {
                        onChange: (evt) => foundation.handleChange(evt),
                        value: valueProp === undefined ? state.value : valueProp,
                        disabled,
                        name: name || generatedName,
                        isButtonRadio,
                        isCardRadio,
                        isPureCardRadio,
                        buttonSize,
                        prefixCls,
                    },
                    mode,
                }}
            >
                {inner}
            </RadioGroupContext>
        </div>
    );
}
