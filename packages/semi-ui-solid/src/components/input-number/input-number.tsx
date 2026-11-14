import { type JSX, type Ref, Show, createMemo, mergeProps, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses, numbers, strings, type InputNumberPart } from '@fibrae/semi-foundation/components/input-number/constants';
import InputNumberFoundation, { reachesBound, type BaseInputNumberState, type InputNumberAdapter, type ScientificNotationConfig } from '@fibrae/semi-foundation/components/input-number/foundation';
import '@fibrae/semi-foundation/components/input-number/input-number.scss';
import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-solid';
import { usePopupLayer, useDefaultProps, useFoundation } from '../../base/index';
import { callHandler, forwardFocus, mergeRefs } from '../../utils/index';
import Input, { type InputChangeEvent, type InputElementEvent, type InputProps } from '../input';
import { InputGroupContext, useInputGroupContext } from '../input/context';
import useLocale from '../locale/use-locale';
import { useSpecialTrigger } from '../tooltip/context';

export type { ScientificNotationConfig };

export type InputNumberChangeEvent = InputChangeEvent | PointerEvent | InputElementEvent<KeyboardEvent> | FocusEvent;

/** `class`, `style` and `ref` go to the root; other attributes go to the native input */
export interface InputNumberProps extends Omit<InputProps, 'ref' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown' | 'classNames' | 'styles'> {
    classNames?: Partial<Record<InputNumberPart, string>>;
    styles?: Partial<Record<InputNumberPart, JSX.CSSProperties | string>>;
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

type Foundation = InputNumberFoundation<InputNumberProps, FocusEvent, InputElementEvent<KeyboardEvent>>;
type Adapter = InputNumberAdapter<InputNumberProps, FocusEvent, InputElementEvent<KeyboardEvent>>;

const prefixCls = cssClasses.PREFIX;

const defaultProps = {
    innerButtons: false,
    keepFocus: false,
    max: Infinity,
    min: -Infinity,
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

    const props = mergeProps(defaulted, {
        get size() {
            return rawProps.size ?? inGroup?.view().size ?? defaulted.size ?? strings.DEFAULT_SIZE;
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
        () => ({
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
            class={clsx(`${prefixCls}-number-suffix-btns`, {
                [`${prefixCls}-number-suffix-btns-inner`]: local.innerButtons,
                [`${prefixCls}-number-suffix-btns-inner-hover`]: local.innerButtons && state().hovering && !state().focusing,
            })}
        >
            <span
                class={clsx(`${prefixCls}-number-button`, `${prefixCls}-number-button-up`, {
                    [`${prefixCls}-number-button-up-disabled`]: local.disabled,
                    [`${prefixCls}-number-button-up-not-allowed`]: notAllowedUp(),
                })}
                onLostPointerCapture={foundation.handlePressEnd}
                onMouseDown={foundation.handleStepMouseDown}
                onPointerDown={foundation.handleUpPress}
            >
                <IconChevronUp size="extra-small" />
            </span>
            <span
                class={clsx(`${prefixCls}-number-button`, `${prefixCls}-number-button-down`, {
                    [`${prefixCls}-number-button-down-disabled`]: local.disabled,
                    [`${prefixCls}-number-button-down-not-allowed`]: notAllowedDown(),
                })}
                onLostPointerCapture={foundation.handlePressEnd}
                onMouseDown={foundation.handleStepMouseDown}
                onPointerDown={foundation.handleDownPress}
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

    return (
        // the inner Input and any slot content belong to the InputNumber, not to an enclosing InputGroup
        <InputGroupContext.Provider value={undefined}>
            <div
                // read once: the provider re-creates its subtree when anything read while creating it changes
                ref={untrack(() => mergeRefs(setRoot, local.ref))}
                class={clsx(local.class, `${prefixCls}-number`, { [`${prefixCls}-number-size-${local.size}`]: local.size })}
                style={local.style}
                onMouseEnter={foundation.handleInputMouseEnter}
                onMouseLeave={foundation.handleInputMouseLeave}
                onMouseMove={foundation.handleInputMouseMove}
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
                    // InputNumber's own global defaults apply to the parts, adornments and showClear; the global Input ones must not
                    classNames={rest.classNames ?? {}}
                    styles={rest.styles ?? {}}
                    addonAfter={local.addonAfter ?? null}
                    addonBefore={local.addonBefore ?? null}
                    insetLabel={local.insetLabel ?? null}
                    showClear={local.showClear ?? false}
                    size={local.size}
                    prefix={local.prefix ?? null}
                    suffix={showInnerButtons() ? buttons() : (local.suffix ?? null)}
                    onBlur={foundation.handleInputBlur}
                    onChange={foundation.handleInputChange}
                    onFocus={foundation.handleInputFocus}
                    onKeyDown={foundation.handleInputKeyDown}
                />
                <Show when={!(local.hideButtons || local.innerButtons)}>{buttons()}</Show>
            </div>
        </InputGroupContext.Provider>
    );
}
