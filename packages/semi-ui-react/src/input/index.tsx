import type React from 'react';
import { useCallback, useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/input/constants';
import InputFoundation, { type InputAdapter } from '@fibrae/semi-foundation/input/foundation';
import { stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/input/input.scss';
import { IconClear, IconEyeOpened, IconEyeClosedSolid } from '@fibrae/semi-icons-react';
import type { ValidateStatus } from '../_base/base-component';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { hasContent, isSemiIcon, isText } from '../_utils';
import useLocale from '../locale/use-locale';
import { useInputGroupInScope, withInputGroup } from './context';

const prefixCls = cssClasses.PREFIX;

export type { InputGroupProps } from './input-group';
export type { TextAreaProps, TextAreaHandle } from './textarea';
export type InputSize = Size;
export type InputMode = 'password';
// Form passes 'success' as validateStatus, though Input styles nothing for it
export type { ValidateStatus };

/** The methods and nodes on an Input ref */
export interface InputHandle {
    /** Focuses the native input; `preventScroll` defaults to the prop */
    focus(options?: FocusOptions): void;
    blur(): void;
    select(): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
    /** The native input */
    readonly input: HTMLInputElement | null;
    /** The root element, the wrapper div */
    readonly nativeElement: HTMLElement | null;
}

/** What `onChange` receives: typing, an IME composition ending, or the clear button */
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement> | React.CompositionEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>;

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'prefix' | 'size' | 'placeholder' | 'onFocus' | 'onBlur'> {
    'aria-label'?: React.AriaAttributes['aria-label'];
    'aria-describedby'?: React.AriaAttributes['aria-describedby'];
    'aria-errormessage'?: React.AriaAttributes['aria-errormessage'];
    'aria-invalid'?: React.AriaAttributes['aria-invalid'];
    'aria-labelledby'?: React.AriaAttributes['aria-labelledby'];
    'aria-required'?: React.AriaAttributes['aria-required'];
    addonBefore?: React.ReactNode;
    addonAfter?: React.ReactNode;
    borderless?: boolean;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    mode?: InputMode;
    value?: string | number;
    defaultValue?: string | number;
    disabled?: boolean;
    readonly?: boolean;
    type?: string;
    showClear?: boolean;
    hideSuffix?: boolean;
    placeholder?: string | number;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    size?: InputSize;
    className?: string;
    clearIcon?: React.ReactNode;
    style?: React.CSSProperties;
    validateStatus?: ValidateStatus;
    onClear?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onChange?: (value: string, e: InputChangeEvent) => void;
    /** Listens on the wrapper: focus moving among the input and its buttons does not fire it */
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
    onInput?: (e: React.InputEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onEnterPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputStyle?: React.CSSProperties;
    getValueLength?: (value: string) => number;
    preventScroll?: boolean;
    /** internal prop, DatePicker use it */
    showClearIgnoreDisabled?: boolean;
    onlyBorder?: number;
    /** When enabled, onChange fires once after an IME composition ends, not during it */
    composition?: boolean;
    /** Other HTML attributes go to the native input, className and style to the wrapper */
    ref?: React.Ref<InputHandle>;
}

export interface InputState {
    value: string | number;
    cachedValue: string | number;
    isFocus: boolean;
    eyeClosed: boolean;
}

const defaultProps = {
    addonBefore: '',
    addonAfter: '',
    prefix: '',
    suffix: '',
    readonly: false,
    type: 'text',
    showClear: false,
    hideSuffix: false,
    placeholder: '',
    size: 'default',
    className: '',
    onClear: noop,
    onChange: noop,
    onBlur: noop,
    onFocus: noop,
    onInput: noop,
    onKeyDown: noop,
    onKeyUp: noop,
    onEnterPress: noop,
    onCompositionStart: noop,
    onCompositionEnd: noop,
    onCompositionUpdate: noop,
    validateStatus: 'default',
    borderless: false,
    composition: false,
} satisfies Partial<InputProps>;

type Foundation = InputFoundation<InputProps, InputState, React.KeyboardEvent<HTMLInputElement>, React.CompositionEvent<HTMLInputElement>, React.InputEvent<HTMLInputElement>>;

// outside the component: the Compiler cannot lower getters in an object literal
function createHandle(inputRef: React.RefObject<HTMLInputElement | null>, rootRef: React.RefObject<HTMLDivElement | null>, foundation: Foundation): InputHandle {
    return {
        focus: (options) => inputRef.current?.focus({ preventScroll: foundation.getProps().preventScroll, ...options }),
        blur: () => inputRef.current?.blur(),
        select: () => inputRef.current?.select(),
        setSelectionRange: (start, end, direction) => inputRef.current?.setSelectionRange(start, end, direction),
        get input() {
            return inputRef.current;
        },
        get nativeElement() {
            return rootRef.current;
        },
    };
}

export default function Input(rawProps: InputProps) {
    const props = useDefaultProps('Input', withInputGroup(rawProps, useInputGroupInScope()), defaultProps);

    const {
        ref,
        addonAfter,
        addonBefore,
        autoFocus,
        clearIcon,
        className,
        disabled,
        defaultValue,
        value: valueProp,
        placeholder,
        prefix,
        mode,
        insetLabel,
        insetLabelId,
        validateStatus,
        type,
        readonly,
        size,
        suffix,
        style,
        showClear,
        onEnterPress,
        onClear,
        hideSuffix,
        inputStyle,
        maxLength,
        minLength,
        getValueLength,
        preventScroll,
        borderless,
        showClearIgnoreDisabled,
        onlyBorder,
        composition,
        onChange,
        onBlur,
        onFocus,
        onInput,
        onKeyDown,
        onKeyUp,
        onCompositionStart,
        onCompositionEnd,
        onCompositionUpdate,
        ...rest
    } = props;

    const { locale } = useLocale('Input');

    const generatedId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<Foundation, InputAdapter<InputProps, InputState, React.KeyboardEvent<HTMLInputElement>, React.CompositionEvent<HTMLInputElement>, React.InputEvent<HTMLInputElement>>, InputProps, InputState>(
        InputFoundation,
        props,
        () => ({
            value: props.value === undefined ? props.defaultValue : props.value,
            cachedValue: props.value,
            isFocus: false,
            eyeClosed: props.mode === 'password',
        }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            setEyeClosed: (eyeClosed) => base.setState({ eyeClosed }),
            toggleFocusing: (isFocus) => base.setState({ isFocus }),
            focusInput: () => inputRef.current?.focus({ preventScroll: base.getProps().preventScroll }),
            notifyChange: (value, e: InputChangeEvent) => base.getProps().onChange(value, e),
            notifyBlur: (_value, e) => base.getProps().onBlur(e),
            notifyFocus: (_value, e) => base.getProps().onFocus(e),
            notifyInput: (e) => base.getProps().onInput(e),
            notifyKeyDown: (e) => base.getProps().onKeyDown(e),
            notifyKeyUp: (e) => base.getProps().onKeyUp(e),
            notifyEnterPress: (e) => base.getProps().onEnterPress(e),
            notifyClear: (e) => base.getProps().onClear(e),
            notifyCompositionStart: (e) => base.getProps().onCompositionStart(e),
            notifyCompositionEnd: (e) => base.getProps().onCompositionEnd(e),
            notifyCompositionUpdate: (e) => base.getProps().onCompositionUpdate(e),
            isEventTarget: (e) => e && e.target === e.currentTarget,
        })
    );

    const value = InputFoundation.deriveValue(props, state);
    const allowClear = InputFoundation.isAllowClear(props, value);
    const wrapperPrefix = `${prefixCls}-wrapper`;
    const hasBefore = hasContent(addonBefore);
    const hasAfter = hasContent(addonAfter);
    const labelNode = hasContent(prefix) ? prefix : insetLabel;
    const insetLabelShown = hasContent(insetLabel) && !hasContent(prefix);
    const labelId = insetLabelId ?? (insetLabelShown ? `${generatedId}-inset-label` : undefined);

    const wrapperCls = clsx(wrapperPrefix, className, {
        [`${prefixCls}-wrapper__with-prefix`]: hasContent(labelNode),
        [`${prefixCls}-wrapper__with-suffix`]: hasContent(suffix),
        [`${prefixCls}-wrapper__with-suffix-hidden`]: allowClear && Boolean(hideSuffix),
        [`${prefixCls}-wrapper__with-suffix-icon`]: isSemiIcon(suffix),
        [`${prefixCls}-wrapper__with-append`]: hasBefore,
        [`${prefixCls}-wrapper__with-prepend`]: hasAfter,
        [`${prefixCls}-wrapper__with-append-only`]: hasBefore && !hasAfter,
        [`${prefixCls}-wrapper__with-prepend-only`]: !hasBefore && hasAfter,
        [`${wrapperPrefix}-readonly`]: readonly,
        [`${wrapperPrefix}-disabled`]: disabled,
        [`${wrapperPrefix}-warning`]: validateStatus === 'warning',
        [`${wrapperPrefix}-error`]: validateStatus === 'error',
        [`${wrapperPrefix}-focus`]: state.isFocus,
        [`${wrapperPrefix}-clearable`]: showClear,
        [`${wrapperPrefix}-modebtn`]: mode === 'password',
        [`${wrapperPrefix}-hidden`]: type === 'hidden',
        [`${wrapperPrefix}-${size}`]: size,
        [`${prefixCls}-borderless`]: borderless,
        [`${prefixCls}-only_border`]: onlyBorder != null,
    });

    const inputCls = clsx(prefixCls, {
        [`${prefixCls}-${size}`]: size,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-sibling-clearbtn`]: allowClear,
        [`${prefixCls}-sibling-modebtn`]: mode === 'password',
    });

    const wrapperStyle = onlyBorder !== undefined ? { borderWidth: onlyBorder, ...style } : style;

    const prefixNode = hasContent(labelNode) && (
        <div
            id={labelId}
            className={clsx({
                [`${prefixCls}-prefix`]: true,
                [`${prefixCls}-inset-label`]: hasContent(insetLabel),
                [`${prefixCls}-prefix-text`]: isText(labelNode),
                [`${prefixCls}-prefix-icon`]: isSemiIcon(labelNode),
            })}
            x-semi-prop="prefix,insetLabel"
            onClick={foundation.handleClickPrefixOrSuffix}
            onMouseDown={(e) => e.preventDefault()}
        >
            {labelNode}
        </div>
    );

    const suffixNode = hasContent(suffix) && (
        <div
            className={clsx({
                [`${prefixCls}-suffix`]: true,
                [`${prefixCls}-suffix-text`]: isText(suffix),
                [`${prefixCls}-suffix-icon`]: isSemiIcon(suffix),
                [`${prefixCls}-suffix-hidden`]: allowClear && Boolean(hideSuffix),
            })}
            x-semi-prop="suffix"
            onClick={foundation.handleClickPrefixOrSuffix}
            onMouseDown={(e) => e.preventDefault()}
        >
            {suffix}
        </div>
    );

    const modeNode =
        mode === 'password' && !disabled ? (
            <button type="button" className={`${prefixCls}-modebtn`} aria-label={state.eyeClosed ? locale.showPassword : locale.hidePassword} onClick={foundation.handleClickEye} onKeyDown={stopButtonActivationKeys} onMouseDown={(e) => e.preventDefault()}>
                {state.eyeClosed ? <IconEyeClosedSolid /> : <IconEyeOpened />}
            </button>
        ) : null;

    // a removed node fires no blur: without this the focus would fall to the body while the Input stays focused
    const setClearButton = useCallback(
        (node: HTMLButtonElement) => () => {
            if (node === FocusTrapHandle.getActiveElement(node)) {
                inputRef.current?.focus({ preventScroll: foundation.getProps().preventScroll });
            }
        },
        [foundation]
    );

    useDidUpdate(props.value, foundation.handleValueChange);
    useDidUpdate(props.mode, foundation.handleModeChange);

    useImperativeHandle(props.ref, () => createHandle(inputRef, rootRef, foundation), [foundation]);

    return (
        <div
            ref={rootRef}
            className={wrapperCls}
            style={wrapperStyle}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    foundation.handleBlur(e);
                }
            }}
            onClick={foundation.handleClick}
            onFocus={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    foundation.handleFocus(e);
                }
            }}
        >
            {hasBefore && (
                <div
                    className={clsx(`${prefixCls}-prepend`, {
                        [`${prefixCls}-prepend-text`]: isText(addonBefore),
                        [`${prefixCls}-prepend-icon`]: isSemiIcon(addonBefore),
                    })}
                    x-semi-prop="addonBefore"
                >
                    {addonBefore}
                </div>
            )}
            {prefixNode}
            <input
                {...rest}
                ref={inputRef}
                type={InputFoundation.getInputType(type, mode, state.eyeClosed)}
                className={inputCls}
                style={inputStyle}
                aria-invalid={validateStatus === 'error' ? 'true' : rest['aria-invalid']}
                aria-labelledby={rest['aria-labelledby'] ?? (insetLabelShown && !rest['aria-label'] ? labelId : undefined)}
                disabled={disabled}
                // the native maxLength counts UTF-16 units, so getValueLength enforces the limit instead
                maxLength={typeof getValueLength === 'function' ? undefined : maxLength}
                minLength={InputFoundation.getNativeMinLength(props, value)}
                placeholder={placeholder as string}
                // the native attribute locks typing only; `readonly` also blocks clearing (pickers rely on it)
                readOnly={readonly || rest.readOnly}
                value={value ?? ''}
                onChange={(e) => foundation.handleChange(e.target.value, e)}
                onCompositionEnd={foundation.handleCompositionEnd}
                onCompositionStart={foundation.handleCompositionStart}
                onCompositionUpdate={foundation.handleCompositionUpdate}
                onInput={foundation.handleInput}
                onKeyDown={foundation.handleKeyDown}
                onKeyUp={foundation.handleKeyUp}
            />
            {allowClear && (
                <button
                    ref={setClearButton}
                    type="button"
                    className={`${prefixCls}-clearbtn`}
                    aria-label={locale.clear}
                    // Enter and Space fire a click with detail 0; focus returns to the input as the button unmounts
                    onClick={(e) => {
                        if (e.detail === 0) {
                            foundation.handleClear(e);
                            inputRef.current?.focus({ preventScroll });
                        }
                    }}
                    onKeyDown={stopButtonActivationKeys}
                    // the primary button clears on mousedown (issue 1203) without moving focus
                    onMouseDown={(e) => {
                        e.preventDefault();
                        if (e.button === 0) {
                            foundation.handleClear(e);
                        }
                    }}
                >
                    {clearIcon ? clearIcon : <IconClear />}
                </button>
            )}
            {suffixNode}
            {modeNode}
            {hasAfter && (
                <div
                    className={clsx(`${prefixCls}-append`, {
                        [`${prefixCls}-append-text`]: isText(addonAfter),
                        [`${prefixCls}-append-icon`]: isSemiIcon(addonAfter),
                    })}
                    x-semi-prop="addonAfter"
                >
                    {addonAfter}
                </div>
            )}
        </div>
    );
}
