<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { Locale } from '@fibrae/semi-foundation/locale/interface';
    import { ConfigProvider } from '../../config-provider';
    import type { TransferHandle, TransferProps, TransferSelectedHeaderSnippetProps, TransferSelectedItemSnippetProps, TransferSelectedPanelSnippetProps, TransferSourceHeaderSnippetProps, TransferSourceItemSnippetProps, TransferSourcePanelSnippetProps } from '../interface';
    import Transfer from '../transfer.svelte';

    type EmptyKind = 'text' | 'blank' | 'hidden';

    interface Spies {
        sourceHeader?: (props: TransferSourceHeaderSnippetProps) => void;
        sourceItem?: (props: TransferSourceItemSnippetProps) => void;
        selectedItem?: (props: TransferSelectedItemSnippetProps) => void;
        sourcePanel?: (props: TransferSourcePanelSnippetProps) => void;
        selectedPanel?: (props: TransferSelectedPanelSnippetProps) => void;
    }

    // A snippet is passed only when the case asks for it: an absent snippet is what leaves a slot out
    interface Case {
        props?: TransferProps;
        // Takes the place of `props.dataSource`. Changing `props` rebuilds the spread, which resets a selection the
        // transfer holds without a bound value; a field of its own leaves the spread alone.
        dataSource?: TransferProps['dataSource'];
        label?: 'bold' | 'italic';
        // 'text' is a plain element, 'button' toggles through onChange
        sourceItem?: 'text' | 'button';
        // 'handle' wraps an icon in the drag handle, 'fullPath' prints the path
        selectedItem?: 'text' | 'handle' | 'fullPath';
        sourceHeader?: boolean;
        selectedHeader?: boolean;
        // 'list' lists the shown items as buttons, 'select' picks two values, 'plain' prints a word
        sourcePanel?: 'list' | 'select' | 'plain';
        // 'list' lists the selection with remove buttons, 'sort' moves the first item down, 'plain' prints a word
        selectedPanel?: 'list' | 'sort' | 'plain';
        // 'text' fills the empty state, 'blank' is an empty snippet, 'hidden' is `false`
        emptyLeft?: EmptyKind;
        emptyRight?: EmptyKind;
        emptySearch?: EmptyKind;
        spy?: Spies;
        locale?: Locale;
        handle?: { current?: TransferHandle };
    }

    let { store }: { store: Case } = $props();

    const track = <K extends keyof Spies>(name: K, props: Parameters<NonNullable<Spies[K]>>[0]) => {
        (store.spy?.[name] as ((props: unknown) => void) | undefined)?.(props);
        return undefined;
    };

    const emptyOf = (name: 'emptyLeft' | 'emptyRight' | 'emptySearch'): Snippet | false => {
        const kind = store[name];
        if (kind === 'hidden') {
            return false;
        }
        if (kind === 'blank') {
            return blank;
        }
        return name === 'emptyLeft' ? leftText : name === 'emptyRight' ? rightText : searchText;
    };

    const snippets: TransferProps = $derived({
        ...(store.label ? { label } : {}),
        ...(store.sourceItem ? { sourceItem } : {}),
        ...(store.selectedItem ? { selectedItem } : {}),
        ...(store.sourceHeader ? { sourceHeader } : {}),
        ...(store.selectedHeader ? { selectedHeader } : {}),
        ...(store.sourcePanel ? { sourcePanel } : {}),
        ...(store.selectedPanel ? { selectedPanel } : {}),
        ...(store.emptyLeft ? { emptyLeft: emptyOf('emptyLeft') } : {}),
        ...(store.emptyRight ? { emptyRight: emptyOf('emptyRight') } : {}),
        ...(store.emptySearch ? { emptySearch: emptyOf('emptySearch') } : {}),
    });
</script>

{#snippet leftText()}<span class="custom-empty-left">No data</span>{/snippet}
{#snippet rightText()}<span class="custom-empty-right">No selection</span>{/snippet}
{#snippet searchText()}nothing{/snippet}
{#snippet blank()}{/snippet}

{#snippet label({ item }: { item: { label?: string } })}
    {#if store.label === 'italic'}
        <i>{`<${item.label}>`}</i>
    {:else}
        <b class="custom-label">{item.label}!</b>
    {/if}
{/snippet}

{#snippet sourceItem(props: TransferSourceItemSnippetProps)}
    {@const seen = track('sourceItem', props)}
    {#if store.sourceItem === 'button'}
        <button data-seen={seen} type="button" onclick={props.onChange}>{props.item.label}</button>
    {:else}
        <div class="custom-source-item">{props.item.label}</div>
    {/if}
{/snippet}

{#snippet selectedItem(props: TransferSelectedItemSnippetProps)}
    {@const seen = track('selectedItem', props)}
    {#if store.selectedItem === 'handle'}
        {#snippet grip()}<span class="custom-handle"></span>{/snippet}
        <div class="custom-selected" data-seen={seen}>
            {#if props.handle}
                {@render props.handle(grip)}
            {:else}
                {@render grip()}
            {/if}
            {props.item.label}
        </div>
    {:else if store.selectedItem === 'fullPath'}
        <div class="custom-selected" data-seen={seen}>{props.fullPath?.map((node) => node.label).join('/')}</div>
    {:else}
        <div class="custom-selected" data-seen={seen}>{props.item.label}</div>
    {/if}
{/snippet}

{#snippet sourceHeader(props: TransferSourceHeaderSnippetProps)}
    {@const seen = track('sourceHeader', props)}
    <div class="custom-source-header" data-seen={seen}>
        <span>{`Total: ${props.num}`}</span>
        {#if props.showButton}
            <button type="button" onclick={props.onAllClick}>{props.allChecked ? 'Deselect' : 'Select All'}</button>
        {/if}
    </div>
{/snippet}

{#snippet selectedHeader(props: TransferSelectedHeaderSnippetProps)}
    <div class="custom-selected-header">
        <span>{`Selected: ${props.num}`}</span>
        {#if props.showButton}
            <button type="button" onclick={props.onClear}>Clear</button>
        {/if}
    </div>
{/snippet}

{#snippet sourcePanel(props: TransferSourcePanelSnippetProps)}
    {@const seen = track('sourcePanel', props)}
    {#if store.sourcePanel === 'list'}
        <div class="custom-source-panel" data-seen={seen}>
            <button type="button" onclick={props.onAllClick}>Select All</button>
            {#each props.filterData as item (item.key)}
                <button class="custom-source-item" type="button" onclick={() => props.onSelectOrRemove(item)}>{item.label}</button>
            {/each}
        </div>
    {:else if store.sourcePanel === 'select'}
        <div class="custom-source-panel" data-seen={seen}>
            <button type="button" onclick={() => props.onSelect(['1', '2'])}>Select Multiple</button>
            <button type="button" onclick={props.onAllClick}>Select All</button>
        </div>
    {:else}
        <div data-seen={seen}>Source</div>
    {/if}
{/snippet}

{#snippet selectedPanel(props: TransferSelectedPanelSnippetProps)}
    {@const seen = track('selectedPanel', props)}
    {#if store.selectedPanel === 'list'}
        <div class="custom-selected-panel" data-seen={seen}>
            <button type="button" onclick={props.onClear}>Clear</button>
            {#each props.selectedData as item (item.key)}
                <div class="custom-item">
                    {item.label}
                    <button type="button" onclick={() => props.onRemove(item)}>Remove</button>
                </div>
            {/each}
        </div>
    {:else if store.selectedPanel === 'sort'}
        <div data-seen={seen}>
            <button type="button" onclick={() => props.onSortEnd({ oldIndex: 0, newIndex: 1 })}>Sort</button>
            {#each props.selectedData as item (item.key)}
                <span class="custom-item">{item.label}</span>
            {/each}
        </div>
    {:else}
        <div data-seen={seen}>Selected</div>
    {/if}
{/snippet}

{#snippet transfer()}
    <Transfer bind:this={() => store.handle?.current, (instance) => store.handle && (store.handle.current = instance)} {...store.props} {...snippets} dataSource={store.dataSource ?? store.props?.dataSource} />
{/snippet}

{#if store.locale}
    <ConfigProvider locale={store.locale}>
        {@render transfer()}
    </ConfigProvider>
{:else}
    {@render transfer()}
{/if}
