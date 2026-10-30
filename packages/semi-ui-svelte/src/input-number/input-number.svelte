<script lang="ts">
    import { cssClasses, numbers } from '@fibrae/semi-foundation/input-number/constants';
    import InputNumberFoundation, { type InputNumberAdapter, type InputNumberBaseProps, reachesBound } from '@fibrae/semi-foundation/input-number/foundation';
    import '@fibrae/semi-foundation/input-number/input-number.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { Input } from '../input/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { InputNumberProps, InputNumberState } from './interface.js';
    import StepButtons from './step-buttons.svelte';

    interface FoundationProps extends InputNumberBaseProps {
        autofocus?: boolean;
    }

    type Foundation = InputNumberFoundation<FoundationProps, InputNumberState, FocusEvent, KeyboardEvent>;
    type Adapter = InputNumberAdapter<FoundationProps, InputNumberState, FocusEvent, KeyboardEvent>;

    const defaults = useDefaultProps('InputNumber');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        currency = defaults('currency'),
        currencyDisplay = defaults('currencyDisplay'),
        defaultCurrency = defaults('defaultCurrency'),
        localeCode = defaults('localeCode'),
        minimumFractionDigits = defaults('minimumFractionDigits'),
        maximumFractionDigits = defaults('maximumFractionDigits'),
        precision = defaults('precision'),
        scientificNotation = defaults('scientificNotation'),
        showCurrencySymbol = defaults('showCurrencySymbol', true),
        formatter = defaults('formatter'),
        parser = defaults('parser'),
        min = defaults('min', -Infinity),
        max = defaults('max', Infinity),
        step = defaults('step', numbers.DEFAULT_STEP),
        shiftStep = defaults('shiftStep', numbers.DEFAULT_SHIFT_STEP),
        pressInterval = defaults('pressInterval', numbers.DEFAULT_PRESS_TIMEOUT),
        pressTimeout = defaults('pressTimeout', numbers.DEFAULT_PRESS_TIMEOUT),
        keepFocus = defaults('keepFocus', false),
        innerButtons = defaults('innerButtons', false),
        hideButtons = defaults('hideButtons', false),
        size,
        disabled,
        autofocus = defaults('autofocus'),
        preventScroll = defaults('preventScroll'),
        readonly = defaults('readonly'),
        showClear = defaults('showClear'),
        borderless = defaults('borderless'),
        hideSuffix = defaults('hideSuffix'),
        composition = defaults('composition'),
        placeholder = defaults('placeholder'),
        validateStatus = defaults('validateStatus'),
        maxlength = defaults('maxlength'),
        minlength = defaults('minlength'),
        inputStyle = defaults('inputStyle'),
        // the global type leaves out per-instance ids, so there is no default to read
        insetLabelId,
        onChange,
        onNumberChange,
        onUpClick,
        onDownClick,
        onFocus,
        onBlur,
        onKeyDown,
        prefix,
        suffix,
        insetLabel,
        clearIcon,
        addonBefore,
        addonAfter,
        ...rest
    }: InputNumberProps = $props();

    const locale = useLocale('InputNumber');

    let root = $state<HTMLDivElement>();
    let input = $state<ReturnType<typeof Input>>();

    // A value the component wrote itself does not make the input parent-controlled: the foundation owns the text of an
    // unbound input, and only a value that differs from the last write is the parent's.
    let ownWrite = false;
    let lastWritten: number | string | undefined;

    // size and disabled carry no destructuring default, so "passed" is judged before the group and the global default fill in
    const group = getInputGroupInScope();
    const isDisabled = $derived(disabled ?? group?.disabled ?? defaults('disabled') ?? false);
    const prefixCls = cssClasses.PREFIX;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get value() {
            return ownWrite && value === lastWritten ? undefined : value;
        },
        get currency() {
            return currency;
        },
        get currencyDisplay() {
            return currencyDisplay;
        },
        get defaultCurrency() {
            return defaultCurrency ?? locale().currency;
        },
        get localeCode() {
            return localeCode ?? locale().localeCode;
        },
        get minimumFractionDigits() {
            return minimumFractionDigits;
        },
        get maximumFractionDigits() {
            return maximumFractionDigits;
        },
        get precision() {
            return precision;
        },
        get scientificNotation() {
            return scientificNotation;
        },
        get showCurrencySymbol() {
            return showCurrencySymbol;
        },
        get formatter() {
            return formatter;
        },
        get parser() {
            return parser;
        },
        get min() {
            return min;
        },
        get max() {
            return max;
        },
        get step() {
            return step;
        },
        get shiftStep() {
            return shiftStep;
        },
        get pressInterval() {
            return pressInterval;
        },
        get pressTimeout() {
            return pressTimeout;
        },
        get keepFocus() {
            return keepFocus;
        },
        get innerButtons() {
            return innerButtons;
        },
        get readonly() {
            return readonly;
        },
        get disabled() {
            return isDisabled;
        },
        get preventScroll() {
            return preventScroll;
        },
        get autofocus() {
            return autofocus;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, InputNumberState>(
        InputNumberFoundation,
        foundationProps,
        (view) => InputNumberFoundation.getInitialState(view),
        (base) => ({
            setValue: (text, cb) => base.setState({ value: text }, cb),
            setNumber: (number, cb) => base.setState({ number }, cb),
            setFocusing: (focusing, cb) => base.setState({ focusing }, cb),
            setHovering: (hovering) => base.setState({ hovering }),
            notifyChange: (next, event) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                ownWrite = foundationProps.value === undefined;
                lastWritten = next;
                value = next;
                onChange?.(next, event);
            },
            notifyNumberChange: (next, event) => onNumberChange?.(next, event),
            notifyBlur: (event) => onBlur?.(event),
            notifyFocus: (event) => onFocus?.(event),
            notifyUpClick: (next, event) => onUpClick?.(next, event),
            notifyDownClick: (next, event) => onDownClick?.(next, event),
            notifyKeyDown: (event) => onKeyDown?.(event),
            getInput: () => input?.getInput() ?? null,
        })
    );

    const attrs = $derived(splitControlAttrs(rest, (key) => key !== 'class' && key !== 'style'));

    // a plain decimal string, 1.2e-7 written out in full, which the number-typed attribute cannot carry
    const valueNow: Record<string, string | undefined> = $derived({ 'aria-valuenow': InputNumberFoundation.getAriaValueNow(states().number) });

    // the group's size and disabled apply to the wrapper and the buttons too
    const shownSize = $derived(size ?? group?.size ?? defaults('size', 'default'));
    const showInnerButtons = $derived(!hideButtons && innerButtons && Boolean(states().hovering || states().focusing));
    const showOuterButtons = $derived(!hideButtons && !innerButtons);
    const upNotAllowed = $derived(isDisabled || reachesBound(states().number, max, 1));
    const downNotAllowed = $derived(isDisabled || reachesBound(states().number, min, -1));

    setInputGroupContext(undefined);

    watch(
        () => value,
        (next) => {
            if (ownWrite && next === lastWritten) {
                return;
            }
            ownWrite = false;
            foundation.handleValueChange(next as number | string);
        }
    );

    export function focus(options?: FocusOptions) {
        input?.focus(options);
    }

    export function blur() {
        input?.blur();
    }

    export function select() {
        input?.select();
    }

    export function setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none') {
        input?.setSelectionRange(start, end, direction);
    }

    /** The native input */
    export function getInput() {
        return input?.getInput();
    }

    /** The root element, the number wrapper div */
    export function getNativeElement() {
        return root;
    }
</script>

{#snippet stepButtons(inner: boolean)}
    <StepButtons disabled={isDisabled} {downNotAllowed} {inner} innerHover={inner && Boolean(states().hovering && !states().focusing)} onMouseDown={foundation.handleStepMouseDown} onPressDown={foundation.handleDownPress} onPressUp={foundation.handleUpPress} onRelease={foundation.handlePressEnd} {upNotAllowed} />
{/snippet}

{#snippet innerButtonsSuffix()}
    {@render stepButtons(true)}
{/snippet}

<div bind:this={root} {...attrs.root} class={[`${prefixCls}-number`, attrs.root.class, { [`${prefixCls}-number-size-${shownSize}`]: shownSize }]} onmouseenter={foundation.handleInputMouseEnter} onmouseleave={foundation.handleInputMouseLeave} onmousemove={foundation.handleInputMouseMove}>
    <Input
        {addonAfter}
        {addonBefore}
        aria-disabled={isDisabled || undefined}
        aria-valuemax={max === Infinity ? undefined : max}
        aria-valuemin={min === -Infinity ? undefined : min}
        {autofocus}
        bind:this={input}
        bind:value={() => states().value ?? '', () => {}}
        {borderless}
        {clearIcon}
        {composition}
        disabled={isDisabled}
        {hideSuffix}
        {inputStyle}
        {insetLabel}
        {insetLabelId}
        {maxlength}
        {minlength}
        {placeholder}
        {prefix}
        {preventScroll}
        {readonly}
        role="spinbutton"
        showClear={showClear ?? false}
        size={shownSize}
        {step}
        suffix={showInnerButtons ? innerButtonsSuffix : suffix}
        {validateStatus}
        {...valueNow}
        {...attrs.control}
        onBlur={foundation.handleInputBlur}
        onChange={foundation.handleInputChange}
        onFocus={foundation.handleInputFocus}
        onKeyDown={foundation.handleInputKeyDown}
    />
    {#if showOuterButtons}
        {@render stepButtons(false)}
    {/if}
</div>
