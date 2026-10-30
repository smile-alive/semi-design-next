import type React from 'react';
import { useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { type strings, radioClasses as css } from '@fibrae/semi-foundation/radio/constants';
import RadioFoundation, { type RadioAdapter, type RadioChangeEvent } from '@fibrae/semi-foundation/radio/radio-foundation';
import '@fibrae/semi-foundation/radio/radio.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { hasContent } from '../_utils';
import { type RadioMode, useRadioGroupContext } from './context';
import RadioInner from './radio-inner';

export type RadioDisplayMode = 'vertical' | '';
export type RadioType = typeof strings.TYPE_DEFAULT | typeof strings.TYPE_BUTTON | typeof strings.TYPE_CARD | typeof strings.TYPE_PURECARD;

export interface RadioHandle {
    focus: () => void;
    blur: () => void;
}

export interface RadioProps extends ElementProps<'label', 'onChange'> {
    autoFocus?: boolean;
    checked?: boolean;
    children?: React.ReactNode;
    defaultChecked?: boolean;
    value?: string | number | boolean;
    disabled?: boolean;
    prefixCls?: string;
    displayMode?: RadioDisplayMode;
    onChange?: (e: RadioChangeEvent) => void;
    mode?: RadioMode;
    extra?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    addonStyle?: React.CSSProperties;
    addonClassName?: string;
    type?: RadioType;
    addonId?: string;
    extraId?: string;
    name?: string;
    preventScroll?: boolean;
    ref?: React.Ref<RadioHandle>;
}

export interface RadioState {
    checked?: boolean;
}

export type { RadioChangeEvent };

const defaultProps = {
    autoFocus: false,
    defaultChecked: false,
    mode: '',
    type: 'default',
} satisfies Partial<RadioProps>;

export default function Radio(rawProps: RadioProps) {
    const { ref, ...props } = useDefaultProps('Radio', rawProps, defaultProps);

    const {
        addonClassName,
        addonStyle,
        id,
        onClick,
        style,
        className,
        displayMode,
        children,
        extra,
        name,
        autoFocus,
        disabled: disabledProp,
        prefixCls: prefixClsProp,
        mode: modeProp,
        type,
        value,
        checked: checkedProp,
        defaultChecked,
        onChange,
        addonId: addonIdProp,
        extraId: extraIdProp,
        preventScroll,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-required': ariaRequired,
        tabIndex,
        validateStatus,
        insetLabel,
        insetLabelId,
        ...rest
    } = props as Omit<RadioProps, 'ref'> & Pick<React.AriaAttributes, 'aria-labelledby' | 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required'> & { tabIndex?: number; validateStatus?: unknown; insetLabel?: unknown; insetLabelId?: unknown };

    const context = useRadioGroupContext();

    const inputRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();

    const [foundation, state] = useFoundation<RadioFoundation<RadioProps, RadioState>, RadioAdapter<RadioProps, RadioState>, RadioProps, RadioState>(
        RadioFoundation,
        props,
        () => RadioFoundation.getInitialState(props),
        (base) => ({
            setChecked: (checked) => base.setState({ checked }),
            notifyGroupChange: (e) => base.getContexts()?.radioGroup?.onChange?.(e),
            notifyChange: (e) => base.getProps().onChange?.(e),
            getInput: () => inputRef.current,
        }),
        context
    );

    const radioGroup = context?.radioGroup;
    const { checked, disabled, isButtonRadio, isCardRadio, isPureCardRadio, buttonSize, prefixCls } = RadioFoundation.deriveView(props, state, context);
    const isButtonRadioComponent = !radioGroup && isButtonRadio;
    const addonId = addonIdProp || `addon-${generatedId}`;
    const extraId = extraIdProp || `extra-${generatedId}`;
    const prefix = prefixCls || css.PREFIX;

    const wrapper = clsx(prefix, {
        [`${prefix}-disabled`]: disabled,
        [`${prefix}-checked`]: checked,
        [`${prefix}-${displayMode}`]: Boolean(displayMode),
        [`${prefix}-buttonRadioComponent`]: isButtonRadioComponent,
        [`${prefix}-buttonRadioGroup`]: isButtonRadio,
        [`${prefix}-buttonRadioGroup-${buttonSize}`]: isButtonRadio && buttonSize,
        [`${prefix}-cardRadioGroup`]: isCardRadio,
        [`${prefix}-cardRadioGroup_disabled`]: disabled && isCardRadio,
        [`${prefix}-cardRadioGroup_checked`]: isCardRadio && checked && !disabled,
        [`${prefix}-cardRadioGroup_checked_disabled`]: isCardRadio && checked && disabled,
        [className]: Boolean(className),
    });

    const addonCls = clsx(
        {
            [`${prefix}-addon`]: !isButtonRadio,
            [`${prefix}-addon-buttonRadio`]: isButtonRadio,
            [`${prefix}-addon-buttonRadio-checked`]: isButtonRadio && checked,
            [`${prefix}-addon-buttonRadio-disabled`]: isButtonRadio && disabled,
            [`${prefix}-addon-buttonRadio-${buttonSize}`]: isButtonRadio && buttonSize,
        },
        addonClassName
    );

    const hasChildren = hasContent(children);

    // a button radio is only its label, so its extra is not rendered
    const hasExtra = hasContent(extra) && !isButtonRadio;

    const content =
        hasChildren || hasExtra ? (
            <div className={clsx([`${prefix}-content`, { [`${prefix}-isCardRadioGroup_content`]: isCardRadio }])}>
                {hasChildren && (
                    <span id={addonId} className={addonCls} style={addonStyle} x-semi-prop="children">
                        {children}
                    </span>
                )}
                {hasExtra && (
                    <div id={extraId} className={`${prefix}-extra`} x-semi-prop="extra">
                        {extra}
                    </div>
                )}
            </div>
        ) : null;

    // `checked` going back to undefined (a Form reset) unchecks; other non-boolean values are ignored
    useDidUpdate(props.checked, (checked) => {
        if (checked === undefined) {
            foundation.setChecked(false);
        } else if (typeof checked === 'boolean') {
            foundation.setChecked(checked);
        }
    });

    useImperativeHandle(
        ref,
        () => ({
            focus: () => inputRef.current.focus({ preventScroll: props.preventScroll }),
            blur: () => inputRef.current.blur(),
        }),
        [props.preventScroll]
    );

    return (
        // the browser repeats a click on the label text as a click on the input; the owner's handler hears it once
        <label
            {...rest}
            className={wrapper}
            style={style}
            onClick={(e) => {
                if (e.target === inputRef.current) {
                    onClick?.(e);
                }
            }}
        >
            <RadioInner
                ref={inputRef}
                id={id}
                name={name ?? radioGroup?.name}
                aria-describedby={ariaDescribedby}
                aria-errormessage={ariaErrormessage}
                aria-invalid={ariaInvalid}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                autoFocus={autoFocus}
                tabIndex={tabIndex}
                checked={checked}
                disabled={disabled}
                value={value === undefined ? undefined : String(value)}
                addonId={hasChildren ? addonId : undefined}
                extraId={hasExtra ? extraId : undefined}
                isButtonRadio={isButtonRadio}
                isPureCardRadio={isPureCardRadio}
                prefixCls={prefixClsProp}
                onChange={(e) => foundation.handleChange(e.target.checked, e)}
                onClick={foundation.handleClick}
                onKeyUp={foundation.handleKeyUp}
            />
            {content}
        </label>
    );
}
