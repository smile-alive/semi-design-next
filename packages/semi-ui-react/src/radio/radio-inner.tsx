import type React from 'react';
import clsx from 'clsx';
import { radioClasses as css } from '@fibrae/semi-foundation/radio/constants';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import { IconRadio } from '@fibrae/semi-icons-react';

export interface RadioInnerProps {
    checked?: boolean;
    disabled?: boolean;
    isButtonRadio?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** Fires for every click on the native input, which a native radio does not report as a change when it is checked */
    onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    autoFocus?: boolean;
    id?: string;
    name?: string;
    value?: string;
    prefixCls?: string;
    /** Attached to the native input */
    ref?: React.Ref<HTMLInputElement>;
    isPureCardRadio?: boolean;
    addonId?: string;
    extraId?: string;
    'aria-label'?: React.AriaAttributes['aria-label'];
    'aria-labelledby'?: React.AriaAttributes['aria-labelledby'];
    'aria-describedby'?: React.AriaAttributes['aria-describedby'];
    /** Reaches the input as part of its description, see below */
    'aria-errormessage'?: React.AriaAttributes['aria-errormessage'];
    'aria-invalid'?: React.AriaAttributes['aria-invalid'];
    tabIndex?: number;
}

// A view: the parent Radio decides `checked` and handles the events
export default function RadioInner({
    ref,
    checked,
    disabled,
    autoFocus,
    id,
    name,
    value,
    isButtonRadio,
    isPureCardRadio,
    addonId,
    extraId,
    tabIndex,
    prefixCls,
    onChange,
    onClick,
    onKeyUp,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-errormessage': ariaErrormessage,
    'aria-invalid': ariaInvalid,
}: RadioInnerProps) {
    const prefix = prefixCls || css.PREFIX;

    const wrapper = clsx({
        [`${prefix}-inner`]: true,
        [`${prefix}-inner-checked`]: Boolean(checked),
        [`${prefix}-inner-buttonRadio`]: isButtonRadio,
        [`${prefix}-inner-pureCardRadio`]: isPureCardRadio,
    });

    const inner = clsx({ [`${prefix}-inner-display`]: !isButtonRadio });

    // The radio role supports no aria-invalid/errormessage/required (radiogroup does),
    // so the error goes in the description
    const describedby = joinIds(ariaDescribedby, extraId, ariaInvalid ? ariaErrormessage : undefined);

    return (
        <span className={wrapper}>
            <input
                ref={ref}
                id={id}
                name={name}
                type="radio"
                aria-describedby={describedby}
                aria-label={ariaLabel}
                aria-labelledby={joinIds(ariaLabelledby, addonId)}
                autoFocus={autoFocus}
                tabIndex={tabIndex}
                checked={Boolean(checked)}
                disabled={disabled}
                value={value}
                onChange={onChange}
                onClick={onClick}
                onKeyUp={onKeyUp}
            />
            <span className={inner}>{checked && <IconRadio />}</span>
        </span>
    );
}
