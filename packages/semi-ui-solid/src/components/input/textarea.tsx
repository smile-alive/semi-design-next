import { type JSX, type Ref, Index, Show, createEffect, createRenderEffect, createSignal, createUniqueId, mergeProps, on, onCleanup, onMount, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { throttle } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/components/input/constants';
import TextAreaFoundation, { type TextAreaAdapter } from '@fibrae/semi-foundation/components/input/textarea-foundation';
import { syncLineNumberHeights } from '@fibrae/semi-foundation/components/input/util/line-number';
import { joinIds } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/input/textarea.scss';
import { IconClear } from '@fibrae/semi-icons-solid';
import { type ElementProps, usePopupLayer, useDefaultProps, useFoundation } from '../../base/index';
import { useFocusHandover, useRaf, useResizeObserver } from '../../primitives/index';
import { autofocus, callHandler, omitFormInjected, forwardFocus, mergeRefs } from '../../utils/index';
import useLocale from '../locale/use-locale';
import { useSpecialTrigger } from '../tooltip/context';
import { useInputGroupContext } from './context';
import type { ValidateStatus } from './input';
import useControlledInput from './use-controlled-input';

const prefixCls = cssClasses.PREFIX;

export type AutosizeRow = {
    minRows?: number;
    maxRows?: number;
};

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
    /** An enclosing InputGroup's `disabled` applies when this is not set */
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
    showLineNumber?: boolean;
    lineNumberStart?: number;
    lineNumberClassName?: string;
    lineNumberStyle?: JSX.CSSProperties;
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

/** Props Semi's own components pass, kept out of the public TextAreaProps */
export interface TextAreaInternalProps extends TextAreaProps {
    /** Chat: Enter does not start a new line, Shift+Enter does */
    disabledEnterStartNewLine?: boolean;
}

export interface TextAreaState {
    value?: string;
    isFocus: boolean;
    cachedValue?: string;
}

type Foundation = TextAreaFoundation<TextAreaProps, TextAreaElementEvent<KeyboardEvent>, TextAreaElementEvent<CompositionEvent>>;
type Adapter = TextAreaAdapter<TextAreaProps, TextAreaElementEvent<KeyboardEvent>, TextAreaElementEvent<CompositionEvent>>;

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
    const defaulted = useDefaultProps('TextArea', rawProps as TextAreaInternalProps, defaultProps);

    const group = useInputGroupContext();
    const layer = usePopupLayer();
    const locale = useLocale('Input');

    const [textarea, setTextarea] = createSignal<HTMLTextAreaElement>();
    const [lineLayout, setLineLayout] = createSignal({ width: 0, height: 0 });
    let lineNumberPanel: HTMLDivElement | undefined;
    let clearButton: HTMLButtonElement | undefined;

    const inGroup = group?.layer === layer ? group : undefined;

    const props = mergeProps(defaulted, {
        get disabled() {
            return rawProps.disabled ?? inGroup?.view().disabled ?? defaulted.disabled;
        },
    });

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

    const counterId = `${createUniqueId()}-counter`;

    const focusTextarea = () => textarea()?.focus();

    const { foundation, state } = useFoundation<Foundation, Adapter, TextAreaProps, TextAreaState>(
        TextAreaFoundation,
        props,
        (view) => TextAreaFoundation.getInitialState(view),
        () => ({
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

    const textareaStyle = (): JSX.CSSProperties => ({ ...local.textareaStyle, ...TextAreaFoundation.getSizeStyle({ autosize: local.autosize, resize: local.resize, rows: props.rows }) });

    const lineNumberStyle = (): JSX.CSSProperties => {
        const { height } = lineLayout();
        return { ...local.lineNumberStyle, height: height ? `${height}px` : undefined, 'max-height': height ? `${height}px` : undefined };
    };

    const handleInput = (e: TextAreaElementEvent<InputEvent>) => {
        // Solid's input handler type narrows `target` to the textarea itself, which this event's target is
        callHandler(local.onInput as JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>, e);
        controlled.handleInput(e);
    };

    // blurring mid-composition may truncate the value to maxLength, which a controlled parent can reject
    const handleFocusOut = (e: FocusEvent & { currentTarget: HTMLDivElement }) => controlled.handleFocusOut(e, controlled.syncValue);

    const handleScroll = (e: Event & { currentTarget: HTMLTextAreaElement }) => {
        if (!local.showLineNumber) {
            return;
        }
        const { scrollTop } = e.currentTarget;
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
            maxLength={TextAreaFoundation.getNativeMaxLength(local)}
            minLength={TextAreaFoundation.getNativeMinLength(local, value())}
            placeholder={local.placeholder || undefined}
            // The content carries the text into the server HTML. What the browser shows is the property, written in
            // the ref and by syncValue: once written, the content no longer changes it
            textContent={value() ?? ''}
            // the native attribute locks typing only; `readonly` also blocks clearing. The lowercase name is the
            // boolean attribute, which the server omits when false
            readonly={local.readonly || local.readOnly}
            onCompositionEnd={controlled.handleCompositionEnd}
            onCompositionStart={foundation.handleCompositionStart}
            onCompositionUpdate={foundation.handleCompositionUpdate}
            onInput={handleInput}
            onKeyDown={foundation.handleKeyDown}
            onScroll={handleScroll}
        />
    );

    createRenderEffect(controlled.syncValue);

    createEffect(() => {
        const element = textarea();
        if (local.showLineNumber && element && lineNumberPanel && lineLayout().width) {
            syncLineNumberHeights(element, lineNumberPanel, lines());
        }
    });

    // also tracks the node, which the line number panel remounts
    createEffect(on([value, textarea], foundation.fitAutosize));

    onMount(() => {
        if (local.disabled) {
            return;
        }
        autofocus(local.autofocus, textarea());
        if (local.autofocus) {
            textarea()?.setSelectionRange(0, 0);
        }
    });

    onCleanup(() => throttledResize.cancel());

    useResizeObserver(() => (observesSize() ? textarea() : null), throttledResize);

    useResizeObserver(
        () => (local.showLineNumber ? textarea() : null),
        (entries) => {
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
            onClick={foundation.handleClick}
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
                    on:click={foundation.handleClearClick}
                    // keeps focus in the textarea, so clearing fires no blur
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <IconClear />
                </button>
            </Show>
            <Show when={hasCounter()}>
                <div id={counterId} class={clsx(`${prefixCls}-textarea-counter`, { [`${prefixCls}-textarea-counter-exceed`]: exceeds() })} onClick={foundation.handleCounterClick}>
                    {count()}
                    <Show when={local.maxCount}>/{local.maxCount}</Show>
                </div>
            </Show>
        </div>
    );
}
