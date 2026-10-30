import type React from 'react';
import { useCallback, useImperativeHandle, useState } from 'react';
import clsx from 'clsx';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/input-number/constants';
import InputNumberFoundation, { reachesBound, type BaseInputNumberState, type InputNumberAdapter, type ScientificNotationConfig } from '@fibrae/semi-foundation/input-number/foundation';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/input-number/input-number.scss';
import { IconChevronUp, IconChevronDown } from '@fibrae/semi-icons-react';
import type { ArrayElement } from '../_base/base';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import Input, { type InputProps, type InputHandle, type InputChangeEvent } from '../input';
import { InputGroupContext, useInputGroupInScope, withInputGroup } from '../input/context';
import useLocale from '../locale/use-locale';

export type { ScientificNotationConfig };

/** What changed the value: typing, a step button or key, or the blur that reformats the text */
export type InputNumberChangeEvent = InputChangeEvent | React.PointerEvent<HTMLSpanElement> | React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLDivElement>;

/** The methods and nodes on an InputNumber ref */
export interface InputNumberHandle {
    /** Focuses the native input; `preventScroll` defaults to the prop */
    focus(options?: FocusOptions): void;
    blur(): void;
    select(): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
    /** The native input */
    readonly input: HTMLInputElement | null;
    /** The root element, the number wrapper div */
    readonly nativeElement: HTMLElement | null;
}

export interface InputNumberProps extends Omit<InputProps, 'ref'> {
    autofocus?: boolean;
    className?: string;
    clearIcon?: React.ReactNode;
    currency?: string | boolean;
    currencyDisplay?: 'code' | 'symbol' | 'name';
    defaultValue?: number | string;
    defaultCurrency?: string;
    disabled?: boolean;
    formatter?: (value: number | string) => string;
    hideButtons?: boolean;
    innerButtons?: boolean;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    keepFocus?: boolean;
    localeCode?: string;
    max?: number;
    min?: number;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    parser?: (value: string) => string;
    precision?: number;
    prefixCls?: string;
    pressInterval?: number;
    pressTimeout?: number;
    shiftStep?: number;
    showClear?: boolean;
    showCurrencySymbol?: boolean;
    size?: ArrayElement<typeof strings.SIZE>;
    step?: number;
    style?: React.CSSProperties;
    suffix?: React.ReactNode;
    value?: number | string;
    /** Shows long numbers in scientific notation, the full number when focused */
    scientificNotation?: boolean | ScientificNotationConfig;
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
    onChange?: (value: number | string, e: InputNumberChangeEvent) => void;
    /** While a button is held, `e` stays the pointerdown that began the press for every repeat */
    onDownClick?: (value: string, e: React.PointerEvent<HTMLSpanElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onNumberChange?: (value: number, e: InputNumberChangeEvent) => void;
    /** While a button is held, `e` stays the pointerdown that began the press for every repeat */
    onUpClick?: (value: string, e: React.PointerEvent<HTMLSpanElement>) => void;
    /** Other HTML attributes go to the native input, className and style to the wrapper */
    ref?: React.Ref<InputNumberHandle>;
}

export interface InputNumberState extends BaseInputNumberState {}

const defaultProps = {
    innerButtons: false,
    keepFocus: false,
    max: Infinity,
    min: -Infinity,
    prefixCls: cssClasses.PREFIX,
    pressInterval: numbers.DEFAULT_PRESS_TIMEOUT,
    pressTimeout: numbers.DEFAULT_PRESS_TIMEOUT,
    shiftStep: numbers.DEFAULT_SHIFT_STEP,
    showCurrencySymbol: true,
    size: strings.DEFAULT_SIZE,
    step: numbers.DEFAULT_STEP,
    onBlur: noop,
    onChange: noop,
    onDownClick: noop,
    onFocus: noop,
    onKeyDown: noop,
    onNumberChange: noop,
    onUpClick: noop,
} satisfies Partial<InputNumberProps>;

// the adapter is created during render and so must not read a ref
class InputNumberRuntime {
    input: HTMLInputElement | null = null;
    root: HTMLDivElement | null = null;

    // Input's native input never remounts, so the node read from the handle once stays current
    attachInput(handle: InputHandle | null) {
        this.input = handle?.input ?? null;
    }

    attachRoot(node: HTMLDivElement | null) {
        this.root = node;
    }
}

type Foundation = InputNumberFoundation<InputNumberProps, InputNumberState, React.FocusEvent<HTMLDivElement>, React.KeyboardEvent<HTMLInputElement>>;

// outside the component: the Compiler cannot lower getters in an object literal
function createHandle(runtime: InputNumberRuntime, foundation: Foundation): InputNumberHandle {
    return {
        focus: (options) => runtime.input?.focus({ preventScroll: foundation.getProps().preventScroll, ...options }),
        blur: () => runtime.input?.blur(),
        select: () => runtime.input?.select(),
        setSelectionRange: (start, end, direction) => runtime.input?.setSelectionRange(start, end, direction),
        get input() {
            return runtime.input;
        },
        get nativeElement() {
            return runtime.root;
        },
    };
}

export default function InputNumber(rawProps: InputNumberProps) {
    const { localeCode, currency } = useLocale('InputNumber');

    const props = useDefaultProps('InputNumber', withInputGroup(rawProps, useInputGroupInScope()), { ...defaultProps, localeCode, defaultCurrency: currency });

    const {
        ref,
        disabled,
        className,
        prefixCls,
        min,
        max,
        step,
        shiftStep,
        precision,
        formatter,
        parser,
        onUpClick,
        onDownClick,
        pressInterval,
        pressTimeout,
        showClear,
        prefix,
        suffix,
        insetLabel,
        addonBefore,
        addonAfter,
        size,
        hideButtons,
        innerButtons,
        style,
        onNumberChange,
        keepFocus,
        defaultValue,
        defaultCurrency,
        currency: currencyProp,
        currencyDisplay,
        minimumFractionDigits,
        maximumFractionDigits,
        showCurrencySymbol,
        localeCode: localeCodeProp,
        scientificNotation,
        ...rest
    } = props;

    const [runtime] = useState(() => new InputNumberRuntime());

    const [foundation, state] = useFoundation<Foundation, InputNumberAdapter<InputNumberProps, InputNumberState, React.FocusEvent<HTMLDivElement>, React.KeyboardEvent<HTMLInputElement>>, InputNumberProps, InputNumberState>(
        InputNumberFoundation,
        props,
        () => InputNumberFoundation.getInitialState(props),
        (base) => {
            return {
                setValue: (value, cb) => base.setState({ value }, cb),
                setNumber: (number, cb) => base.setState({ number }, cb),
                setFocusing: (focusing, cb) => base.setState({ focusing }, cb),
                setHovering: (hovering) => base.setState({ hovering }),
                notifyChange: (value, e) => base.getProps().onChange(value, e),
                notifyNumberChange: (value, e) => base.getProps().onNumberChange(value, e),
                notifyBlur: (e) => base.getProps().onBlur(e),
                notifyFocus: (e) => base.getProps().onFocus(e),
                notifyUpClick: (value, e) => base.getProps().onUpClick(value, e),
                notifyDownClick: (value, e) => base.getProps().onDownClick(value, e),
                notifyKeyDown: (e) => base.getProps().onKeyDown(e),
                getInput: () => runtime.input,
            };
        }
    );

    const { value, number, hovering, focusing } = state;
    const notAllowedUp = disabled ? disabled : reachesBound(number, max, 1);
    const notAllowedDown = disabled ? disabled : reachesBound(number, min, -1);

    const buttons = (
        <div
            className={clsx(`${prefixCls}-number-suffix-btns`, {
                [`${prefixCls}-number-suffix-btns-inner`]: innerButtons,
                [`${prefixCls}-number-suffix-btns-inner-hover`]: innerButtons && hovering && !focusing,
            })}
        >
            <span
                className={clsx(`${prefixCls}-number-button`, `${prefixCls}-number-button-up`, {
                    [`${prefixCls}-number-button-up-disabled`]: disabled,
                    [`${prefixCls}-number-button-up-not-allowed`]: notAllowedUp,
                })}
                onLostPointerCapture={foundation.handlePressEnd}
                onMouseDown={foundation.handleStepMouseDown}
                onPointerDown={foundation.handleUpPress}
            >
                <IconChevronUp size="extra-small" />
            </span>
            <span
                className={clsx(`${prefixCls}-number-button`, `${prefixCls}-number-button-down`, {
                    [`${prefixCls}-number-button-down-disabled`]: disabled,
                    [`${prefixCls}-number-button-down-not-allowed`]: notAllowedDown,
                })}
                onLostPointerCapture={foundation.handlePressEnd}
                onMouseDown={foundation.handleStepMouseDown}
                onPointerDown={foundation.handleDownPress}
            >
                <IconChevronDown size="extra-small" />
            </span>
        </div>
    );

    const ariaProps: Record<string, unknown> = { 'aria-disabled': disabled, 'aria-valuenow': InputNumberFoundation.getAriaValueNow(number), step };

    const setInput = useCallback((handle: InputHandle | null) => runtime.attachInput(handle), [runtime]);

    const setRoot = useCallback((node: HTMLDivElement | null) => runtime.attachRoot(node), [runtime]);

    useDidUpdate(props.value, foundation.handleValueChange);

    useImperativeHandle(props.ref, () => createHandle(runtime, foundation), [foundation, runtime]);

    if (max !== Infinity) {
        ariaProps['aria-valuemax'] = max;
    }

    if (min !== -Infinity) {
        ariaProps['aria-valuemin'] = min;
    }

    // the group is read above; the inner Input and the adornment slots must not read it again
    return (
        <InputGroupContext value={undefined}>
            <div ref={setRoot} className={clsx(className, `${prefixCls}-number`, { [`${prefixCls}-number-size-${size}`]: size })} style={style} onMouseEnter={foundation.handleInputMouseEnter} onMouseLeave={foundation.handleInputMouseLeave} onMouseMove={foundation.handleInputMouseMove}>
                <Input
                    role="spinbutton"
                    {...ariaProps}
                    {...rest}
                    ref={setInput}
                    disabled={disabled}
                    value={value}
                    // InputNumber's own global defaults apply to the adornments and showClear; the global Input ones must not
                    addonAfter={addonAfter ?? null}
                    addonBefore={addonBefore ?? null}
                    insetLabel={insetLabel ?? null}
                    showClear={showClear ?? false}
                    size={size}
                    prefix={prefix ?? null}
                    suffix={innerButtons && !hideButtons && (hovering || focusing) ? buttons : (suffix ?? null)}
                    onBlur={foundation.handleInputBlur}
                    onChange={foundation.handleInputChange}
                    onFocus={foundation.handleInputFocus}
                    onKeyDown={foundation.handleInputKeyDown}
                />
                {!(hideButtons || innerButtons) && buttons}
            </div>
        </InputGroupContext>
    );
}
