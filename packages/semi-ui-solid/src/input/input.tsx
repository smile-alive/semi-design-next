import { type JSX, type Ref, Show, children, createRenderEffect, createUniqueId, mergeProps, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/input/constants';
import InputFoundation, { type InputAdapter } from '@fibrae/semi-foundation/input/foundation';
import { stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/input/input.scss';
import { IconClear, IconEyeClosedSolid, IconEyeOpened } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import { createIconSlot } from '../_base/icon-slot';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import { usePopupLayer } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useLocale from '../locale/use-locale';
import { useSpecialTrigger } from '../tooltip/context';
import { useInputGroupContext } from './context';
import useControlledInput from './use-controlled-input';

// Solid types `attr:` only for the names a project declares; the input writes `value` as an attribute below
declare module 'solid-js' {
    namespace JSX {
        interface ExplicitAttributes {
            value: string;
        }
    }
}

const prefixCls = cssClasses.PREFIX;

export type InputSize = Size;
export type InputMode = 'password';
// Form passes 'success' as validateStatus, though Input styles nothing for it
export type ValidateStatus = 'default' | 'error' | 'warning' | 'success';

/** A native event on the input, typed as Solid hands it to a handler */
export type InputElementEvent<E extends Event> = E & { currentTarget: HTMLInputElement; target: Element };

/** What `onChange` receives: typing, an IME composition ending, or the clear button */
export type InputChangeEvent = InputElementEvent<InputEvent> | InputElementEvent<CompositionEvent> | MouseEvent;

export interface InputProps extends ElementProps<'input', 'onChange' | 'prefix' | 'placeholder' | 'onFocus' | 'onBlur' | 'ref'> {
    addonBefore?: JSX.Element;
    addonAfter?: JSX.Element;
    borderless?: boolean;
    prefix?: JSX.Element;
    suffix?: JSX.Element;
    mode?: InputMode;
    value?: string | number;
    defaultValue?: string | number;
    /** An InputGroup's `disabled` applies when this is not set */
    disabled?: boolean;
    /** Locks typing and hides the clear button; the native `readOnly` locks typing only */
    readonly?: boolean;
    type?: string;
    showClear?: boolean;
    hideSuffix?: boolean;
    placeholder?: string | number;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    /** An enclosing InputGroup's size applies when this is not set */
    size?: InputSize;
    clearIcon?: JSX.Element;
    validateStatus?: ValidateStatus;
    onClear?: (e: MouseEvent) => void;
    onChange?: (value: string, e: InputChangeEvent) => void;
    /** Listens on the wrapper: focus moving among the input and its buttons does not fire it */
    onBlur?: (e: FocusEvent) => void;
    /** Listens on the wrapper: focus moving among the input and its buttons does not fire it */
    onFocus?: (e: FocusEvent) => void;
    onEnterPress?: (e: InputElementEvent<KeyboardEvent>) => void;
    inputStyle?: JSX.CSSProperties | string;
    getValueLength?: (value: string) => number;
    maxLength?: number;
    minLength?: number;
    preventScroll?: boolean;
    /** internal prop, DatePicker use it */
    showClearIgnoreDisabled?: boolean;
    /** The wrapper's border width in px */
    onlyBorder?: number;
    /** When enabled, onChange fires once after an IME composition ends, not during it */
    composition?: boolean;
    /** The wrapper div; other attributes go to the native input, `class` and `style` to the wrapper */
    ref?: Ref<HTMLDivElement>;
    /** The native input */
    inputRef?: (element: HTMLInputElement) => void;
}

export interface InputState {
    value?: string | number;
    cachedValue?: string | number;
    isFocus: boolean;
    eyeClosed: boolean;
}

type Foundation = InputFoundation<InputProps, InputState, InputElementEvent<KeyboardEvent>, InputElementEvent<CompositionEvent>, InputElementEvent<InputEvent>>;
type Adapter = InputAdapter<InputProps, InputState, InputElementEvent<KeyboardEvent>, InputElementEvent<CompositionEvent>, InputElementEvent<InputEvent>>;

// size and disabled are left out: they resolve through an enclosing InputGroup
const defaultProps = {
    readonly: false,
    type: 'text',
    showClear: false,
    hideSuffix: false,
    validateStatus: 'default',
    borderless: false,
    composition: false,
} satisfies Partial<InputProps>;

export default function Input(rawProps: InputProps) {
    const defaulted = useDefaultProps('Input', rawProps, defaultProps);

    const group = useInputGroupContext();
    const layer = usePopupLayer();
    const locale = useLocale('Input');

    const generatedId = createUniqueId();
    let input: HTMLInputElement | undefined;
    let clearButton: HTMLButtonElement | undefined;

    const inGroup = group?.layer === layer ? group : undefined;

    // read from rawProps: the defaulted ones already hold the global value, which would hide the group's
    const props = mergeProps(defaulted, {
        get size() {
            return rawProps.size ?? inGroup?.view().size ?? defaulted.size ?? 'default';
        },
        get disabled() {
            return rawProps.disabled ?? inGroup?.view().disabled ?? defaulted.disabled ?? false;
        },
    });

    const [local, rest] = splitProps(props, [
        'addonAfter',
        'addonBefore',
        // focused by the foundation with preventScroll; the native attribute would also focus it in a popover
        'autofocus',
        'borderless',
        'class',
        'clearIcon',
        'composition',
        'defaultValue',
        'disabled',
        'getValueLength',
        'hideSuffix',
        'inputRef',
        'inputStyle',
        'insetLabel',
        'insetLabelId',
        'maxLength',
        'minLength',
        'mode',
        'onBlur',
        'onChange',
        'onClear',
        'onCompositionEnd',
        'onCompositionStart',
        'onCompositionUpdate',
        'onEnterPress',
        'onFocus',
        'onInput',
        'onKeyDown',
        'onKeyUp',
        'onlyBorder',
        'placeholder',
        'prefix',
        'preventScroll',
        'readOnly',
        'readonly',
        'ref',
        'showClear',
        'showClearIgnoreDisabled',
        'size',
        'style',
        'suffix',
        'type',
        'validateStatus',
        'value',
    ]);

    const prefix = createIconSlot(() => local.prefix);
    const suffix = createIconSlot(() => local.suffix);
    const insetLabel = createIconSlot(() => local.insetLabel);
    const addonBefore = createIconSlot(() => local.addonBefore);
    const addonAfter = createIconSlot(() => local.addonAfter);
    const clearIcon = children(() => local.clearIcon);
    const wrapper = `${prefixCls}-wrapper`;

    const focusInput = () => input?.focus({ preventScroll: props.preventScroll });

    const { foundation, state } = useFoundation<Foundation, Adapter, InputProps, InputState>(
        InputFoundation,
        props,
        (view) => ({
            value: view.value === undefined ? view.defaultValue : view.value,
            cachedValue: view.value,
            isFocus: false,
            eyeClosed: view.mode === 'password',
        }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            setEyeClosed: (eyeClosed) => base.setState({ eyeClosed }),
            toggleFocusing: (isFocus) => base.setState({ isFocus }),
            focusInput,
            notifyChange: (value, e: InputChangeEvent) => props.onChange?.(value, e),
            notifyBlur: (_, e: FocusEvent) => props.onBlur?.(e),
            notifyFocus: (_, e: FocusEvent) => props.onFocus?.(e),
            // Solid's input handler type narrows `target` to the input itself, which this event's target is
            notifyInput: (e) => callHandler(props.onInput as JSX.EventHandlerUnion<HTMLInputElement, InputEvent>, e),
            notifyKeyDown: (e) => callHandler(props.onKeyDown, e),
            notifyKeyUp: (e) => callHandler(props.onKeyUp, e),
            notifyEnterPress: (e) => props.onEnterPress?.(e),
            notifyClear: (e: MouseEvent) => props.onClear?.(e),
            notifyCompositionStart: (e) => callHandler(props.onCompositionStart, e),
            notifyCompositionEnd: (e) => callHandler(props.onCompositionEnd, e),
            notifyCompositionUpdate: (e) => callHandler(props.onCompositionUpdate, e),
            isEventTarget: (e) => e.target === e.currentTarget,
        })
    );

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    // focus on a removed node falls to the body while the Input stays focused, so it goes to the input instead
    const handover = useFocusHandover<HTMLButtonElement>(() => input);

    const value = () => InputFoundation.deriveValue(local, state());

    const allowClear = () => InputFoundation.isAllowClear(local, value());

    const controlled = useControlledInput({ element: () => input, text: () => String(value() ?? ''), foundation, state, allowClear, clearButton: () => clearButton });

    const prefixKind = () => prefix.kind();

    const insetLabelKind = () => insetLabel.kind();

    const suffixKind = () => suffix.kind();

    const beforeKind = () => addonBefore.kind();

    const afterKind = () => addonAfter.kind();

    const labelKind = () => prefixKind() ?? insetLabelKind();

    const insetLabelShown = () => Boolean(insetLabelKind()) && !prefixKind();

    const labelId = () => local.insetLabelId ?? (insetLabelShown() ? `${generatedId}-inset-label` : undefined);

    const wrapperStyle = (): JSX.CSSProperties | string | undefined => {
        if (local.onlyBorder === undefined) {
            return local.style;
        }
        return mergeStyles({ 'border-width': `${local.onlyBorder}px` }, local.style);
    };

    const handleInput = (e: InputElementEvent<InputEvent>) => {
        foundation.handleInput(e);
        controlled.handleInput(e);
    };

    // the primary button clears on mousedown (issue 1203) without moving focus; the others only keep focus in place
    const handleClearMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        if (e.button === 0) {
            foundation.handleClear(e);
        }
    };

    // Enter and Space fire a click with detail 0; focus returns to the input as the button unmounts
    const handleClearClick = (e: MouseEvent) => {
        if (e.detail === 0) {
            foundation.handleClear(e);
            focusInput();
        }
    };

    const preventMouseDown = (e: MouseEvent) => e.preventDefault();

    const focusOptions = () => ({ preventScroll: props.preventScroll });

    const setRoot = (node: HTMLDivElement) => {
        forwardFocus(node, () => input, focusOptions);
        registerTrigger(node);
    };

    const setInput = (node: HTMLInputElement) => {
        input = node;
        node.value = String(value() ?? '');
    };

    const setClearButton = (node: HTMLButtonElement) => {
        clearButton = node;
        handover(node);
    };

    createRenderEffect(controlled.syncValue);

    // undefined (a form reset) empties the input
    useWatch(
        () => local.value,
        (next) => foundation.handleValueChange(next as string | number)
    );

    useWatch(
        () => local.mode,
        (next) => foundation.handleModeChange(next as string)
    );

    return (
        <div
            ref={mergeRefs(setRoot, local.ref)}
            class={clsx(wrapper, local.class, {
                [`${wrapper}__with-prefix`]: Boolean(labelKind()),
                [`${wrapper}__with-suffix`]: Boolean(suffixKind()),
                [`${wrapper}__with-suffix-hidden`]: allowClear() && Boolean(local.hideSuffix),
                [`${wrapper}__with-suffix-icon`]: suffixKind() === 'icon',
                [`${wrapper}__with-append`]: Boolean(beforeKind()),
                [`${wrapper}__with-prepend`]: Boolean(afterKind()),
                [`${wrapper}__with-append-only`]: Boolean(beforeKind()) && !afterKind(),
                [`${wrapper}__with-prepend-only`]: !beforeKind() && Boolean(afterKind()),
                [`${wrapper}-readonly`]: local.readonly,
                [`${wrapper}-disabled`]: local.disabled,
                [`${wrapper}-warning`]: local.validateStatus === 'warning',
                [`${wrapper}-error`]: local.validateStatus === 'error',
                [`${wrapper}-focus`]: state().isFocus,
                [`${wrapper}-clearable`]: local.showClear,
                [`${wrapper}-modebtn`]: local.mode === 'password',
                [`${wrapper}-hidden`]: local.type === 'hidden',
                [`${wrapper}-${local.size}`]: Boolean(local.size),
                [`${prefixCls}-borderless`]: local.borderless,
                [`${prefixCls}-only_border`]: local.onlyBorder != null,
            })}
            style={wrapperStyle()}
            onClick={foundation.handleClick}
            onFocusIn={controlled.handleFocusIn}
            onFocusOut={controlled.handleFocusOut}
        >
            <Show when={beforeKind()}>
                <div
                    class={clsx(`${prefixCls}-prepend`, {
                        [`${prefixCls}-prepend-text`]: beforeKind() === 'text',
                        [`${prefixCls}-prepend-icon`]: beforeKind() === 'icon',
                    })}
                    x-semi-prop="addonBefore"
                >
                    {addonBefore()}
                </div>
            </Show>
            <Show when={labelKind()}>
                <div
                    id={labelId()}
                    class={clsx(`${prefixCls}-prefix`, {
                        [`${prefixCls}-inset-label`]: Boolean(insetLabelKind()),
                        [`${prefixCls}-prefix-text`]: labelKind() === 'text',
                        [`${prefixCls}-prefix-icon`]: labelKind() === 'icon',
                    })}
                    x-semi-prop="prefix,insetLabel"
                    onClick={foundation.handleClickPrefixOrSuffix}
                    onMouseDown={preventMouseDown}
                >
                    {prefixKind() ? prefix() : insetLabel()}
                </div>
            </Show>
            <input
                {...rest}
                ref={mergeRefs(setInput, local.inputRef)}
                type={InputFoundation.getInputType(local.type, local.mode, state().eyeClosed)}
                class={clsx(prefixCls, {
                    [`${prefixCls}-${local.size}`]: Boolean(local.size),
                    [`${prefixCls}-disabled`]: local.disabled,
                    [`${prefixCls}-sibling-clearbtn`]: allowClear(),
                    [`${prefixCls}-sibling-modebtn`]: local.mode === 'password',
                })}
                style={local.inputStyle}
                aria-invalid={local.validateStatus === 'error' ? 'true' : rest['aria-invalid']}
                aria-labelledby={rest['aria-labelledby'] ?? (insetLabelShown() && !rest['aria-label'] ? labelId() : undefined)}
                disabled={local.disabled}
                // the native maxLength counts UTF-16 units, so getValueLength enforces the limit instead
                maxLength={typeof local.getValueLength === 'function' ? undefined : local.maxLength}
                minLength={InputFoundation.getNativeMinLength(local, value())}
                placeholder={local.placeholder == null ? undefined : String(local.placeholder)}
                // The attribute carries the text into the server HTML. What the browser shows is the property, written
                // in the ref and by syncValue: a value binding would also write it during an IME composition
                attr:value={String(value() ?? '')}
                // the native attribute locks typing only; `readonly` also blocks clearing (pickers rely on it). The
                // lowercase name is the boolean attribute, which the server omits when false
                readonly={local.readonly || local.readOnly}
                onCompositionEnd={controlled.handleCompositionEnd}
                onCompositionStart={foundation.handleCompositionStart}
                onCompositionUpdate={foundation.handleCompositionUpdate}
                onInput={handleInput}
                onKeyDown={foundation.handleKeyDown}
                onKeyUp={foundation.handleKeyUp}
            />
            <Show when={allowClear()}>
                <button ref={setClearButton} type="button" class={`${prefixCls}-clearbtn`} aria-label={locale().locale.clear} onClick={handleClearClick} onKeyDown={stopButtonActivationKeys} onMouseDown={handleClearMouseDown}>
                    <Show when={clearIcon()} fallback={<IconClear />}>
                        {clearIcon()}
                    </Show>
                </button>
            </Show>
            <Show when={suffixKind()}>
                <div
                    class={clsx(`${prefixCls}-suffix`, {
                        [`${prefixCls}-suffix-text`]: suffixKind() === 'text',
                        [`${prefixCls}-suffix-icon`]: suffixKind() === 'icon',
                        [`${prefixCls}-suffix-hidden`]: allowClear() && Boolean(local.hideSuffix),
                    })}
                    x-semi-prop="suffix"
                    onClick={foundation.handleClickPrefixOrSuffix}
                    onMouseDown={preventMouseDown}
                >
                    {suffix()}
                </div>
            </Show>
            <Show when={local.mode === 'password' && !local.disabled}>
                <button type="button" class={`${prefixCls}-modebtn`} aria-label={state().eyeClosed ? locale().locale.showPassword : locale().locale.hidePassword} onClick={foundation.handleClickEye} onKeyDown={stopButtonActivationKeys} onMouseDown={preventMouseDown}>
                    <Show when={state().eyeClosed} fallback={<IconEyeOpened />}>
                        <IconEyeClosedSolid />
                    </Show>
                </button>
            </Show>
            <Show when={afterKind()}>
                <div
                    class={clsx(`${prefixCls}-append`, {
                        [`${prefixCls}-append-text`]: afterKind() === 'text',
                        [`${prefixCls}-append-icon`]: afterKind() === 'icon',
                    })}
                    x-semi-prop="addonAfter"
                >
                    {addonAfter()}
                </div>
            </Show>
        </div>
    );
}
