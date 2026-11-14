import type React from 'react';
import { useCallback, useEffect, useImperativeHandle, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import clsx from 'clsx';
import { throttle } from 'es-toolkit';
import { type ValidateStatus, FocusTrapHandle } from '@fibrae/semi-foundation/base';
import { cssClasses, type TextAreaPart } from '@fibrae/semi-foundation/components/input/constants';
import TextAreaFoundation, { type TextAreaAdapter, type TextAreaBaseState } from '@fibrae/semi-foundation/components/input/textarea-foundation';
import { syncLineNumberHeights } from '@fibrae/semi-foundation/components/input/util/line-number';
import { joinIds } from '@fibrae/semi-foundation/utils';
import '@fibrae/semi-foundation/components/input/textarea.scss';
import { IconClear } from '@fibrae/semi-icons-react';
import { useDefaultProps, useFoundation } from '../../base/index';
import { useResizeObserver } from '../../hooks/index';
import ReactResizeObserver from '../../internal/resize-observer';
import useLocale from '../locale/use-locale';
import { useInputGroupInScope, withInputGroupDisabled } from './context';

type Foundation = TextAreaFoundation<TextAreaProps, React.KeyboardEvent<HTMLTextAreaElement>, React.CompositionEvent<HTMLTextAreaElement>>;
type Adapter = TextAreaAdapter<TextAreaProps, React.KeyboardEvent<HTMLTextAreaElement>, React.CompositionEvent<HTMLTextAreaElement>>;

const prefixCls = cssClasses.PREFIX;

type OmitTextareaAttr = 'onChange' | 'onInput' | 'prefix' | 'size' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onKeyUp' | 'onResize';

export type AutosizeRow = {
    minRows?: number;
    maxRows?: number;
};

export interface TextAreaHandle {
    focus(options?: FocusOptions): void;
    blur(): void;
    select(): void;
    setSelectionRange(start: number | null, end: number | null, direction?: 'forward' | 'backward' | 'none'): void;
    readonly textarea: HTMLTextAreaElement | null;
    readonly nativeElement: HTMLElement | null;
}

/**
 * What `onChange` receives: typing, an IME composition ending, the clear button, or the native blur event when
 * blurring mid-composition truncates the value to `maxLength`
 */
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement> | React.CompositionEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLDivElement>;

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, OmitTextareaAttr> {
    autosize?: boolean | AutosizeRow;
    borderless?: boolean;
    placeholder?: string;
    value?: string;
    rows?: number;
    cols?: number;
    maxCount?: number;
    validateStatus?: ValidateStatus;
    defaultValue?: string;
    disabled?: boolean;
    readonly?: boolean;
    autoFocus?: boolean;
    showCounter?: boolean;
    showClear?: boolean;
    onClear?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onChange?: (value: string, e: TextAreaChangeEvent) => void;
    /** Listens on the wrapper: focus moving between the textarea and its clear button does not fire it */
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
    onInput?: (e: React.InputEvent<HTMLTextAreaElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onEnterPress?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    /**
     * Called when the size changes: the border-box height in `autosize` mode, a drag of the resize handle in native
     * `resize` mode.
     */
    onResize?: (data: { height: number; width?: number }) => void;
    getValueLength?: (value: string) => number;
    showLineNumber?: boolean;
    lineNumberStart?: number;
    classNames?: Partial<Record<TextAreaPart, string>>;
    styles?: Partial<Record<TextAreaPart, CSSProperties>>;
    /** When enabled, onChange fires once after an IME composition ends, not during it */
    composition?: boolean;
    /**
     * Whether and in which direction the textarea is resizable; ignored with autosize, applied only when provided
     */
    resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline';
    /** Other HTML attributes go to the native textarea, className and style to the wrapper */
    ref?: React.Ref<TextAreaHandle>;
}

/** Props Semi's own components pass, kept out of the public TextAreaProps */
export interface TextAreaInternalProps extends TextAreaProps {
    /** Chat: Enter does not start a new line, Shift+Enter does */
    disabledEnterStartNewLine?: boolean;
}

export interface TextAreaState extends TextAreaBaseState {}

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

// outside the component: the Compiler cannot lower getters in an object literal. The getters report the current
// node, as showLineNumber remounts the textarea
function createHandle(textareaRef: React.RefObject<HTMLTextAreaElement | null>, rootRef: React.RefObject<HTMLDivElement | null>): TextAreaHandle {
    return {
        focus: (options) => textareaRef.current?.focus(options),
        blur: () => textareaRef.current?.blur(),
        select: () => textareaRef.current?.select(),
        setSelectionRange: (start, end, direction) => textareaRef.current?.setSelectionRange(start, end, direction),
        get textarea() {
            return textareaRef.current;
        },
        get nativeElement() {
            return rootRef.current;
        },
    };
}

export default function TextArea(rawProps: TextAreaProps) {
    const props = useDefaultProps('TextArea', withInputGroupDisabled(rawProps, useInputGroupInScope()), defaultProps);

    const {
        ref,
        autosize,
        placeholder,
        onEnterPress,
        onResize,
        resize,
        disabled,
        readonly,
        className,
        showCounter,
        validateStatus,
        maxCount,
        defaultValue,
        value: valueProp,
        style,
        classNames,
        styles,
        getValueLength,
        maxLength,
        minLength,
        showClear,
        onClear,
        borderless,
        autoFocus,
        showLineNumber,
        lineNumberStart,
        composition,
        disabledEnterStartNewLine,
        onChange,
        onFocus,
        onBlur,
        onKeyDown,
        onCompositionStart,
        onCompositionEnd,
        onCompositionUpdate,
        insetLabel,
        insetLabelId,
        ...rest
    } = props as TextAreaInternalProps & { insetLabel?: unknown; insetLabelId?: unknown };

    const { locale } = useLocale('Input');

    const counterId = useId();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const [lineLayout, setLineLayout] = useState({ width: 0, height: 0 });
    const lineNumberRef = useRef<HTMLDivElement>(null);
    let lineNumbers: React.ReactNode = null;

    const [foundation, state] = useFoundation<Foundation, Adapter, TextAreaProps, TextAreaState>(
        TextAreaFoundation,
        props,
        () => TextAreaFoundation.getInitialState(props),
        (base) => ({
            notifyChange: (value, e: TextAreaChangeEvent) => base.getProps().onChange?.(value, e),
            notifyClear: (e) => base.getProps().onClear?.(e),
            notifyBlur: (_value, e) => base.getProps().onBlur?.(e),
            notifyFocus: (_value, e) => base.getProps().onFocus?.(e),
            notifyKeyDown: (e) => base.getProps().onKeyDown?.(e),
            notifyResize: (size) => base.getProps().onResize?.(size),
            notifyEnterPress: (e) => base.getProps().onEnterPress?.(e),
            notifyCompositionStart: (e) => base.getProps().onCompositionStart?.(e),
            notifyCompositionEnd: (e) => base.getProps().onCompositionEnd?.(e),
            notifyCompositionUpdate: (e) => base.getProps().onCompositionUpdate?.(e),
            focusInput: () => textareaRef.current?.focus(),
            getTextarea: () => textareaRef.current,
        })
    );

    const [throttledResize] = useState(() => throttle(foundation.handleResize, 10));

    const value = TextAreaFoundation.deriveValue(props, state);

    // a removed node fires no blur: without this the focus would fall to the body while the TextArea stays focused
    const setClearButton = useCallback(
        (node: HTMLButtonElement) => () => {
            if (node === FocusTrapHandle.getActiveElement(node)) {
                textareaRef.current?.focus();
            }
        },
        []
    );

    const handleTextAreaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (showLineNumber && lineNumberRef.current) {
            const scrollTop = e.currentTarget.scrollTop;
            // rAF avoids layout thrash
            requestAnimationFrame(() => {
                if (lineNumberRef.current) {
                    lineNumberRef.current.scrollTop = scrollTop;
                }
            });
        }
    };

    useEffect(() => () => throttledResize.cancel(), [throttledResize]);

    useResizeObserver(
        textareaRef,
        (entries) => {
            // contentRect excludes borders, matching textarea.clientHeight
            const { width, height } = entries.at(-1).contentRect;
            setLineLayout({ width, height });
        },
        { enabled: showLineNumber }
    );

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        const panel = lineNumberRef.current;
        if (!textarea || !panel || !lineLayout.width) {
            return;
        }
        syncLineNumberHeights(textarea, panel, value ? value.split('\n') : ['']);
    }, [lineLayout, value]);

    // the line number panel remounts the textarea
    useLayoutEffect(() => {
        foundation.fitAutosize();
    }, [foundation, value, showLineNumber]);

    useImperativeHandle(ref, () => createHandle(textareaRef, rootRef), []);

    if (showLineNumber) {
        const { height } = lineLayout;
        const lines = value ? value.split('\n') : [''];
        lineNumbers = (
            <div
                ref={lineNumberRef}
                className={clsx(`${prefixCls}-textarea-lineNumber`, classNames?.lineNumber)}
                // capped at the textarea height so the panel does not expand it
                style={{
                    ...styles?.lineNumber,
                    height: height ? `${height}px` : undefined,
                    maxHeight: height ? `${height}px` : undefined,
                }}
                // decorative: screen readers would read every number before the textarea
                aria-hidden="true"
            >
                {lines.map((_, i) => (
                    <div key={i} className={`${prefixCls}-textarea-lineNumber-item`}>
                        {lineNumberStart + i}
                    </div>
                ))}
            </div>
        );
    }

    const hasResizeProp = resize !== undefined;

    // horizontal resize needs a shrink-to-fit wrapper so the border, clear button and counter follow
    const isResizableX = !autosize && hasResizeProp && ['horizontal', 'both', 'inline'].includes(resize);
    const isResizableY = !autosize && hasResizeProp && ['vertical', 'both', 'block'].includes(resize);

    const wrapperCls = clsx(className, `${prefixCls}-textarea-wrapper`, {
        [`${prefixCls}-textarea-borderless`]: borderless,
        [`${prefixCls}-textarea-wrapper-disabled`]: disabled,
        [`${prefixCls}-textarea-wrapper-readonly`]: readonly,
        [`${prefixCls}-textarea-wrapper-${validateStatus}`]: Boolean(validateStatus),
        [`${prefixCls}-textarea-wrapper-focus`]: state.isFocus,
        [`${prefixCls}-textarea-wrapper-withLineNumber`]: showLineNumber,
        [`${prefixCls}-textarea-wrapper-resizeX`]: isResizableX,
        [`${prefixCls}-textarea-wrapper-resizeY`]: isResizableY,
    });

    const itemCls = clsx(
        `${prefixCls}-textarea`,
        {
            [`${prefixCls}-textarea-disabled`]: disabled,
            [`${prefixCls}-textarea-readonly`]: readonly,
            [`${prefixCls}-textarea-autosize`]: Boolean(autosize),
            [`${prefixCls}-textarea-showClear`]: showClear,
        },
        classNames?.textarea
    );

    const mergedTextareaStyle: CSSProperties = { ...styles?.textarea, ...TextAreaFoundation.getSizeStyle({ autosize, resize, rows: props.rows }) };
    const current = showCounter || maxCount ? TextAreaFoundation.getValueCount(value, getValueLength) : 0;
    const exceeds = Boolean(maxCount) && current > maxCount;

    let textareaNode = (
        <textarea
            {...rest}
            ref={textareaRef}
            className={itemCls}
            style={mergedTextareaStyle}
            aria-describedby={joinIds(rest['aria-describedby'], (showCounter || maxCount) && counterId)}
            aria-invalid={validateStatus === 'error' || exceeds ? 'true' : rest['aria-invalid']}
            autoFocus={autoFocus || (rest as { autofocus?: boolean }).autofocus}
            disabled={disabled}
            maxLength={TextAreaFoundation.getNativeMaxLength({ maxLength, getValueLength })}
            minLength={TextAreaFoundation.getNativeMinLength(props, value)}
            placeholder={placeholder || undefined}
            // the native attribute locks typing only; `readonly` also blocks clearing
            readOnly={readonly || rest.readOnly}
            value={value ?? ''}
            onChange={(e) => foundation.handleChange(e.target.value, e)}
            onCompositionEnd={foundation.handleCompositionEnd}
            onCompositionStart={foundation.handleCompositionStart}
            onCompositionUpdate={foundation.handleCompositionUpdate}
            onKeyDown={foundation.handleKeyDown}
            onScroll={handleTextAreaScroll}
        />
    );

    const shouldObserveNativeResize = !autosize && hasResizeProp && resize && resize !== 'none';

    if (autosize || shouldObserveNativeResize) {
        textareaNode = <ReactResizeObserver onResize={throttledResize}>{textareaNode}</ReactResizeObserver>;
    }

    let counter: React.ReactNode = null;

    if (showCounter || maxCount) {
        const total = maxCount || null;
        counter = (
            <div
                id={counterId}
                className={clsx(`${prefixCls}-textarea-counter`, {
                    [`${prefixCls}-textarea-counter-exceed`]: exceeds,
                })}
                onClick={foundation.handleCounterClick}
            >
                {current}
                {Boolean(total) && '/'}
                {total}
            </div>
        );
    }

    return (
        <div ref={rootRef} className={wrapperCls} style={style} onBlur={foundation.handleBlur} onClick={foundation.handleClick} onFocus={foundation.handleFocus}>
            {lineNumbers}
            {showLineNumber ? <div className={`${prefixCls}-textarea-content`}>{textareaNode}</div> : textareaNode}
            {TextAreaFoundation.isAllowClear(props, value) && (
                <button
                    ref={setClearButton}
                    type="button"
                    className={`${prefixCls}-clearbtn`}
                    aria-label={locale.clear}
                    onClick={foundation.handleClearClick}
                    // keeps focus in the textarea, so clearing fires no blur
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <IconClear />
                </button>
            )}
            {counter}
        </div>
    );
}
