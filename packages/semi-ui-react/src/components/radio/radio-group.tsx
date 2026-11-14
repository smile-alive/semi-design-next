import type React from 'react';
import { Children, isValidElement, useId } from 'react';
import clsx from 'clsx';
import { type RadioPart, radioGroupClasses as css, strings } from '@fibrae/semi-foundation/components/radio/constants';
import type { RadioChangeEvent } from '@fibrae/semi-foundation/components/radio/radio-foundation';
import RadioGroupFoundation, { type RadioGroupAdapter, type RadioGroupBaseState } from '@fibrae/semi-foundation/components/radio/radio-group-foundation';
import type { ArrayElement } from '@fibrae/semi-foundation/utils';
import { type ElementProps, useDefaultProps, useFoundation } from '../../base/index';
import { hasContent } from '../../utils/index';
import { RadioGroupContext, type RadioGroupButtonSize, type RadioMode } from './context';
import Radio, { type RadioType } from './radio';

type Foundation = RadioGroupFoundation<RadioGroupProps>;
type Adapter = RadioGroupAdapter<RadioGroupProps>;

export interface OptionItem {
    label?: React.ReactNode;
    value?: string | number | boolean;
    disabled?: boolean;
    extra?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    addonId?: string;
    classNames?: Partial<Record<RadioPart, string>>;
    styles?: Partial<Record<RadioPart, React.CSSProperties>>;
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
    id?: string;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

export type RadioGroupState = RadioGroupBaseState;

const defaultProps = {
    disabled: false,
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
    };

    // one name per group keeps native arrow keys and form submission from crossing groups
    const generatedName = useId();
    let inner;

    const [foundation, state] = useFoundation<Foundation, Adapter, RadioGroupProps, RadioGroupState>(
        RadioGroupFoundation,
        props,
        () => RadioGroupFoundation.getInitialState(props),
        (base) => ({
            notifyChange: (evt) => base.getProps().onChange?.(evt),
            notifyBlur: (e) => base.getProps().onBlur?.(e),
        })
    );

    const isButtonRadio = type === strings.TYPE_BUTTON;
    const isPureCardRadio = type === strings.TYPE_PURECARD;
    const isCardRadio = type === strings.TYPE_CARD || isPureCardRadio;
    const isDefaultRadio = type === strings.TYPE_DEFAULT;
    const prefix = css.PREFIX;

    const prefixClsDisplay = clsx(className, {
        [prefix]: true,
        [`${prefix}-wrapper`]: true,
        [`${prefix}-${direction}`]: direction && !isButtonRadio,
        [`${prefix}-${direction}-default`]: direction && isDefaultRadio,
        [`${prefix}-${direction}-card`]: direction && isCardRadio,
        [`${prefix}-buttonRadio`]: isButtonRadio,
    });

    if (options) {
        inner = options.map((option, index) =>
            typeof option === 'string' ? (
                <Radio key={index} disabled={disabled} value={option}>
                    {option}
                </Radio>
            ) : (
                <Radio key={index} className={option.className} classNames={option.classNames} style={option.style} styles={option.styles} disabled={option.disabled || disabled} value={option.value} addonId={option.addonId} extraId={option.extraId} extra={option.extra}>
                    {option.label}
                </Radio>
            )
        );
    } else if (hasContent(children)) {
        inner = Children.map(children, (itm) => (isValidElement(itm) ? itm : null));
    }

    return (
        <div {...rest} ref={ref} className={prefixClsDisplay} style={style} role="radiogroup" onBlur={foundation.handleBlur}>
            <RadioGroupContext
                value={{
                    radioGroup: {
                        onChange: foundation.handleChange,
                        value: RadioGroupFoundation.deriveValue(props, state),
                        disabled,
                        name: name || generatedName,
                        isButtonRadio,
                        isCardRadio,
                        isPureCardRadio,
                        buttonSize,
                    },
                    mode,
                }}
            >
                {inner}
            </RadioGroupContext>
        </div>
    );
}
