<script lang="ts">
    import { tick } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { omitBy } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/json-viewer/constants';
    import JsonViewerFoundation, { type JsonViewerAdapter, type JsonViewerBaseProps, type JsonViewerBaseState, type JsonViewerOptions as CoreOptions } from '@fibrae/semi-foundation/components/json-viewer/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/components/json-viewer/json-viewer.scss';
    import useDefaultProps from '../../base/use-default-props.js';
    import useFoundation from '../../base/use-foundation.svelte.js';
    import { groupRole } from '../../utils/group-role.js';
    import teleport from '../../utils/teleport.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { setJsonViewerContext } from './context.js';
    import type { JsonViewerCustomRenderArgs, JsonViewerOptions, JsonViewerProps } from './interface.js';
    import SearchButton from './search-button.svelte';

    type Foundation = JsonViewerFoundation<JsonViewerBaseProps>;
    type Adapter = JsonViewerAdapter<JsonViewerBaseProps>;

    interface CustomRenderEntry extends JsonViewerCustomRenderArgs {
        id: number;
        el: HTMLElement;
    }

    const defaults = useDefaultProps('JsonViewer');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let { value = $bindable(), width = defaults('width', 400), height = defaults('height', 400), showSearch = defaults('showSearch', true), options = defaults('options'), limitSearchButtonBounds = defaults('limitSearchButtonBounds', false), onChange, customRender, searchButton, ...rest }: JsonViewerProps = $props();

    const locale = useLocale('JsonViewer');

    let editor = $state<HTMLDivElement>();

    // every layout rebuilds the spans, so a fresh id remounts each custom render on its new span
    let customRenderEntries = $state.raw<CustomRenderEntry[]>([]);
    let nextEntryId = 0;

    const prefix = cssClasses.PREFIX;

    // merged per key: a whole-object default would be replaced by any caller `options`; the locale-derived ariaLabel is
    // part of the options, so a locale switch re-creates the editor
    const mergedOptions = $derived<JsonViewerOptions>({
        ariaLabel: locale().locale.content,
        readOnly: false,
        autoWrap: true,
        // an explicit undefined would replace a default
        ...omitBy(options ?? {}, (option) => option === undefined),
    });

    const sizeStyle = $derived(`width: ${toCssLength(width)}; height: ${toCssLength(height)}`);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: JsonViewerBaseProps = {
        get value() {
            return value ?? '';
        },
        get options() {
            return mergedOptions as CoreOptions;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, JsonViewerBaseProps, JsonViewerBaseState>(
        JsonViewerFoundation,
        foundationProps,
        () => JsonViewerFoundation.getInitialState(),
        () => ({
            getEditorRef: () => editor as HTMLDivElement,
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
                // a setter that refuses or rewrites the text leaves the prop different from the editor
                void tick().then(() => foundation.syncEditor());
            },
            // The core hands a rule's render result back after layout; returning the snippet arguments lets `customRender` draw it.
            toCoreOptions: (coreOptions) => {
                const { customRenderRule, ...coreRest } = coreOptions as JsonViewerOptions;
                return {
                    ...coreRest,
                    ...(customRenderRule && {
                        customRenderRule: customRenderRule.map((item, index) => ({
                            match: item.match,
                            render: (content: string): JsonViewerCustomRenderArgs => ({ item, index, content }),
                        })),
                    }),
                };
            },
            setCustomRenderMap: (map: Map<HTMLElement, JsonViewerCustomRenderArgs>) => {
                customRenderEntries = Array.from(map, ([el, args]) => ({ ...args, id: nextEntryId++, el }));
            },
        })
    );

    const searchControls = {
        onToggleSearchBar: foundation.toggleSearchBar,
        onSearch: (text: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) => foundation.search(text, caseSensitive, wholeWord, regex),
        onPrevSearch: () => foundation.prevSearch(),
        onNextSearch: () => foundation.nextSearch(),
        onReplace: (text: string) => foundation.replace(text),
        onReplaceAll: (text: string) => foundation.replaceAll(text),
    };

    setJsonViewerContext({
        get showSearchBar() {
            return states().showSearchBar;
        },
        get searchOptions() {
            return states().searchOptions;
        },
        get readOnly() {
            return Boolean(mergedOptions.readOnly);
        },
        get width() {
            return width;
        },
        get limitSearchButtonBounds() {
            return limitSearchButtonBounds;
        },
        search: (text) => foundation.search(text),
        prevSearch: () => foundation.prevSearch(),
        nextSearch: () => foundation.nextSearch(),
        replace: foundation.replace,
        replaceAll: foundation.replaceAll,
        toggleSearchOption: foundation.toggleSearchOption,
        toggleSearchBar: foundation.toggleSearchBar,
    });

    // An empty snippet draws nothing, so the token keeps its text. shortcut: decided once when the token is laid out; a
    // snippet that starts drawing later leaves the text next to its content, upgrade with a MutationObserver if needed
    const keepTokenText =
        (content: string): Attachment<HTMLElement> =>
        (node) => {
            queueMicrotask(() => {
                const drawn = node.children.length > 0 || Boolean(node.textContent);
                if (node.isConnected && !drawn) {
                    node.append(content);
                }
            });
        };

    export function getValue() {
        return foundation.jsonViewer?.getModel().getValue() ?? '';
    }

    export function format() {
        foundation.jsonViewer?.format();
    }

    export function search(searchText: string, caseSensitive?: boolean, wholeWord?: boolean, regex?: boolean) {
        foundation.search(searchText, caseSensitive, wholeWord, regex);
    }

    export function getSearchResults(): ReturnType<JsonViewerFoundation['getSearchResults']> {
        return foundation.getSearchResults();
    }

    export function prevSearch(step?: number) {
        foundation.prevSearch(step);
    }

    export function nextSearch(step?: number) {
        foundation.nextSearch(step);
    }

    export function replace(replaceText: string) {
        foundation.replace(replaceText);
    }

    export function replaceAll(replaceText: string) {
        foundation.replaceAll(replaceText);
    }

    export function getStyle() {
        return { width, height };
    }
</script>

<div {...rest} role={groupRole(rest)} style={[sizeStyle, 'position: relative', rest.style].filter(Boolean).join('; ')}>
    <div bind:this={editor} class={[prefix, `${prefix}-background`]} style={sizeStyle}></div>
    {#if showSearch}
        {#if searchButton}
            {@render searchButton({ defaultButton, showSearchBar: states().showSearchBar, ...searchControls })}
        {:else}
            <SearchButton />
        {/if}
    {/if}
    <!-- the core owns the editor DOM; each custom render is moved into the span it leaves for a matched token -->
    {#each customRenderEntries as entry (entry.id)}
        <span {@attach teleport(entry.el)} {@attach keepTokenText(entry.content)} style="display: contents">
            {@render customRender?.({ item: entry.item, index: entry.index, content: entry.content })}
        </span>
    {/each}
</div>

{#snippet defaultButton()}
    <SearchButton />
{/snippet}
