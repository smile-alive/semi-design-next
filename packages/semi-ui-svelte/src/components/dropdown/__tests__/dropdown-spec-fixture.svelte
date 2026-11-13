<script lang="ts">
    import type { DropdownSpecItem, DropdownSpecProps } from '@test/specs/dropdown';
    import { ConfigProvider } from '../../config-provider';
    import { Dropdown, DropdownItem, DropdownMenu } from '../index';

    let { store }: { store: DropdownSpecProps } = $props();
</script>

{#snippet items(list: DropdownSpecItem[])}
    <DropdownMenu>
        {#each list as entry (entry.name)}
            {#if entry.submenu}
                {@const submenu = entry.submenu}
                <Dropdown motion={false} position="rightTop" trigger="click">
                    {#snippet child({ props })}
                        <DropdownItem {...props} active={entry.active} disabled={entry.disabled}>{entry.name}</DropdownItem>
                    {/snippet}
                    {#snippet content()}
                        {@render items(submenu)}
                    {/snippet}
                </Dropdown>
            {:else}
                <DropdownItem active={entry.active} disabled={entry.disabled} onclick={() => store.onItemClick?.(entry.name)}>{entry.name}</DropdownItem>
            {/if}
        {/each}
    </DropdownMenu>
{/snippet}

<ConfigProvider direction={store.direction}>
    <!-- A one-way `visible` is only the initial value in Svelte: the function binding keeps the spec's controlled value and reports requests -->
    <Dropdown
        bind:visible={() => store.visible, () => {}}
        clickToHide={store.clickToHide}
        closeOnEsc={store.closeOnEsc}
        motion={false}
        mouseEnterDelay={0}
        mouseLeaveDelay={0}
        onEscKeyDown={store.onEscKeyDown}
        onVisibleChange={store.onVisibleChange}
        selectionMode={store.selectionMode}
        showTick={store.showTick}
        trigger={store.trigger}
    >
        {#snippet child({ props })}
            <button {...props} type="button">trigger</button>
        {/snippet}
        {#snippet content()}
            {@render items(store.items)}
        {/snippet}
    </Dropdown>
    <button type="button">after</button>
</ConfigProvider>
