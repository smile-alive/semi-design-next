<script lang="ts">
    import { tick } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/input/constants';
    import InputFoundation, { type InputAdapter, type InputBaseProps } from '@fibrae/semi-foundation/input/foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/input/input.scss';
    import { IconClear, IconEyeClosedSolid, IconEyeOpened } from '@fibrae/semi-icons-svelte';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import { type SlotKind, trackSlotKind } from '../_base/slot-kind.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getInputGroupInScope } from './context.js';
    import { isNotClassOrStyle } from './control-attrs.js';
    import type { InputProps, InputState } from './interface.js';

    type Foundation = InputFoundation<InputBaseProps, InputState, KeyboardEvent, CompositionEvent, Event>;
    type Adapter = InputAdapter<InputBaseProps, InputState, KeyboardEvent, CompositionEvent, Event>;

    const defaults = useDefaultProps('Input');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        size,
        type = defaults('type', 'text'),
        mode = defaults('mode'),
        disabled,
        readonly = defaults('readonly', false),
        readOnly,
        borderless = defaults('borderless', false),
        showClear = defaults('showClear', false),
        hideSuffix = defaults('hideSuffix', false),
        showClearIgnoreDisabled = defaults('showClearIgnoreDisabled'),
        composition = defaults('composition', false),
        preventScroll = defaults('preventScroll'),
        autofocus = defaults('autofocus'),
        maxlength,
        minlength,
        placeholder = defaults('placeholder'),
        validateStatus = defaults('validateStatus', 'default'),
        inputStyle = defaults('inputStyle'),
        insetLabelId,
        getValueLength = defaults('getValueLength'),
        onChange,
        onClear,
        onFocus,
        onBlur,
        onInput,
        onKeyDown,
        onKeyUp,
        onEnterPress,
        onCompositionStart,
        onCompositionUpdate,
        onCompositionEnd,
        prefix,
        suffix,
        addonBefore,
        addonAfter,
        insetLabel,
        clearIcon,
        ...rest
    }: InputProps = $props();

    const locale = useLocale('Input');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let input = $state<HTMLInputElement>();
    let clearButton = $state<HTMLButtonElement>();
    let prefixKind = $state<SlotKind>();
    let suffixKind = $state<SlotKind>();
    let addonBeforeKind = $state<SlotKind>();
    let addonAfterKind = $state<SlotKind>();

    const group = getInputGroupInScope();

    // size and disabled carry no destructuring default, so "passed" is judged before the group and the global default fill in
    const isDisabled = $derived(disabled ?? group?.disabled ?? defaults('disabled') ?? false);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: InputBaseProps = {
        get value() {
            return value;
        },
        get maxLength() {
            return maxlength;
        },
        get minLength() {
            return minlength;
        },
        get getValueLength() {
            return getValueLength;
        },
        get composition() {
            return composition;
        },
        get disabled() {
            return isDisabled;
        },
        get autofocus() {
            return autofocus;
        },
    };

    const prefixCls = cssClasses.PREFIX;
    const trackPrefix = trackSlotKind((kind) => (prefixKind = kind));
    const trackSuffix = trackSlotKind((kind) => (suffixKind = kind));
    const trackAddonBefore = trackSlotKind((kind) => (addonBeforeKind = kind));
    const trackAddonAfter = trackSlotKind((kind) => (addonAfterKind = kind));
    const shownSize = $derived(size ?? group?.size ?? defaults('size', 'default'));
    const attrs = $derived(splitControlAttrs(rest, isNotClassOrStyle));
    const insetLabelShown = $derived(Boolean(insetLabel) && !prefix);
    const labelId = $derived(insetLabelId ?? (insetLabelShown ? `${uid}-inset-label` : undefined));
    const labelledby = $derived((attrs.control['aria-labelledby'] ?? (insetLabelShown && !attrs.control['aria-label'] ? labelId : undefined)) as string | undefined);
    const invalid = $derived((validateStatus === 'error' ? 'true' : attrs.control['aria-invalid']) as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined);

    const focusInput = () => {
        input?.focus({ preventScroll });
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, InputBaseProps, InputState>(
        InputFoundation,
        foundationProps,
        (view) => ({
            value: view.value,
            cachedValue: view.value,
            isFocus: false,
            eyeClosed: mode === 'password',
        }),
        (base) => ({
            setValue: (next) => base.setState({ value: next }),
            setEyeClosed: (eyeClosed) => base.setState({ eyeClosed }),
            toggleFocusing: (isFocus) => base.setState({ isFocus }),
            focusInput,
            notifyChange: (next, event) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next, event);
            },
            notifyBlur: (_, event) => onBlur?.(event),
            notifyFocus: (_, event) => onFocus?.(event),
            notifyInput: (event) => onInput?.(event),
            notifyKeyDown: (event) => onKeyDown?.(event),
            notifyKeyUp: (event) => onKeyUp?.(event),
            notifyEnterPress: (event) => onEnterPress?.(event),
            notifyClear: (event) => onClear?.(event),
            notifyCompositionStart: (event) => onCompositionStart?.(event),
            notifyCompositionEnd: (event) => onCompositionEnd?.(event),
            notifyCompositionUpdate: (event) => onCompositionUpdate?.(event),
            isEventTarget: (event) => event.target === event.currentTarget,
        })
    );

    const shown = $derived(InputFoundation.deriveValue({ value }, states()));
    const text = $derived(String(shown ?? ''));
    const allowClear = $derived(InputFoundation.isAllowClear({ showClear, disabled: isDisabled, readonly, showClearIgnoreDisabled }, shown));

    // a parent that rejects the typed text leaves `shown` as it was, so Svelte never patches the input back
    const restoreShownText = async () => {
        await tick();
        if (input && input.value !== text) {
            input.value = text;
        }
    };

    const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
        // finally: a throwing onChange still leaves the input showing the value the parent kept
        try {
            foundation.handleInput(event);
            foundation.handleChange(event.currentTarget.value, event);
        } finally {
            // writing during an IME composition would break it; compositionend restores
            if (!(event instanceof InputEvent && event.isComposing)) {
                void restoreShownText();
            }
        }
    };

    const handleCompositionEnd = (event: CompositionEvent) => {
        foundation.handleCompositionEnd(event);
        void restoreShownText();
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: HTMLElement }) => {
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            foundation.handleFocus(event);
        }
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: HTMLElement }) => {
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            foundation.handleBlur(event);
        }
    };

    // the primary button clears on mousedown (issue 1203) without moving focus; the others only keep focus where it is
    const handleClearMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        if (event.button === 0) {
            foundation.handleClear(event);
        }
    };

    // keyboard activation (detail 0): focus returns to the input as the button unmounts
    const handleClearClick = (event: MouseEvent) => {
        if (event.detail === 0) {
            foundation.handleClear(event);
            focusInput();
        }
    };

    // a host key handler (AutoComplete picks an option on Enter) must not take the keys that press the button
    const stopActivationKeys = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation();
        }
    };

    const keepFocus = (event: MouseEvent) => event.preventDefault();

    watch(
        () => value,
        (next) => foundation.handleValueChange(next as string | number)
    );

    watch(
        () => mode,
        (next) => foundation.handleModeChange(next as string)
    );

    // A removed node fires no blur, so a focused clear button would drop focus to the body; this pre-flush effect runs
    // before the DOM patch removes it.
    $effect.pre(() => {
        if (!allowClear && clearButton && clearButton === FocusTrapHandle.getActiveElement(clearButton)) {
            focusInput();
        }
    });

    export function focus(options?: FocusOptions) {
        input?.focus({ preventScroll, ...options });
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
        return input;
    }

    /** The root element, the wrapper div */
    export function getNativeElement() {
        return root;
    }
</script>

<div
    bind:this={root}
    {...attrs.root}
    class={[
        `${prefixCls}-wrapper`,
        attrs.root.class,
        {
            [`${prefixCls}-wrapper__with-prefix`]: Boolean(prefix || insetLabel),
            [`${prefixCls}-wrapper__with-suffix`]: Boolean(suffix),
            [`${prefixCls}-wrapper__with-suffix-hidden`]: allowClear && hideSuffix,
            [`${prefixCls}-wrapper__with-suffix-icon`]: suffixKind === 'icon',
            [`${prefixCls}-wrapper__with-append`]: Boolean(addonBefore),
            [`${prefixCls}-wrapper__with-prepend`]: Boolean(addonAfter),
            [`${prefixCls}-wrapper__with-append-only`]: Boolean(addonBefore && !addonAfter),
            [`${prefixCls}-wrapper__with-prepend-only`]: Boolean(!addonBefore && addonAfter),
            [`${prefixCls}-wrapper-readonly`]: readonly,
            [`${prefixCls}-wrapper-disabled`]: isDisabled,
            [`${prefixCls}-wrapper-warning`]: validateStatus === 'warning',
            [`${prefixCls}-wrapper-error`]: validateStatus === 'error',
            [`${prefixCls}-wrapper-focus`]: states().isFocus,
            [`${prefixCls}-wrapper-clearable`]: showClear,
            [`${prefixCls}-wrapper-modebtn`]: mode === 'password',
            [`${prefixCls}-wrapper-hidden`]: type === 'hidden',
            [`${prefixCls}-wrapper-${shownSize}`]: Boolean(shownSize),
            [`${prefixCls}-borderless`]: borderless,
        },
    ]}
    onclick={foundation.handleClick}
    onfocusin={handleFocusIn}
    onfocusout={handleFocusOut}
>
    {#if addonBefore}
        <div
            {@attach trackAddonBefore}
            class={[
                `${prefixCls}-prepend`,
                {
                    [`${prefixCls}-prepend-text`]: addonBeforeKind === 'text',
                    [`${prefixCls}-prepend-icon`]: addonBeforeKind === 'icon',
                },
            ]}
            x-semi-prop="addonBefore"
        >
            {@render addonBefore()}
        </div>
    {/if}
    {#if prefix || insetLabel}
        <div
            {@attach trackPrefix}
            class={[
                `${prefixCls}-prefix`,
                {
                    [`${prefixCls}-inset-label`]: Boolean(insetLabel),
                    [`${prefixCls}-prefix-text`]: prefixKind === 'text',
                    [`${prefixCls}-prefix-icon`]: prefixKind === 'icon',
                },
            ]}
            id={labelId}
            x-semi-prop="prefix,insetLabel"
            onclick={foundation.handleClickPrefixOrSuffix}
            onmousedown={keepFocus}
        >
            {#if prefix}
                {@render prefix()}
            {:else if insetLabel}
                {@render insetLabel()}
            {/if}
        </div>
    {/if}
    <input
        bind:this={input}
        {...attrs.control}
        aria-invalid={invalid}
        aria-labelledby={labelledby}
        class={[
            prefixCls,
            {
                [`${prefixCls}-${shownSize}`]: Boolean(shownSize),
                [`${prefixCls}-disabled`]: isDisabled,
                [`${prefixCls}-sibling-clearbtn`]: allowClear,
                [`${prefixCls}-sibling-modebtn`]: mode === 'password',
            },
        ]}
        disabled={isDisabled}
        maxlength={getValueLength ? undefined : maxlength}
        minlength={InputFoundation.getNativeMinLength({ minLength: minlength, getValueLength }, shown)}
        placeholder={placeholder?.toString()}
        readonly={readonly || readOnly}
        style={inputStyle}
        type={InputFoundation.getInputType(type, mode, states().eyeClosed)}
        value={text}
        oncompositionend={handleCompositionEnd}
        oncompositionstart={foundation.handleCompositionStart}
        oncompositionupdate={foundation.handleCompositionUpdate}
        oninput={handleInput}
        onkeydown={foundation.handleKeyDown}
        onkeyup={foundation.handleKeyUp}
    />
    {#if allowClear}
        <button aria-label={locale().locale.clear} bind:this={clearButton} class={`${prefixCls}-clearbtn`} type="button" onclick={handleClearClick} onkeydown={stopActivationKeys} onmousedown={handleClearMouseDown}>
            {#if clearIcon}
                {@render clearIcon()}
            {:else}
                <IconClear />
            {/if}
        </button>
    {/if}
    {#if suffix}
        <div
            {@attach trackSuffix}
            class={[
                `${prefixCls}-suffix`,
                {
                    [`${prefixCls}-suffix-text`]: suffixKind === 'text',
                    [`${prefixCls}-suffix-icon`]: suffixKind === 'icon',
                    [`${prefixCls}-suffix-hidden`]: allowClear && hideSuffix,
                },
            ]}
            x-semi-prop="suffix"
            onclick={foundation.handleClickPrefixOrSuffix}
            onmousedown={keepFocus}
        >
            {@render suffix()}
        </div>
    {/if}
    {#if mode === 'password' && !isDisabled}
        <button aria-label={states().eyeClosed ? locale().locale.showPassword : locale().locale.hidePassword} class={`${prefixCls}-modebtn`} type="button" onclick={foundation.handleClickEye} onkeydown={stopActivationKeys} onmousedown={keepFocus}>
            {#if states().eyeClosed}
                <IconEyeClosedSolid />
            {:else}
                <IconEyeOpened />
            {/if}
        </button>
    {/if}
    {#if addonAfter}
        <div
            {@attach trackAddonAfter}
            class={[
                `${prefixCls}-append`,
                {
                    [`${prefixCls}-append-text`]: addonAfterKind === 'text',
                    [`${prefixCls}-append-icon`]: addonAfterKind === 'icon',
                },
            ]}
            x-semi-prop="addonAfter"
        >
            {@render addonAfter()}
        </div>
    {/if}
</div>
