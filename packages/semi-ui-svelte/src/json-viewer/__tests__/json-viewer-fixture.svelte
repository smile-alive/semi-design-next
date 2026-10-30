<script lang="ts" module>
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import type { JsonViewerProps } from '../interface';

    export type Mode = 'plain' | 'custom-render' | 'empty-render' | 'search-button' | 'default-button';

    export interface FixtureStore {
        props: JsonViewerProps;
        mode: Mode;
        /** In 'search-button' mode: when the default button is drawn inside the custom one */
        show: 'open' | 'always' | 'never';
        locale?: Locale;
    }
</script>

<script lang="ts">
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import type { JsonViewerCustomRenderArgs, JsonViewerSearchButtonArgs } from '../interface';
    import JsonViewer from '../json-viewer.svelte';

    let { store, onHandle }: { store: FixtureStore; onHandle?: (handle?: ReturnType<typeof JsonViewer>) => void } = $props();

    let handle = $state<ReturnType<typeof JsonViewer>>();

    $effect(() => {
        onHandle?.(handle);
    });
</script>

{#snippet custom({ item, index, content }: JsonViewerCustomRenderArgs)}
    <b data-index={index} data-name={item.name}>{content}</b>
{/snippet}

{#snippet empty()}{/snippet}

{#snippet button({ defaultButton, showSearchBar, onToggleSearchBar, onSearch, onPrevSearch, onNextSearch, onReplace, onReplaceAll }: JsonViewerSearchButtonArgs)}
    <div>
        <output aria-label="open">{showSearchBar}</output>
        <button type="button" onclick={onToggleSearchBar}>toggle</button>
        <button
            type="button"
            onclick={() => {
                onToggleSearchBar();
                onSearch('k', true, false, true);
            }}
        >
            custom
        </button>
        <button type="button" onclick={() => onSearch('s', false, true)}>search</button>
        <button type="button" onclick={onPrevSearch}>prev</button>
        <button type="button" onclick={onNextSearch}>next</button>
        <button type="button" onclick={() => onReplace('x')}>replace</button>
        <button type="button" onclick={() => onReplaceAll('y')}>replace all</button>
        {#if store.show === 'always' || (store.show === 'open' && showSearchBar)}
            {@render defaultButton()}
        {/if}
    </div>
{/snippet}

{#snippet defaultOnly({ defaultButton }: JsonViewerSearchButtonArgs)}
    {@render defaultButton()}
{/snippet}

<LocaleProvider locale={store.locale}>
    <JsonViewer bind:this={handle} {...store.props} customRender={store.mode === 'custom-render' ? custom : store.mode === 'empty-render' ? empty : undefined} searchButton={store.mode === 'search-button' ? button : store.mode === 'default-button' ? defaultOnly : undefined} />
</LocaleProvider>
