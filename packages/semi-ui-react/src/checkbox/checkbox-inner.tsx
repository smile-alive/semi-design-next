import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { checkboxClasses as css } from '@fibrae/semi-foundation/checkbox/constants';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import { IconCheckboxTick, IconCheckboxIndeterminate } from '@fibrae/semi-icons-react';
import useMergedRef from '../_base/use-merged-ref';

export interface CheckboxInnerProps {
    'aria-describedby'?: React.AriaAttributes['aria-describedby'];
    'aria-errormessage'?: React.AriaAttributes['aria-errormessage'];
    'aria-invalid'?: React.AriaAttributes['aria-invalid'];
    'aria-labelledby'?: React.AriaAttributes['aria-labelledby'];
    'aria-required'?: React.AriaAttributes['aria-required'];
    indeterminate?: boolean;
    checked?: boolean;
    disabled?: boolean;
    prefixCls?: string;
    id?: string;
    name?: string;
    value?: string;
    isPureCardType?: boolean;
    /** Attached to the native input */
    ref?: React.Ref<HTMLInputElement>;
    extraId?: string;
    'aria-label'?: React.AriaAttributes['aria-label'];
    /** Attached to the native input */
    tabIndex?: number;
    autoFocus?: boolean;
}

export default function CheckboxInner({
    ref,
    indeterminate,
    checked,
    disabled,
    prefixCls,
    id,
    name,
    value,
    isPureCardType,
    extraId,
    tabIndex,
    autoFocus,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    'aria-labelledby': ariaLabelledby,
    'aria-invalid': ariaInvalid,
    'aria-errormessage': ariaErrormessage,
    'aria-required': ariaRequired,
}: CheckboxInnerProps) {
    const nativeRef = useRef<HTMLInputElement>(null);

    const prefix = prefixCls || css.PREFIX;

    const wrapper = clsx({
        [`${prefix}-inner`]: true,
        [`${prefix}-inner-checked`]: Boolean(checked),
        [`${prefix}-inner-pureCardType`]: isPureCardType,
    });

    // the native flag is what assistive tech reads as "mixed"; it is a DOM property, not an attribute
    const showMixed = Boolean(indeterminate && !checked);
    const mergedRef = useMergedRef(ref, nativeRef);
    const icon = checked ? <IconCheckboxTick /> : indeterminate ? <IconCheckboxIndeterminate /> : null;

    useLayoutEffect(() => {
        nativeRef.current.indeterminate = showMixed;
    }, [showMixed]);

    return (
        <span className={wrapper}>
            <input
                ref={mergedRef}
                id={id}
                name={name || undefined}
                type="checkbox"
                className={css.INPUT}
                aria-describedby={joinIds(ariaDescribedby, extraId)}
                aria-errormessage={ariaErrormessage}
                aria-invalid={ariaInvalid}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                aria-required={ariaRequired}
                autoFocus={autoFocus}
                tabIndex={tabIndex}
                checked={checked}
                disabled={disabled}
                value={value}
                // a click clears the native flag even when the state is unchanged (controlled)
                onChange={(e) => {
                    e.currentTarget.indeterminate = showMixed;
                }}
            />
            <span className={`${prefix}-inner-display`}>{icon}</span>
        </span>
    );
}
