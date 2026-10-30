<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { throttle } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/input/constants';
    import TextAreaFoundation, { type TextAreaAdapter, type TextAreaBaseProps } from '@fibrae/semi-foundation/input/textarea-foundation';
    import { syncLineNumberHeights } from '@fibrae/semi-foundation/input/util/line-number';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/input/textarea.scss';
    import { IconClear } from '@fibrae/semi-icons-svelte';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { getInputGroupInScope } from './context.js';
    import { isNotClassOrStyle } from './control-attrs.js';
    import type { TextAreaProps, TextAreaState } from './interface.js';

    type Foundation = TextAreaFoundation<TextAreaBaseProps, TextAreaState, KeyboardEvent, CompositionEvent>;
    type Adapter = TextAreaAdapter<TextAreaBaseProps, TextAreaState, KeyboardEvent, CompositionEvent>;

    const defaults = useDefaultProps('TextArea');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        autosize = defaults('autosize', false),
        borderless = defaults('borderless', false),
        rows = defaults('rows', 4),
        cols = defaults('cols', 20),
        placeholder = defaults('placeholder'),
        maxCount = defaults('maxCount'),
        showCounter = defaults('showCounter', false),
        showClear = defaults('showClear', false),
        disabled: disabledProp,
        readonly = defaults('readonly'),
        autofocus = defaults('autofocus'),
        validateStatus = defaults('validateStatus'),
        composition = defaults('composition', false),
        disabledEnterStartNewLine = defaults('disabledEnterStartNewLine'),
        showLineNumber = defaults('showLineNumber', false),
        lineNumberStart = defaults('lineNumberStart', 1),
        lineNumberClassName = defaults('lineNumberClassName'),
        lineNumberStyle = defaults('lineNumberStyle'),
        textareaStyle = defaults('textareaStyle'),
        resize = defaults('resize'),
        maxlength,
        minlength,
        getValueLength = defaults('getValueLength'),
        onChange,
        onClear,
        onFocus,
        onBlur,
        onInput,
        onKeyDown,
        onKeyUp,
        onEnterPress,
        onResize,
        onCompositionStart,
        onCompositionUpdate,
        onCompositionEnd,
        ...rest
    }: TextAreaProps = $props();

    const locale = useLocale('Input');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let textarea = $state<HTMLTextAreaElement>();
    let lineNumber = $state<HTMLDivElement>();
    let clearButton = $state<HTMLButtonElement>();
    let lineLayout = $state({ width: 0, height: 0 });
    let scrollFrame = 0;

    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled') ?? false);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: TextAreaBaseProps = {
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
            return disabled;
        },
        get readonly() {
            return readonly;
        },
        get disabledEnterStartNewLine() {
            return disabledEnterStartNewLine;
        },
        get autosize() {
            return autosize;
        },
    };

    const prefixCls = cssClasses.PREFIX;
    const counterId = `${uid}-counter`;
    const hasCounter = $derived(showCounter || Boolean(maxCount));
    const attrs = $derived(splitControlAttrs(rest, isNotClassOrStyle));
    const lineNumberPanelStyle = $derived([lineNumberStyle, lineLayout.height ? `height: ${lineLayout.height}px; max-height: ${lineLayout.height}px` : undefined].filter(Boolean).join(';') || undefined);

    const sizeStyle = $derived.by(() => {
        if (autosize) {
            const bounds = typeof autosize === 'object' ? autosize : {};
            const vars = [`--${prefixCls}-textarea-min-rows: ${bounds.minRows ?? rows}`, bounds.maxRows === undefined ? undefined : `--${prefixCls}-textarea-max-rows: ${bounds.maxRows}`];
            return ['resize: none', ...vars].filter(Boolean).join(';');
        }
        return resize === undefined ? undefined : `resize: ${resize}`;
    });

    const focusTextarea = () => {
        textarea?.focus();
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, TextAreaBaseProps, TextAreaState>(
        TextAreaFoundation,
        foundationProps,
        (view) => ({ value: view.value, cachedValue: view.value, isFocus: false }),
        (base) => ({
            setValue: (next) => base.setState({ value: next }),
            toggleFocusing: (isFocus) => base.setState({ isFocus }),
            notifyChange: (next, event) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next, event);
            },
            notifyClear: (event) => onClear?.(event),
            notifyBlur: (_, event) => onBlur?.(event),
            notifyFocus: (_, event) => onFocus?.(event),
            notifyKeyDown: (event) => onKeyDown?.(event),
            notifyEnterPress: (event) => onEnterPress?.(event),
            notifyResize: (size) => onResize?.(size),
            notifyCompositionStart: (event) => onCompositionStart?.(event),
            notifyCompositionEnd: (event) => onCompositionEnd?.(event),
            notifyCompositionUpdate: (event) => onCompositionUpdate?.(event),
            focusInput: focusTextarea,
            isEventTarget: (event) => event.target === event.currentTarget,
            getTextarea: () => textarea ?? null,
        })
    );

    const shown = $derived(TextAreaFoundation.deriveValue({ value }, states()));
    const text = $derived(shown ?? '');
    const lines = $derived(shown ? shown.split('\n') : ['']);
    const allowClear = $derived(TextAreaFoundation.isAllowClear({ showClear, disabled, readonly }, shown));
    const count = $derived(TextAreaFoundation.getValueCount(shown, getValueLength));
    const exceeds = $derived(Boolean(maxCount) && count > (maxCount ?? 0));
    const invalid = $derived((validateStatus === 'error' || exceeds ? 'true' : attrs.control['aria-invalid']) as boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined);

    const throttledResize = throttle((entries: Parameters<typeof foundation.handleResize>[0]) => foundation.handleResize(entries), 10);

    // a parent that rejects the typed text leaves `shown` as it was, so Svelte never patches the textarea back
    const restoreShownText = async () => {
        await tick();
        if (textarea && textarea.value !== text) {
            textarea.value = text;
        }
    };

    const handleInput = (event: Event & { currentTarget: HTMLTextAreaElement }) => {
        // finally: a throwing onChange still leaves the textarea showing the value the parent kept
        try {
            foundation.handleChange(event.currentTarget.value, event);
            onInput?.(event);
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

    // keyboard activation (detail 0) returns focus to the textarea as the button unmounts
    const handleClearClick = (event: MouseEvent) => {
        foundation.handleClear(event);
        if (event.detail === 0) {
            focusTextarea();
        }
    };

    const handleScroll = (event: Event & { currentTarget: HTMLTextAreaElement }) => {
        const { scrollTop } = event.currentTarget;
        // the user's own listener keeps working next to the line number sync
        (attrs.control.onscroll as ((event: Event) => void) | undefined)?.(event);
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => {
            if (lineNumber) {
                lineNumber.scrollTop = scrollTop;
            }
        });
    };

    const isResizable = (directions: string[]) => !autosize && resize !== undefined && directions.includes(resize);

    const keepFocus = (event: MouseEvent) => event.preventDefault();

    watch(
        () => value,
        (next) => foundation.handleValueChange(next as string)
    );

    // the line number panel remounts the textarea
    watch(() => [shown, Boolean(autosize), showLineNumber], foundation.fitAutosize);

    // A removed node fires no blur, so a focused clear button would drop focus to the body; this pre-flush effect runs
    // before the DOM patch removes it.
    $effect.pre(() => {
        if (!allowClear && clearButton && clearButton === FocusTrapHandle.getActiveElement(clearButton)) {
            focusTextarea();
        }
    });

    $effect(() => {
        const element = autosize || (resize !== undefined && resize !== 'none') ? textarea : undefined;
        if (!element) {
            return;
        }
        const observer = new ResizeObserver((entries) => throttledResize(entries));
        observer.observe(element);
        return () => observer.disconnect();
    });

    $effect(() => {
        if (!showLineNumber || !textarea) {
            return;
        }
        const observer = new ResizeObserver((entries) => {
            // contentRect does not include borders; align with textarea.clientHeight
            const { width, height } = entries[entries.length - 1].contentRect;
            lineLayout = { width, height };
        });
        observer.observe(textarea);
        return () => observer.disconnect();
    });

    $effect(() => {
        // width is 0 until the observer has reported the mounted textarea
        if (textarea && lineNumber && lineLayout.width) {
            syncLineNumberHeights(textarea, lineNumber, lines);
        }
    });

    // the native autofocus does nothing on a later-inserted node, and focusing a textarea with a value leaves the caret at the end
    onMount(() => {
        if (autofocus) {
            focusTextarea();
            textarea?.setSelectionRange(0, 0);
        }
        return () => {
            throttledResize.cancel();
            cancelAnimationFrame(scrollFrame);
        };
    });

    export function focus(options?: FocusOptions) {
        textarea?.focus(options);
    }

    export function blur() {
        textarea?.blur();
    }

    export function select() {
        textarea?.select();
    }

    export function setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none') {
        textarea?.setSelectionRange(start, end, direction);
    }

    /** The native textarea */
    export function getTextarea() {
        return textarea;
    }

    /** The root element, the wrapper div */
    export function getNativeElement() {
        return root;
    }
</script>

{#snippet field()}
    <textarea
        bind:this={textarea}
        {...attrs.control}
        aria-describedby={joinIds(attrs.control['aria-describedby'] as string | undefined, hasCounter && counterId)}
        aria-invalid={invalid}
        class={[
            `${prefixCls}-textarea`,
            {
                [`${prefixCls}-textarea-disabled`]: disabled,
                [`${prefixCls}-textarea-readonly`]: readonly,
                [`${prefixCls}-textarea-autosize`]: Boolean(autosize),
                [`${prefixCls}-textarea-showClear`]: showClear,
            },
        ]}
        {cols}
        {disabled}
        maxlength={getValueLength ? undefined : maxlength}
        minlength={TextAreaFoundation.getNativeMinLength({ minLength: minlength, getValueLength }, shown)}
        placeholder={placeholder || undefined}
        {readonly}
        {rows}
        style={[textareaStyle, sizeStyle].filter(Boolean).join(';') || undefined}
        value={text}
        oncompositionend={handleCompositionEnd}
        oncompositionstart={foundation.handleCompositionStart}
        oncompositionupdate={foundation.handleCompositionUpdate}
        oninput={handleInput}
        onkeydown={foundation.handleKeyDown}
        onkeyup={(event) => onKeyUp?.(event)}
        onscroll={handleScroll}></textarea>
{/snippet}

<div
    bind:this={root}
    {...attrs.root}
    class={[
        `${prefixCls}-textarea-wrapper`,
        attrs.root.class,
        {
            [`${prefixCls}-textarea-borderless`]: borderless,
            [`${prefixCls}-textarea-wrapper-disabled`]: disabled,
            [`${prefixCls}-textarea-wrapper-readonly`]: readonly,
            [`${prefixCls}-textarea-wrapper-${validateStatus}`]: Boolean(validateStatus),
            [`${prefixCls}-textarea-wrapper-focus`]: states().isFocus,
            [`${prefixCls}-textarea-wrapper-withLineNumber`]: showLineNumber,
            [`${prefixCls}-textarea-wrapper-resizeX`]: isResizable(['horizontal', 'both', 'inline']),
            [`${prefixCls}-textarea-wrapper-resizeY`]: isResizable(['vertical', 'both', 'block']),
        },
    ]}
    onclick={foundation.handleClick}
    onfocusin={handleFocusIn}
    onfocusout={handleFocusOut}
>
    {#if showLineNumber}
        <!-- the numbers only mirror the text rows, so assistive technology skips them -->
        <div aria-hidden="true" bind:this={lineNumber} class={[`${prefixCls}-textarea-lineNumber`, lineNumberClassName]} style={lineNumberPanelStyle}>
            {#each lines as _, index (index)}
                <div class={`${prefixCls}-textarea-lineNumber-item`}>{lineNumberStart + index}</div>
            {/each}
        </div>
        <div class={`${prefixCls}-textarea-content`}>
            {@render field()}
        </div>
    {:else}
        {@render field()}
    {/if}
    {#if allowClear}
        <button aria-label={locale().locale.clear} bind:this={clearButton} class={`${prefixCls}-clearbtn`} type="button" onclick={handleClearClick} onmousedown={keepFocus}>
            <IconClear />
        </button>
    {/if}
    {#if hasCounter}
        <div class={[`${prefixCls}-textarea-counter`, { [`${prefixCls}-textarea-counter-exceed`]: exceeds }]} id={counterId} onclick={foundation.handleCounterClick}>
            {count}{#if maxCount}/{maxCount}{/if}
        </div>
    {/if}
</div>
