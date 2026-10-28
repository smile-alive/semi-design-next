import type React from 'react';
import { useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import CheckboxFoundation, { type CheckboxAdapter, type BasicCheckboxEvent, type BasicTargetObject, type BaseCheckboxProps } from '@fibrae/semi-foundation/checkbox/checkbox-foundation';
import { checkboxClasses as css } from '@fibrae/semi-foundation/checkbox/constants';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import { noop } from '@fibrae/semi-foundation/utils/function';
import { focusWithoutRing } from '@fibrae/semi-foundation/utils/supports';
import '@fibrae/semi-foundation/checkbox/checkbox.scss';
import type { ElementProps } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { hasContent } from '../_utils';
import type { CheckboxType } from './checkbox-group';
import CheckboxInner from './checkbox-inner';
import { useCheckboxGroupContext } from './context';

export interface CheckboxEvent extends BasicCheckboxEvent {
    nativeEvent: {
        stopImmediatePropagation: () => void;
    };
}
export type TargetObject = BasicTargetObject;

export interface CheckboxHandle {
    focus: () => void;
    blur: () => void;
}

export interface CheckboxProps extends BaseCheckboxProps, ElementProps<'span', 'onChange' | 'onMouseEnter' | 'onMouseLeave'> {
    children?: React.ReactNode;
    onChange?: (e: CheckboxEvent) => any;
    style?: React.CSSProperties;
    extra?: React.ReactNode;
    /** Attached to the native input; inside a group the group's name wins */
    name?: string;
    /** Attached to the native input, the focus target */
    tabIndex?: number;
    addonId?: string;
    extraId?: string;
    type?: CheckboxType;
    ref?: React.Ref<CheckboxHandle>;
}

interface CheckboxState {
    checked: boolean;
}

const defaultProps = {
    defaultChecked: false,
    indeterminate: false,
    onChange: noop,
    onMouseEnter: noop,
    onMouseLeave: noop,
    type: 'default',
} satisfies Partial<CheckboxProps>;

type InjectedProps = {
    'x-semi-children-alias'?: string;
    validateStatus?: unknown;
    insetLabel?: unknown;
    insetLabelId?: unknown;
};

export default function Checkbox(rawProps: CheckboxProps) {
    const props = useDefaultProps('Checkbox', rawProps, defaultProps);

    const {
        ref,
        disabled: disabledProp,
        style,
        prefixCls,
        className,
        indeterminate,
        children,
        onMouseEnter,
        onMouseLeave,
        extra,
        value,
        role,
        tabIndex,
        id,
        type,
        checked: checkedProp,
        defaultChecked,
        onChange,
        onClick,
        autoFocus,
        preventScroll,
        addonId: addonIdProp,
        extraId: extraIdProp,
        name: nameProp,
        'x-semi-children-alias': childrenAlias,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessageProp,
        'aria-invalid': ariaInvalidProp,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        validateStatus,
        insetLabel,
        insetLabelId,
        ...rest
    } = props as CheckboxProps & InjectedProps;

    const context = useCheckboxGroupContext();

    const inputRef = useRef<HTMLInputElement>(null);

    const [foundation, state] = useFoundation<CheckboxFoundation, CheckboxAdapter<CheckboxProps, CheckboxState>, CheckboxProps, CheckboxState>(
        CheckboxFoundation,
        props,
        () => ({ checked: Boolean(props.checked ?? props.defaultChecked) }),
        (base) => ({
            setChecked: (checked) => base.setState({ checked }),
            notifyChange: (event) => base.getProps().onChange?.(event),
            generateEvent: (checked, e) => {
                const { ref, ...target } = base.getProps();
                return {
                    target: { ...target, checked },
                    stopPropagation: () => e.stopPropagation(),
                    preventDefault: () => e.preventDefault(),
                    nativeEvent: {
                        stopImmediatePropagation: () => {
                            if (typeof e.nativeEvent?.stopImmediatePropagation === 'function') {
                                e.nativeEvent.stopImmediatePropagation();
                            }
                        },
                    },
                };
            },
            getIsInGroup: () => Boolean(base.getContexts()?.checkboxGroup && base.getProps().value !== undefined),
            getGroupValue: () => base.getContexts()?.checkboxGroup?.value || [],
            notifyGroupChange: (event) => base.getContexts().checkboxGroup.onChange(event),
            getGroupDisabled: () => base.getContexts()?.checkboxGroup?.disabled,
            // script focus matches :focus-visible when nothing was focused; a click must not look like keyboard focus
            focusCheckboxEntity: () => {
                const input = inputRef.current;
                if (input && input !== input.ownerDocument.activeElement) {
                    focusWithoutRing(input, { preventScroll: base.getProps().preventScroll });
                }
            },
        }),
        context
    );

    const { checked, disabled, name, isCardType, isPureCardType, ariaInvalid, ariaErrormessage } = CheckboxFoundation.deriveView({ checked: checkedProp, disabled: disabledProp, name: nameProp, type, value, 'aria-invalid': ariaInvalidProp, 'aria-errormessage': ariaErrormessageProp }, state, context.checkboxGroup);
    const prefix = prefixCls || css.PREFIX;

    const wrapper = clsx(prefix, className, {
        [`${prefix}-disabled`]: disabled,
        [`${prefix}-indeterminate`]: indeterminate,
        [`${prefix}-checked`]: checked,
        [`${prefix}-unChecked`]: !checked,
        [`${prefix}-cardType`]: isCardType,
        [`${prefix}-cardType_disabled`]: disabled && isCardType,
        [`${prefix}-cardType_enable`]: !(disabled && isCardType),
        [`${prefix}-cardType_checked`]: isCardType && checked && !disabled,
        [`${prefix}-cardType_checked_disabled`]: isCardType && checked && disabled,
    });

    const hasChildren = hasContent(children);
    const hasExtra = hasContent(extra);

    const extraCls = clsx(`${prefix}-extra`, {
        [`${prefix}-cardType_extra_noChildren`]: isCardType && !hasChildren,
    });

    // only a boolean or undefined (Form reset) checked is mirrored; other values keep the current state
    useDidUpdate(props.checked, (checked) => {
        if (checked === undefined || typeof checked === 'boolean') {
            foundation.setChecked(Boolean(checked));
        }
    });

    const uid = useId();

    const addonId = addonIdProp || `addon-${uid}`;
    const extraId = extraIdProp || `extra-${uid}`;

    useImperativeHandle(
        props.ref,
        () => ({
            focus: () => inputRef.current?.focus({ preventScroll: props.preventScroll }),
            blur: () => inputRef.current?.blur(),
        }),
        [props.preventScroll]
    );

    return (
        // span rather than label, for upstream gitlab issue #364
        <span
            {...rest}
            className={wrapper}
            style={style}
            role={role}
            onClick={(e) => {
                onClick?.(e);
                if (CheckboxFoundation.isInnerInteractiveClick(e.target as Element, e.currentTarget, inputRef.current)) {
                    return;
                }
                foundation.handleChange(e);
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <CheckboxInner
                ref={inputRef}
                id={id}
                name={name}
                aria-describedby={ariaDescribedby}
                aria-errormessage={ariaErrormessage}
                aria-invalid={ariaInvalid}
                aria-label={ariaLabel}
                aria-labelledby={joinIds(ariaLabelledby, hasChildren ? addonId : undefined)}
                aria-required={ariaRequired}
                autoFocus={autoFocus}
                tabIndex={tabIndex}
                checked={checked}
                disabled={disabled}
                value={value === undefined ? undefined : String(value)}
                extraId={hasExtra ? extraId : undefined}
                indeterminate={indeterminate}
                isPureCardType={isPureCardType}
                prefixCls={prefixCls}
            />
            {(hasChildren || hasExtra) && (
                <div className={`${prefix}-content`}>
                    {hasChildren && (
                        <span id={addonId} className={`${prefix}-addon`} x-semi-prop={childrenAlias || 'children'}>
                            {children}
                        </span>
                    )}
                    {hasExtra && (
                        <div id={extraId} className={extraCls} x-semi-prop="extra">
                            {extra}
                        </div>
                    )}
                </div>
            )}
        </span>
    );
}
