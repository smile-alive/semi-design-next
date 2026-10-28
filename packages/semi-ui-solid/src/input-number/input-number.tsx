import { type JSX, type Ref, Show, createMemo, mergeProps, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/input-number/constants';
import InputNumberFoundation, { reachesBound, type BaseInputNumberState, type InputNumberAdapter, type ScientificNotationConfig } from '@fibrae/semi-foundation/input-number/foundation';
import '@fibrae/semi-foundation/input-number/input-number.scss';
import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import forwardFocus from '../_base/forward-focus';
import mergeRefs from '../_base/merge-refs';
import { usePopupLayer } from '../_base/popup-layer';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import Input, { type InputChangeEvent, type InputElementEvent, type InputProps } from '../input';
import { useInputGroupContext } from '../input/context';
import useLocale from '../locale/use-locale';
import { useSpecialTrigger } from '../tooltip/context';

export type { ScientificNotationConfig };

/** What changed the value: typing, a step button or key, or the blur that reformats the text */
export type InputNumberChangeEvent = InputChangeEvent | PointerEvent | InputElementEvent<KeyboardEvent> | FocusEvent;

/** `class`, `style` and `ref` go to the root; other attributes go to the native input */
export interface InputNumberProps extends Omit<InputProps, 'ref' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown'> {
    currency?: string | boolean;
    currencyDisplay?: 'code' | 'symbol' | 'name';
    defaultValue?: number | string;
    defaultCurrency?: string;
    formatter?: (value: number | string) => string;
    hideButtons?: boolean;
    innerButtons?: boolean;
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
    showCurrencySymbol?: boolean;
    step?: number;
    value?: number | string;
    /** Shows long numbers in scientific notation, the full number when focused */
    scientificNotation?: boolean | ScientificNotationConfig;
    onBlur?: (e: FocusEvent) => void;
    onChange?: (value: number | string, e: InputNumberChangeEvent) => void;
    /** While a button is held, `e` stays the pointerdown that began the press for every repeat */
    onDownClick?: (value: string, e: PointerEvent) => void;
    onFocus?: (e: FocusEvent) => void;
    onKeyDown?: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent>;
    onNumberChange?: (value: number, e: InputNumberChangeEvent) => void;
    /** While a button is held, `e` stays the pointerdown that began the press for every repeat */
    onUpClick?: (value: string, e: PointerEvent) => void;
    /** The root, the number wrapper div; `inputRef` receives the native input */
    ref?: Ref<HTMLDivElement>;
}

export interface InputNumberState extends BaseInputNumberState {}

type Foundation = InputNumberFoundation<InputNumberProps, InputNumberState, FocusEvent, InputElementEvent<KeyboardEvent>>;
type Adapter = InputNumberAdapter<InputNumberProps, InputNumberState, FocusEvent, InputElementEvent<KeyboardEvent>>;

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
    step: numbers.DEFAULT_STEP,
} satisfies Partial<InputNumberProps>;

export default function InputNumber(rawProps: InputNumberProps) {
    const locale = useLocale('InputNumber');

    const defaulted = useDefaultProps('InputNumber', rawProps, {
        ...defaultProps,
        get localeCode() {
            return locale().localeCode;
        },
        get defaultCurrency() {
            return locale().currency;
        },
    });

    const group = useInputGroupContext();
    const layer = usePopupLayer();

    let input: HTMLInputElement | undefined;

    const inGroup = group?.layer === layer ? group : undefined;

    // see Input: the group's size replaces this one, its disabled fills a missing one; the inner Input takes its other attributes
    const props = mergeProps(defaulted, {
        get size() {
            return inGroup?.view().size ?? defaulted.size ?? strings.DEFAULT_SIZE;
        },
        get disabled() {
            return rawProps.disabled ?? inGroup?.view().disabled ?? defaulted.disabled ?? false;
        },
    });

    const [local, rest] = splitProps(props, [
        'addonAfter',
        'addonBefore',
        'class',
        'currency',
        'currencyDisplay',
        'defaultCurrency',
        'defaultValue',
        'disabled',
        'formatter',
        'hideButtons',
        'innerButtons',
        'inputRef',
        'insetLabel',
        'keepFocus',
        'localeCode',
        'max',
        'maximumFractionDigits',
        'min',
        'minimumFractionDigits',
        'onBlur',
        'onChange',
        'onDownClick',
        'onFocus',
        'onKeyDown',
        'onNumberChange',
        'onUpClick',
        'parser',
        'precision',
        'prefix',
        'prefixCls',
        'pressInterval',
        'pressTimeout',
        'ref',
        'scientificNotation',
        'shiftStep',
        'showClear',
        'showCurrencySymbol',
        'size',
        'step',
        'style',
        'suffix',
        'value',
    ]);

    const { foundation, state } = useFoundation<Foundation, Adapter, InputNumberProps, InputNumberState>(
        InputNumberFoundation,
        props,
        (view) => InputNumberFoundation.getInitialState(view),
        (base) => ({
            setValue: (value, cb) => base.setState({ value }, cb),
            setNumber: (number, cb) => base.setState({ number }, cb),
            setFocusing: (focusing, cb) => base.setState({ focusing }, cb),
            setHovering: (hovering) => base.setState({ hovering }),
            notifyChange: (value, e) => props.onChange?.(value, e),
            notifyNumberChange: (value, e) => props.onNumberChange?.(value, e),
            notifyBlur: (e) => props.onBlur?.(e),
            notifyFocus: (e) => props.onFocus?.(e),
            notifyUpClick: (value, e) => props.onUpClick?.(value, e),
            notifyDownClick: (value, e) => props.onDownClick?.(value, e),
            notifyKeyDown: (e) => callHandler(props.onKeyDown, e),
            getInput: () => input ?? null,
        })
    );

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const showInnerButtons = createMemo(() => Boolean(local.innerButtons && !local.hideButtons && (state().hovering || state().focusing)));

    const notAllowedUp = () => local.disabled || reachesBound(state().number, local.max, 1);

    const notAllowedDown = () => local.disabled || reachesBound(state().number, local.min, -1);

    // a factory: the inner and the outer placement never render at once, and each gets nodes of its own
    const buttons = () => (
        <div
            class={clsx(`${local.prefixCls}-number-suffix-btns`, {
                [`${local.prefixCls}-number-suffix-btns-inner`]: local.innerButtons,
                [`${local.prefixCls}-number-suffix-btns-inner-hover`]: local.innerButtons && state().hovering && !state().focusing,
            })}
        >
            <span
                class={clsx(`${local.prefixCls}-number-button`, `${local.prefixCls}-number-button-up`, {
                    [`${local.prefixCls}-number-button-up-disabled`]: local.disabled,
                    [`${local.prefixCls}-number-button-up-not-allowed`]: notAllowedUp(),
                })}
                onLostPointerCapture={() => foundation.handlePressEnd()}
                onMouseDown={(e) => foundation.handleStepMouseDown(e)}
                onPointerDown={(e) => foundation.handleUpPress(e)}
            >
                <IconChevronUp size="extra-small" />
            </span>
            <span
                class={clsx(`${local.prefixCls}-number-button`, `${local.prefixCls}-number-button-down`, {
                    [`${local.prefixCls}-number-button-down-disabled`]: local.disabled,
                    [`${local.prefixCls}-number-button-down-not-allowed`]: notAllowedDown(),
                })}
                onLostPointerCapture={() => foundation.handlePressEnd()}
                onMouseDown={(e) => foundation.handleStepMouseDown(e)}
                onPointerDown={(e) => foundation.handleDownPress(e)}
            >
                <IconChevronDown size="extra-small" />
            </span>
        </div>
    );

    const focusOptions = () => ({ preventScroll: props.preventScroll });

    const setRoot = (node: HTMLDivElement) => {
        forwardFocus(node, () => input, focusOptions);
        registerTrigger(node);
    };

    useWatch(
        () => local.value,
        (next) => foundation.handleValueChange(next as number | string)
    );

    return (
        <div
            ref={mergeRefs(setRoot, local.ref)}
            class={clsx(local.class, `${local.prefixCls}-number`, { [`${local.prefixCls}-number-size-${local.size}`]: local.size })}
            style={local.style}
            onMouseEnter={() => foundation.handleInputMouseEnter()}
            onMouseLeave={() => foundation.handleInputMouseLeave()}
            onMouseMove={() => foundation.handleInputMouseMove()}
        >
            <Input
                role="spinbutton"
                aria-disabled={local.disabled}
                aria-valuemax={local.max === Infinity ? undefined : local.max}
                aria-valuemin={local.min === -Infinity ? undefined : local.min}
                aria-valuenow={InputNumberFoundation.getAriaValueNow(state().number)}
                step={local.step}
                {...rest}
                inputRef={mergeRefs((node: HTMLInputElement) => (input = node), local.inputRef)}
                disabled={local.disabled}
                value={state().value}
                // InputNumber's own global defaults apply to the adornments and showClear; the global Input ones must not
                addonAfter={local.addonAfter ?? null}
                addonBefore={local.addonBefore ?? null}
                insetLabel={local.insetLabel ?? null}
                showClear={local.showClear ?? false}
                size={local.size}
                prefix={local.prefix ?? null}
                suffix={showInnerButtons() ? buttons() : (local.suffix ?? null)}
                onBlur={(e) => foundation.handleInputBlur(e)}
                onChange={(value, e) => foundation.handleInputChange(value, e)}
                onFocus={(e) => foundation.handleInputFocus(e)}
                onKeyDown={(e) => foundation.handleInputKeyDown(e)}
            />
            <Show when={!(local.hideButtons || local.innerButtons)}>{buttons()}</Show>
        </div>
    );
}
