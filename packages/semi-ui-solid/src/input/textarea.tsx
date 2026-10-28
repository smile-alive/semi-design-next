import { type JSX, type Ref, Index, Show, createEffect, createRenderEffect, createSignal, createUniqueId, on, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { throttle } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/input/constants';
import TextAreaFoundation, { type TextAreaAdapter } from '@fibrae/semi-foundation/input/textarea-foundation';
import { syncLineNumberHeights } from '@fibrae/semi-foundation/input/util/line-number';
import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/input/textarea.scss';
import { IconClear } from '@fibrae/semi-icons-solid';
import autofocus from '../_base/autofocus';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import mergeRefs from '../_base/merge-refs';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import useRaf from '../_base/use-raf';
import useResizeObserver from '../_base/use-resize-observer';
import useWatch from '../_base/use-watch';
import useLocale from '../locale/use-locale';
import { useSpecialTrigger } from '../tooltip/context';
import type { ValidateStatus } from './input';
import useControlledInput from './use-controlled-input';

const prefixCls = cssClasses.PREFIX;

export type AutosizeRow = {
    minRows?: number;
    maxRows?: number;
};

/** A native event on the textarea, typed as Solid hands it to a handler */
export type TextAreaElementEvent<E extends Event> = E & { currentTarget: HTMLTextAreaElement; target: Element };

/**
 * What `onChange` receives: typing, an IME composition ending, the clear button, or the native blur event when
 * blurring mid-composition truncates the value to `maxLength`
 */
export type TextAreaChangeEvent = TextAreaElementEvent<InputEvent> | TextAreaElementEvent<CompositionEvent> | MouseEvent | FocusEvent;

export interface TextAreaProps extends ElementProps<'textarea', 'onChange' | 'onFocus' | 'onBlur' | 'onResize' | 'ref'> {
    autosize?: boolean | AutosizeRow;
    borderless?: boolean;
    value?: string;
    rows?: number;
    cols?: number;
    maxCount?: number;
    validateStatus?: ValidateStatus;
    defaultValue?: string;
    disabled?: boolean;
    /** Locks typing and hides the clear button; the native `readOnly` locks typing only */
    readonly?: boolean;
    showCounter?: boolean;
    showClear?: boolean;
    onClear?: (e: MouseEvent) => void;
    onChange?: (value: string, e: TextAreaChangeEvent) => void;
    /** Listens on the wrapper: focus moving between the textarea and its clear button does not fire it */
    onBlur?: (e: FocusEvent) => void;
    /** Listens on the wrapper: focus moving between the textarea and its clear button does not fire it */
    onFocus?: (e: FocusEvent) => void;
    onEnterPress?: (e: TextAreaElementEvent<KeyboardEvent>) => void;
    /**
     * Called when the size changes: the border-box height in `autosize` mode, a drag of the resize handle in native
     * `resize` mode.
     */
    onResize?: (data: { height: number; width?: number }) => void;
    getValueLength?: (value: string) => number;
    maxLength?: number;
    minLength?: number;
    /** Internal, used by Chat: Enter does not start a new line, Shift+Enter does */
    disabledEnterStartNewLine?: boolean;
    showLineNumber?: boolean;
    /** The starting line number, default is 1 */
    lineNumberStart?: number;
    lineNumberClassName?: string;
    lineNumberStyle?: JSX.CSSProperties;
    /** The style of the textarea element */
    textareaStyle?: JSX.CSSProperties;
    /** When enabled, onChange fires once after an IME composition ends, not during it */
    composition?: boolean;
    /** Whether and in which direction the textarea is resizable; ignored with autosize, applied only when provided */
    resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline';
    /** The wrapper div; other attributes go to the native textarea, `class` and `style` to the wrapper */
    ref?: Ref<HTMLDivElement>;
    /** The native textarea; called again with the new element when `showLineNumber` remounts it */
    textareaRef?: (element: HTMLTextAreaElement) => void;
}

export interface TextAreaState {
    value: string | undefined;
    isFocus: boolean;
    cachedValue?: string;
}

type Foundation = TextAreaFoundation<TextAreaProps, TextAreaState, TextAreaElementEvent<KeyboardEvent>, TextAreaElementEvent<CompositionEvent>>;
type Adapter = TextAreaAdapter<TextAreaProps, TextAreaState, TextAreaElementEvent<KeyboardEvent>, TextAreaElementEvent<CompositionEvent>>;

const defaultProps = {
    autosize: false,
    borderless: false,
    rows: 4,
    cols: 20,
    showCounter: false,
    showClear: false,
    composition: false,
    showLineNumber: false,
    lineNumberStart: 1,
} satisfies Partial<TextAreaProps>;

export default function TextArea(rawProps: TextAreaProps) {
    const props = useDefaultProps('TextArea', rawProps, defaultProps);

    const [local, rest] = splitProps(omitFormInjected(props), [
        'autofocus',
        'autosize',
        'borderless',
        'class',
        'composition',
        'defaultValue',
        'disabled',
        'disabledEnterStartNewLine',
        'getValueLength',
        'lineNumberClassName',
        'lineNumberStart',
        'lineNumberStyle',
        'maxCount',
        'maxLength',
        'minLength',
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
        'onResize',
        'placeholder',
        'readOnly',
        'readonly',
        'ref',
        'resize',
        'showClear',
        'showCounter',
        'showLineNumber',
        'style',
        'textareaRef',
        'textareaStyle',
        'value',
    ]);

    const locale = useLocale('Input');

    const [textarea, setTextarea] = createSignal<HTMLTextAreaElement>();
    const [lineLayout, setLineLayout] = createSignal({ width: 0, height: 0 });
    let lineNumberPanel: HTMLDivElement | undefined;
    let clearButton: HTMLButtonElement | undefined;

    const counterId = `${createUniqueId()}-counter`;

    const focusTextarea = () => textarea()?.focus();

    const { foundation, state } = useFoundation<Foundation, Adapter, TextAreaProps, TextAreaState>(
        TextAreaFoundation,
        props,
        (view) => ({
            value: view.value === undefined ? view.defaultValue : view.value,
            isFocus: false,
            cachedValue: view.value,
        }),
        (base) => ({
            setValue: (value) => base.setState({ value }),
            toggleFocusing: (isFocus) => base.setState({ isFocus }),
            notifyChange: (value, e: TextAreaChangeEvent) => props.onChange?.(value, e),
            notifyClear: (e: MouseEvent) => props.onClear?.(e),
            notifyBlur: (_, e: FocusEvent) => props.onBlur?.(e),
            notifyFocus: (_, e: FocusEvent) => props.onFocus?.(e),
            notifyKeyDown: (e) => callHandler(props.onKeyDown, e),
            notifyResize: (size) => props.onResize?.(size),
            notifyEnterPress: (e) => props.onEnterPress?.(e),
            notifyCompositionStart: (e) => callHandler(props.onCompositionStart, e),
            notifyCompositionEnd: (e) => callHandler(props.onCompositionEnd, e),
            notifyCompositionUpdate: (e) => callHandler(props.onCompositionUpdate, e),
            focusInput: focusTextarea,
            isEventTarget: (e) => e.target === e.currentTarget,
            getTextarea: () => textarea() ?? null,
        })
    );

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const scheduleScrollSync = useRaf();

    // focus on a removed node falls to the body while the TextArea stays focused, so it goes to the textarea instead
    const handover = useFocusHandover<HTMLButtonElement>(textarea);

    const throttledResize = throttle(foundation.handleResize, 10);

    const value = () => TextAreaFoundation.deriveValue(local, state());

    const lines = () => {
        const text = value();
        return text ? text.split('\n') : [''];
    };

    const count = () => TextAreaFoundation.getValueCount(value(), local.getValueLength);

    const hasCounter = () => local.showCounter || Boolean(local.maxCount);

    const exceeds = () => Boolean(local.maxCount) && count() > (local.maxCount ?? 0);

    const allowClear = () => TextAreaFoundation.isAllowClear(local, value());

    const controlled = useControlledInput({ element: textarea, text: () => value() ?? '', foundation, state, allowClear, clearButton: () => clearButton });

    // horizontal resize needs a shrink-to-fit wrapper so the border, clear button and counter follow
    const resizableIn = (directions: string[]) => !local.autosize && local.resize !== undefined && directions.includes(local.resize);

    const observesSize = () => Boolean(local.autosize) || (local.resize !== undefined && local.resize !== 'none');

    // the stylesheet turns the row counts into the min/max block size (see textarea.scss)
    const textareaStyle = (): JSX.CSSProperties | undefined => {
        if (local.autosize) {
            const bounds = typeof local.autosize === 'object' ? local.autosize : {};
            return {
                ...local.textareaStyle,
                resize: 'none',
                [`--${prefixCls}-textarea-min-rows`]: String(bounds.minRows ?? props.rows),
                [`--${prefixCls}-textarea-max-rows`]: bounds.maxRows === undefined ? undefined : String(bounds.maxRows),
            };
        }
        return local.resize === undefined ? local.textareaStyle : { ...local.textareaStyle, resize: local.resize };
    };

    const lineNumberStyle = (): JSX.CSSProperties => {
        const { height } = lineLayout();
        // capped at the textarea height so the panel does not expand it
        return { ...local.lineNumberStyle, height: height ? `${height}px` : undefined, 'max-height': height ? `${height}px` : undefined };
    };

    const handleInput = (e: TextAreaElementEvent<InputEvent>) => {
        // Solid's input handler type narrows `target` to the textarea itself, which this event's target is
        callHandler(local.onInput as JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>, e);
        controlled.handleInput(e);
    };

    // blurring mid-composition may truncate the value to maxLength, which a controlled parent can reject
    const handleFocusOut = (e: FocusEvent & { currentTarget: HTMLDivElement }) => controlled.handleFocusOut(e, controlled.syncValue);

    const handleClearClick = (e: MouseEvent) => {
        foundation.handleClear(e);
        // only keyboard activation (detail 0) moves focus: the focused button is about to be removed
        if (e.detail === 0) {
            focusTextarea();
        }
    };

    const handleScroll = (e: Event & { currentTarget: HTMLTextAreaElement }) => {
        if (!local.showLineNumber) {
            return;
        }
        const { scrollTop } = e.currentTarget;
        // rAF avoids layout thrash
        scheduleScrollSync(() => {
            if (lineNumberPanel) {
                lineNumberPanel.scrollTop = scrollTop;
            }
        });
    };

    const setRoot = (node: HTMLDivElement) => {
        forwardFocus(node, textarea);
        registerTrigger(node);
    };

    const setElement = (node: HTMLTextAreaElement) => {
        node.value = value() ?? '';
        setTextarea(node);
    };

    const setClearButton = (node: HTMLButtonElement) => {
        clearButton = node;
        handover(node);
    };

    // showLineNumber remounts the textarea inside a content wrapper, as React does
    const textareaNode = () => (
        <textarea
            {...rest}
            // called inside Show, whose memo would track this read; a spread props signal would recreate the textarea
            ref={untrack(() => mergeRefs(setElement, local.textareaRef))}
            class={clsx(`${prefixCls}-textarea`, {
                [`${prefixCls}-textarea-disabled`]: local.disabled,
                [`${prefixCls}-textarea-readonly`]: local.readonly,
                [`${prefixCls}-textarea-autosize`]: Boolean(local.autosize),
                [`${prefixCls}-textarea-showClear`]: local.showClear,
            })}
            style={textareaStyle()}
            aria-describedby={joinIds(rest['aria-describedby'], hasCounter() && counterId)}
            aria-invalid={props.validateStatus === 'error' || exceeds() ? 'true' : rest['aria-invalid']}
            disabled={local.disabled}
            // the native maxLength counts UTF-16 units, so getValueLength enforces the limit instead
            maxLength={typeof local.getValueLength === 'function' ? undefined : local.maxLength}
            minLength={TextAreaFoundation.getNativeMinLength(local, value())}
            placeholder={local.placeholder || undefined}
            // The content carries the text into the server HTML. What the browser shows is the property, written in
            // the ref and by syncValue: once written, the content no longer changes it
            textContent={value() ?? ''}
            // the native attribute locks typing only; `readonly` also blocks clearing. The lowercase name is the
            // boolean attribute, which the server omits when false
            readonly={local.readonly || local.readOnly}
            onCompositionEnd={controlled.handleCompositionEnd}
            onCompositionStart={(e) => foundation.handleCompositionStart(e)}
            onCompositionUpdate={(e) => foundation.handleCompositionUpdate(e)}
            onInput={handleInput}
            onKeyDown={(e) => foundation.handleKeyDown(e)}
            onScroll={handleScroll}
        />
    );

    createRenderEffect(controlled.syncValue);

    useWatch(
        () => local.value,
        (next) => foundation.handleValueChange(next as string)
    );

    createEffect(() => {
        const element = textarea();
        if (local.showLineNumber && element && lineNumberPanel && lineLayout().width) {
            syncLineNumberHeights(element, lineNumberPanel, lines());
        }
    });

    // also tracks the node, which the line number panel remounts
    createEffect(on([value, textarea, () => local.autosize], () => foundation.fitAutosize()));

    onMount(() => {
        if (local.disabled) {
            return;
        }
        autofocus(local.autofocus, textarea());
        // focusing a textarea that holds a value leaves the caret at the end
        if (local.autofocus) {
            textarea()?.setSelectionRange(0, 0);
        }
    });

    onCleanup(() => throttledResize.cancel());

    useResizeObserver(() => (observesSize() ? textarea() : null), throttledResize);

    useResizeObserver(
        () => (local.showLineNumber ? textarea() : null),
        (entries) => {
            // contentRect excludes borders, matching textarea.clientHeight
            const { width, height } = entries[entries.length - 1].contentRect;
            setLineLayout({ width, height });
        }
    );

    return (
        <div
            ref={mergeRefs(setRoot, local.ref)}
            class={clsx(local.class, `${prefixCls}-textarea-wrapper`, {
                [`${prefixCls}-textarea-borderless`]: local.borderless,
                [`${prefixCls}-textarea-wrapper-disabled`]: local.disabled,
                [`${prefixCls}-textarea-wrapper-readonly`]: local.readonly,
                [`${prefixCls}-textarea-wrapper-${props.validateStatus}`]: Boolean(props.validateStatus),
                [`${prefixCls}-textarea-wrapper-focus`]: state().isFocus,
                [`${prefixCls}-textarea-wrapper-withLineNumber`]: local.showLineNumber,
                [`${prefixCls}-textarea-wrapper-resizeX`]: resizableIn(['horizontal', 'both', 'inline']),
                [`${prefixCls}-textarea-wrapper-resizeY`]: resizableIn(['vertical', 'both', 'block']),
            })}
            style={local.style}
            onClick={(e) => foundation.handleClick(e)}
            onFocusIn={controlled.handleFocusIn}
            onFocusOut={handleFocusOut}
        >
            <Show when={local.showLineNumber} fallback={textareaNode()}>
                {/* decorative: screen readers would read every number before the textarea */}
                <div ref={(node) => (lineNumberPanel = node)} class={clsx(`${prefixCls}-textarea-lineNumber`, local.lineNumberClassName)} style={lineNumberStyle()} aria-hidden="true">
                    <Index each={lines()}>{(_, i) => <div class={`${prefixCls}-textarea-lineNumber-item`}>{(local.lineNumberStart ?? 1) + i}</div>}</Index>
                </div>
                <div class={`${prefixCls}-textarea-content`}>{textareaNode()}</div>
            </Show>
            <Show when={allowClear()}>
                <button
                    ref={setClearButton}
                    type="button"
                    class={`${prefixCls}-clearbtn`}
                    aria-label={locale().locale.clear}
                    // a native listener, so the foundation's stopPropagation keeps the click from outer listeners too
                    on:click={handleClearClick}
                    // keeps focus in the textarea, so clearing fires no blur
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <IconClear />
                </button>
            </Show>
            <Show when={hasCounter()}>
                <div id={counterId} class={clsx(`${prefixCls}-textarea-counter`, { [`${prefixCls}-textarea-counter-exceed`]: exceeds() })} onClick={() => foundation.handleCounterClick()}>
                    {count()}
                    <Show when={local.maxCount}>/{local.maxCount}</Show>
                </div>
            </Show>
        </div>
    );
}
