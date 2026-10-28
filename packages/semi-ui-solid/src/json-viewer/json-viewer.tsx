import { type JSX, type Ref, For, Show, createEffect, createMemo, createRenderEffect, createRoot, createSignal, getOwner, mergeProps, on, splitProps } from 'solid-js';
import { insert } from 'solid-js/web';
import clsx from 'clsx';
import { isEqual, omitBy } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/json-viewer/constants';
import JsonViewerFoundation, { type CustomRenderRule, type JsonViewerAdapter, type JsonViewerBaseProps, type JsonViewerBaseState, type JsonViewerOptions as CoreOptions, type SearchOptions } from '@fibrae/semi-foundation/json-viewer/foundation';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import '@fibrae/semi-foundation/json-viewer/json-viewer.scss';
import { IconCaseSensitive, IconChevronLeft, IconChevronRight, IconClose, IconRegExp, IconSearch, IconWholeWord } from '@fibrae/semi-icons-solid';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import Button, { ButtonGroup } from '../button';
import DragMove from '../drag-move';
import Input from '../input';
import useLocale from '../locale/use-locale';

const prefixCls = cssClasses.PREFIX;

export type { SearchOptions };

export interface JsonViewerCustomRenderRule extends Omit<CustomRenderRule, 'render'> {
    /** A result of null, undefined or false keeps the token text */
    render: (content: string) => JSX.Element;
}

export interface JsonViewerOptions extends Omit<CoreOptions, 'customRenderRule'> {
    customRenderRule?: JsonViewerCustomRenderRule[];
}

export interface JsonViewerSearchControls {
    readonly showSearchBar: boolean;
    onToggleSearchBar: () => void;
    onSearch: (text: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => void;
    onPrevSearch: () => void;
    onNextSearch: () => void;
    onReplace: (text: string) => void;
    onReplaceAll: (text: string) => void;
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

export type JsonViewerElement = HTMLDivElement & JsonViewerHandle;

// the editor owns the root's content, so children and raw HTML would clash with it
export interface JsonViewerProps extends ElementProps<'div', 'onChange' | 'children' | 'innerHTML' | 'textContent' | 'ref'> {
    value?: string;
    width?: number | string;
    height?: number | string;
    showSearch?: boolean;
    onChange?: (value: string) => void;
    options?: JsonViewerOptions;
    /**
     * Limits the search button drag bounds to the container
     * @default false
     */
    limitSearchButtonBounds?: boolean;
    /**
     * Custom search button. It runs once, so `searchControls.showSearchBar` is a live getter: read it inside the
     * returned JSX
     * @param defaultSearchButton - Creates the default search button; call it where the button is inserted
     * @param searchControls - Search state and methods
     */
    renderSearchButton?: (defaultSearchButton: () => JSX.Element, searchControls: JsonViewerSearchControls) => JSX.Element;
    /** The root element with the JsonViewerHandle methods */
    ref?: Ref<JsonViewerElement>;
}

/** A custom render result inside its own root, mounted into the span the editor leaves for the token */
interface CustomRenderEntry {
    mount: (element: HTMLElement) => void;
    dispose: () => void;
}

type FoundationProps = Omit<JsonViewerProps, 'options'> & JsonViewerBaseProps;
type Foundation = JsonViewerFoundation<FoundationProps>;
type Adapter = JsonViewerAdapter<FoundationProps>;

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

// namedRole yields a plain string, which the typed role attribute does not accept
type Role = JSX.HTMLAttributes<HTMLDivElement>['role'];

export default function JsonViewer(rawProps: JsonViewerProps) {
    const props = useDefaultProps('JsonViewer', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['class', 'height', 'limitSearchButtonBounds', 'onChange', 'options', 'ref', 'renderSearchButton', 'showSearch', 'style', 'value', 'width']);

    const locale = useLocale('JsonViewer');

    let dragged = false;
    let editor: HTMLDivElement | undefined;
    let searchInput: HTMLInputElement | undefined;
    let replaceInput: HTMLInputElement | undefined;
    let trigger: HTMLButtonElement | undefined;

    // a close from inside the bar removes the focused control, so focus returns to the trigger
    let returnFocus = false;
    let mountedEntries: CustomRenderEntry[] = [];

    // custom render roots inherit the context of the viewer, not of the editor's layout call
    const owner = getOwner();

    // defaults merge per key: a whole-object default would be replaced by the caller's `options`. The locale-derived
    // ariaLabel is part of options, so a locale switch re-creates the editor
    const mergedOptions = createMemo(
        (): JsonViewerOptions => ({
            ariaLabel: locale().locale.content,
            readOnly: false,
            autoWrap: true,
            // an explicit undefined would replace a default
            ...omitBy(local.options ?? {}, (option) => option === undefined),
        }),
        undefined,
        { equals: isEqual }
    );

    // options is usually a fresh literal, so compare deeply
    const editorInput = createMemo(() => ({ value: local.value, options: mergedOptions() }), undefined, { equals: isEqual });

    // The editor calls `render` while laying out and keeps what it returns, so each result gets its own root; the
    // owner's context reaches it, and the root is released when the editor lays out again
    const renderCustom = (rule: JsonViewerCustomRenderRule, content: string) =>
        createRoot((dispose): CustomRenderEntry | null => {
            const result = rule.render(content);
            if (result == null || result === false) {
                dispose();
                return null;
            }
            const [target, setTarget] = createSignal<HTMLElement>();
            createRenderEffect(() => {
                const element = target();
                if (element) {
                    insert(element, result);
                }
            });
            return {
                mount: setTarget,
                dispose: () => {
                    target()?.replaceChildren();
                    dispose();
                },
            };
        }, owner ?? undefined);

    const coreOptions = (): CoreOptions => {
        const { customRenderRule, ...options } = mergedOptions();
        return { ...options, ...(customRenderRule && { customRenderRule: customRenderRule.map((rule) => ({ match: rule.match, render: (content: string) => renderCustom(rule, content) })) }) };
    };

    const foundationProps = mergeProps(props, {
        get options() {
            return coreOptions();
        },
    }) as FoundationProps;

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, JsonViewerBaseState>(
        JsonViewerFoundation,
        foundationProps,
        () => ({ searchOptions: defaultSearchOptions, showSearchBar: false }),
        (base) => ({
            getEditorRef: () => editor as HTMLDivElement,
            notifyChange: (value) => local.onChange?.(value),
            setCustomRenderMap: (map: Map<HTMLElement, CustomRenderEntry>) => {
                for (const entry of mountedEntries) {
                    entry.dispose();
                }
                mountedEntries = [];
                for (const [element, entry] of map) {
                    entry.mount(element);
                    mountedEntries.push(entry);
                }
            },
            toggleSearchOption: (key) => {
                const { searchOptions } = base.getStates();
                base.setState({ searchOptions: { ...searchOptions, [key]: !searchOptions[key] } });
            },
            toggleSearchBar: () => {
                base.setState({ showSearchBar: !base.getStates().showSearchBar, searchOptions: defaultSearchOptions });
            },
        })
    );

    const searchControls: JsonViewerSearchControls = {
        get showSearchBar() {
            return state().showSearchBar;
        },
        onToggleSearchBar: () => foundation.toggleSearchBar(),
        onSearch: (text, caseSensitive, wholeWord, regex) => foundation.search(text, caseSensitive, wholeWord, regex),
        onPrevSearch: () => foundation.prevSearch(),
        onNextSearch: () => foundation.nextSearch(),
        onReplace: (text) => foundation.replace(text),
        onReplaceAll: (text) => foundation.replaceAll(text),
    };

    const handle: JsonViewerHandle = {
        getValue: () => foundation.jsonViewer?.getModel().getValue() ?? '',
        format: () => foundation.jsonViewer?.format(),
        search: (searchText, caseSensitive, wholeWord, regex) => foundation.search(searchText, caseSensitive, wholeWord, regex),
        getSearchResults: () => foundation.getSearchResults(),
        prevSearch: (step) => foundation.prevSearch(step),
        nextSearch: (step) => foundation.nextSearch(step),
        replace: (replaceText) => foundation.replace(replaceText),
        replaceAll: (replaceText) => foundation.replaceAll(replaceText),
        getStyle: () => ({ width: local.width, height: local.height }),
    };

    const sizeStyle = () => ({ width: toCssLength(local.width), height: toCssLength(local.height) });

    const rootStyle = () => mergeStyles(sizeStyle(), { position: 'relative' }, local.style);

    const closeSearchBar = () => {
        returnFocus = true;
        foundation.toggleSearchBar();
    };

    // on each control: the landmark itself takes no keyboard handler. The claim is preventDefault, which layers
    // listening on document (Modal, Tooltip) read; stopPropagation keeps ancestors' JSX handlers out of it
    const closeOnEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
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

    const searchFromInput = () => foundation.search(searchInput?.value ?? '');

    const searchBox = () => (
        <search class={`${prefixCls}-search-bar-container`} style={{ position: 'absolute', top: '20px', right: '20px' }} aria-label={locale().locale.search}>
            <div class={`${prefixCls}-search-bar`}>
                <Input
                    inputRef={(node) => (searchInput = node)}
                    class={`${prefixCls}-search-bar-input`}
                    aria-label={locale().locale.search}
                    placeholder={locale().locale.search}
                    // the bar lays out a fixed row: the adornments and showClear are set so global Input defaults cannot add them
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    prefix={null}
                    suffix={null}
                    // searches once after an IME composition ends
                    composition
                    onChange={(_value, e) => {
                        e.preventDefault();
                        searchFromInput();
                        searchInput?.focus();
                    }}
                    onKeyDown={closeOnEscape}
                />
                <ul class={`${prefixCls}-search-options`}>
                    <For each={searchOptionItems}>
                        {(item) => (
                            <li class={clsx(`${prefixCls}-search-options-item`, { [`${prefixCls}-search-options-item-active`]: state().searchOptions[item.key] })}>
                                <Button type="tertiary" aria-label={locale().locale[item.key]} aria-pressed={state().searchOptions[item.key]} theme="borderless" icon={<item.icon />} onClick={() => keepFocus(() => foundation.toggleSearchOption(item.key))} onKeyDown={closeOnEscape} />
                            </li>
                        )}
                    </For>
                </ul>
                <ButtonGroup>
                    <Button
                        aria-label={locale().locale.previousMatch}
                        icon={<IconChevronLeft />}
                        onClick={(e) => {
                            e.preventDefault();
                            keepFocus(() => foundation.prevSearch());
                        }}
                        onKeyDown={closeOnEscape}
                    />
                    <Button
                        aria-label={locale().locale.nextMatch}
                        icon={<IconChevronRight />}
                        onClick={(e) => {
                            e.preventDefault();
                            keepFocus(() => foundation.nextSearch());
                        }}
                        onKeyDown={closeOnEscape}
                    />
                </ButtonGroup>
                <Button type="tertiary" aria-label={locale().locale.close} size="small" theme="borderless" icon={<IconClose />} onClick={closeSearchBar} onKeyDown={closeOnEscape} />
            </div>
            <div class={`${prefixCls}-replace-bar`}>
                <Input
                    inputRef={(node) => (replaceInput = node)}
                    class={`${prefixCls}-replace-bar-input`}
                    aria-label={locale().locale.replace}
                    placeholder={locale().locale.replace}
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
                <Button style={{ width: 'fit-content' }} disabled={mergedOptions().readOnly} onClick={() => keepFocus(() => foundation.replace(replaceInput?.value ?? ''))} onKeyDown={closeOnEscape}>
                    {locale().locale.replace}
                </Button>
                <Button style={{ width: 'fit-content' }} disabled={mergedOptions().readOnly} onClick={() => keepFocus(() => foundation.replaceAll(replaceInput?.value ?? ''))} onKeyDown={closeOnEscape}>
                    {locale().locale.replaceAll}
                </Button>
            </div>
        </search>
    );

    // a drag that started on the trigger ends with a click, which is swallowed; the click follows pointerup in the
    // same task, so the flag clears after it
    const onDragMove = () => {
        dragged = true;
    };

    const onDragEnd = () => {
        setTimeout(() => {
            dragged = false;
        });
    };

    const defaultSearchButton = () => (
        <DragMove constrainer={local.limitSearchButtonBounds ? 'parent' : undefined} onMouseMove={onDragMove} onMouseUp={onDragEnd} onTouchCancel={onDragEnd} onTouchEnd={onDragEnd} onTouchMove={onDragMove}>
            <div style={{ position: 'absolute', top: '0px', left: toCssLength(local.width) }}>
                <Show when={!state().showSearchBar} fallback={searchBox()}>
                    <Button
                        ref={(node) => (trigger = node)}
                        class={`${prefixCls}-search-bar-trigger`}
                        style={{ position: 'absolute', top: '20px', right: '20px' }}
                        aria-label={locale().locale.search}
                        icon={<IconSearch />}
                        onClick={(e) => {
                            e.preventDefault();
                            if (dragged) {
                                e.stopPropagation();
                                return;
                            }
                            foundation.toggleSearchBar();
                        }}
                    />
                </Show>
            </div>
        </DragMove>
    );

    createEffect(
        on(editorInput, (next, previous) => {
            // the first run is the creation onMount already did
            if (!previous) {
                return;
            }
            // a value equal to the editor's own text is the echo of an onChange write-back: re-creating would drop the
            // caret, focus, undo stack and scroll position
            if (isEqual(next.options, previous.options) && next.value === foundation.jsonViewer?.getModel().getValue()) {
                return;
            }
            foundation.destroy();
            foundation.init();
        })
    );

    createEffect(
        on(
            createMemo(() => state().showSearchBar),
            (shown) => {
                if (shown) {
                    searchInput?.focus();
                } else if (returnFocus) {
                    returnFocus = false;
                    trigger?.focus();
                }
            },
            { defer: true }
        )
    );

    return (
        // the methods read the editor only when called, so they ride on the root before the editor exists
        <div {...rest} ref={(node) => mergeRefs(local.ref)(Object.assign(node, handle))} role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as Role} class={local.class} style={rootStyle()}>
            <div ref={(node) => (editor = node)} class={clsx(prefixCls, `${prefixCls}-background`)} style={sizeStyle()} />
            <Show when={local.showSearch}>
                <Show keyed when={local.renderSearchButton} fallback={defaultSearchButton()}>
                    {/* the button is created only where the render function calls defaultSearchButton */}
                    {(render) => render(defaultSearchButton, searchControls)}
                </Show>
            </Show>
        </div>
    );
}
