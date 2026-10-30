import type React from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { isEqual, omitBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/json-viewer/constants';
import JsonViewerFoundation, { type JsonViewerOptions, type JsonViewerAdapter, type SearchOptions } from '@fibrae/semi-foundation/json-viewer/foundation';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/json-viewer/json-viewer.scss';
import { IconCaseSensitive, IconChevronLeft, IconChevronRight, IconClose, IconRegExp, IconSearch, IconWholeWord } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import Button from '../button';
import ButtonGroup from '../button/button-group';
import DragMove from '../drag-move';
import Input, { type InputHandle } from '../input';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export type { JsonViewerOptions };
// the editor owns the root's content, so children and raw HTML would clash with it
export interface JsonViewerProps extends ElementProps<'div', 'onChange' | 'children' | 'dangerouslySetInnerHTML'> {
    value?: string;
    width?: number | string;
    height?: number | string;
    showSearch?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onChange?: (value: string) => void;
    options?: JsonViewerOptions;
    /**
     * Limits the search button drag bounds to the container
     * @default false
     */
    limitSearchButtonBounds?: boolean;
    /**
     * Custom search button
     * @param defaultSearchButton - Default search button
     * @param searchControls - Search state and methods
     */
    renderSearchButton?: (
        defaultSearchButton: React.ReactNode,
        searchControls: {
            showSearchBar: boolean;
            onToggleSearchBar: () => void;
            onSearch: (text: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => void;
            onPrevSearch: () => void;
            onNextSearch: () => void;
            onReplace: (text: string) => void;
            onReplaceAll: (text: string) => void;
        }
    ) => React.ReactNode;
    /** See JsonViewerHandle */
    ref?: React.Ref<JsonViewerHandle>;
}

export interface JsonViewerHandle {
    getValue: () => string;
    format: () => void;
    search: (searchText: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => void;
    getSearchResults: () => ReturnType<JsonViewerFoundation['getSearchResults']>;
    prevSearch: (step?: number) => void;
    nextSearch: (step?: number) => void;
    replace: (replaceText: string) => void;
    replaceAll: (replaceText: string) => void;
    getStyle: () => { width: number | string; height: number | string };
}

export interface JsonViewerState {
    searchOptions: SearchOptions;
    showSearchBar: boolean;
    customRenderMap: Map<HTMLElement, React.ReactNode>;
}

export type { SearchOptions };

const defaultSearchOptions: SearchOptions = { caseSensitive: false, wholeWord: false, regex: false };

const searchOptionItems = [
    { key: 'caseSensitive', icon: IconCaseSensitive },
    { key: 'regex', icon: IconRegExp },
    { key: 'wholeWord', icon: IconWholeWord },
] as const;

const defaultProps = {
    width: 400,
    height: 400,
    value: '',
    showSearch: true,
} satisfies Partial<JsonViewerProps>;

export default function JsonViewer(rawProps: JsonViewerProps) {
    const defaultedProps = useDefaultProps('JsonViewer', rawProps, defaultProps);

    const { locale } = useLocale('JsonViewer');

    // defaults merge per key: a whole-object default would be replaced by the caller's `options`. The locale-derived
    // ariaLabel is part of options, so a locale switch re-creates the editor
    const props = {
        ...defaultedProps,
        // an explicit undefined would replace a default
        options: { ariaLabel: locale.content, readOnly: false, autoWrap: true, ...omitBy(defaultedProps.options ?? {}, (option) => option === undefined) },
    };

    const { ref, value, width, height, showSearch, className, style, onChange, options, limitSearchButtonBounds, renderSearchButton, ...rest } = props;

    const editorRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<InputHandle>(null);
    const replaceInputRef = useRef<InputHandle>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const isComposingRef = useRef(false);
    const draggedRef = useRef(false);

    // a close from inside the bar unmounts the focused control, so focus returns to the trigger
    const returnFocusRef = useRef(false);

    const [foundation, state] = useFoundation<JsonViewerFoundation<typeof props, JsonViewerState>, JsonViewerAdapter<typeof props, JsonViewerState>, typeof props, JsonViewerState>(
        JsonViewerFoundation,
        props,
        () => ({ searchOptions: defaultSearchOptions, showSearchBar: false, customRenderMap: new Map() }),
        (base) => ({
            getEditorRef: () => editorRef.current,
            notifyChange: (value) => base.getProps().onChange?.(value),
            // the editor refills one Map in place; a copy lets a memoized render see the change
            setCustomRenderMap: (customRenderMap) => base.setState({ customRenderMap: new Map(customRenderMap) }),
            toggleSearchOption: (key) => {
                const { searchOptions } = base.getStates();
                base.setState({ searchOptions: { ...searchOptions, [key]: !searchOptions[key] } });
            },
            toggleSearchBar: () => {
                base.setState({ showSearchBar: !base.getStates().showSearchBar, searchOptions: defaultSearchOptions });
            },
        })
    );

    const searchControls = {
        showSearchBar: state.showSearchBar,
        onToggleSearchBar: foundation.toggleSearchBar,
        onSearch: (text: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => foundation.search(text, caseSensitive, wholeWord, regex),
        onPrevSearch: () => foundation.prevSearch(),
        onNextSearch: () => foundation.nextSearch(),
        onReplace: (text: string) => foundation.replace(text),
        onReplaceAll: (text: string) => foundation.replaceAll(text),
    };

    const closeSearchBar = () => {
        returnFocusRef.current = true;
        foundation.toggleSearchBar();
    };

    // on each control: the landmark itself takes no keyboard handler
    const closeOnEscape = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            closeSearchBar();
        }
    };

    // search and replace move focus to the editor; restore it so Esc and Tab continue from the bar
    const keepFocus = (run: () => void) => {
        const active = FocusTrapHandle.getDeepActiveElement();
        run();
        active?.focus();
    };

    const searchHandler = () => foundation.search(searchInputRef.current?.input?.value);

    const renderSearchBox = () => (
        <search className={`${prefixCls}-search-bar-container`} style={{ position: 'absolute', top: 20, right: 20 }} aria-label={locale.search}>
            <div className={`${prefixCls}-search-bar`}>
                <Input
                    ref={searchInputRef}
                    className={`${prefixCls}-search-bar-input`}
                    aria-label={locale.search}
                    placeholder={locale.search}
                    // the bar lays out a fixed row: the adornments and showClear are set so global Input defaults cannot add them
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    prefix={null}
                    suffix={null}
                    onChange={(_value, e) => {
                        e.preventDefault();
                        if (!isComposingRef.current) {
                            searchHandler();
                        }
                        searchInputRef.current?.focus();
                    }}
                    onCompositionEnd={() => {
                        isComposingRef.current = false;
                        searchHandler();
                        searchInputRef.current?.focus();
                    }}
                    onCompositionStart={() => {
                        isComposingRef.current = true;
                    }}
                    onKeyDown={closeOnEscape}
                />
                <ul className={`${prefixCls}-search-options`}>
                    {searchOptionItems.map(({ key, icon: Icon }) => (
                        <li
                            key={key}
                            className={clsx(`${prefixCls}-search-options-item`, {
                                [`${prefixCls}-search-options-item-active`]: state.searchOptions[key],
                            })}
                        >
                            <Button type="tertiary" aria-label={locale[key]} aria-pressed={state.searchOptions[key]} theme="borderless" icon={<Icon />} onClick={() => keepFocus(() => foundation.toggleSearchOption(key))} onKeyDown={closeOnEscape} />
                        </li>
                    ))}
                </ul>
                <ButtonGroup>
                    <Button
                        aria-label={locale.previousMatch}
                        icon={<IconChevronLeft />}
                        onClick={(e) => {
                            e.preventDefault();
                            keepFocus(() => foundation.prevSearch());
                        }}
                        onKeyDown={closeOnEscape}
                    />
                    <Button
                        aria-label={locale.nextMatch}
                        icon={<IconChevronRight />}
                        onClick={(e) => {
                            e.preventDefault();
                            keepFocus(() => foundation.nextSearch());
                        }}
                        onKeyDown={closeOnEscape}
                    />
                </ButtonGroup>
                <Button type="tertiary" aria-label={locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={closeSearchBar} onKeyDown={closeOnEscape} />
            </div>
            <div className={`${prefixCls}-replace-bar`}>
                <Input
                    ref={replaceInputRef}
                    className={`${prefixCls}-replace-bar-input`}
                    aria-label={locale.replace}
                    placeholder={locale.replace}
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    prefix={null}
                    suffix={null}
                    onChange={(_value, e) => {
                        e.preventDefault();
                    }}
                    onKeyDown={closeOnEscape}
                />
                <Button style={{ width: 'fit-content' }} disabled={options.readOnly} onClick={() => keepFocus(() => foundation.replace(replaceInputRef.current?.input?.value))} onKeyDown={closeOnEscape}>
                    {locale.replace}
                </Button>
                <Button style={{ width: 'fit-content' }} disabled={options.readOnly} onClick={() => keepFocus(() => foundation.replaceAll(replaceInputRef.current?.input?.value))} onKeyDown={closeOnEscape}>
                    {locale.replaceAll}
                </Button>
            </div>
        </search>
    );

    // a drag that started on the trigger ends with a click, which is swallowed; the click follows pointerup in the
    // same task, so the flag clears after it
    const onDragMove = () => {
        draggedRef.current = true;
    };

    const onDragEnd = () => {
        setTimeout(() => {
            draggedRef.current = false;
        });
    };

    const defaultSearchButton = (
        <DragMove constrainer={limitSearchButtonBounds ? 'parent' : undefined} onMouseMove={onDragMove} onMouseUp={onDragEnd} onTouchCancel={onDragEnd} onTouchEnd={onDragEnd} onTouchMove={onDragMove}>
            <div style={{ position: 'absolute', top: 0, left: width }}>
                {!state.showSearchBar ? (
                    <Button
                        ref={triggerRef}
                        className={`${prefixCls}-search-bar-trigger`}
                        style={{ position: 'absolute', top: 20, right: 20 }}
                        aria-label={locale.search}
                        icon={<IconSearch />}
                        onClick={(e) => {
                            e.preventDefault();
                            if (draggedRef.current) {
                                e.stopPropagation();
                                return;
                            }
                            foundation.toggleSearchBar();
                        }}
                    />
                ) : (
                    renderSearchBox()
                )}
            </div>
        </DragMove>
    );

    // options is usually a fresh literal, so compare deeply
    useDidUpdate(
        { value, options },
        (next, previous) => {
            // a value equal to the editor's own text is the echo of an onChange write-back: re-creating would drop the
            // caret, focus, undo stack and scroll position
            if (isEqual(next.options, previous.options) && next.value === foundation.jsonViewer?.getModel().getValue()) {
                return;
            }
            foundation.destroy();
            foundation.init();
        },
        isEqual
    );

    useEffect(() => {
        if (state.showSearchBar) {
            searchInputRef.current?.focus();
        } else if (returnFocusRef.current) {
            returnFocusRef.current = false;
            triggerRef.current?.focus();
        }
    }, [state.showSearchBar]);

    useImperativeHandle(
        ref,
        () => ({
            getValue: () => foundation.jsonViewer.getModel().getValue(),
            format: () => foundation.jsonViewer.format(),
            search: foundation.search,
            getSearchResults: foundation.getSearchResults,
            prevSearch: foundation.prevSearch,
            nextSearch: foundation.nextSearch,
            replace: foundation.replace,
            replaceAll: foundation.replaceAll,
            getStyle: () => ({ width: foundation.getProps().width, height: foundation.getProps().height }),
        }),
        [foundation]
    );

    return (
        <>
            <div role={namedRole(rest)} {...rest} className={className} style={{ width, height, position: 'relative', ...style }}>
                <div ref={editorRef} className={clsx(prefixCls, `${prefixCls}-background`)} style={{ width, height }} />
                {showSearch && (renderSearchButton ? renderSearchButton(defaultSearchButton, searchControls) : defaultSearchButton)}
            </div>
            {Array.from(state.customRenderMap, ([el, node]) => createPortal(node, el))}
        </>
    );
}
