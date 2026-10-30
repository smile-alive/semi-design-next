<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu, Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    let activeKey = $state<string | null | undefined>('Tab-0');
    const tabList: PlainTab[] = Array.from({ length: 10 }, (_, i) => ({ itemKey: `Tab-${i}`, tab: `Tab-${i}` }));
    const arrowStyle = 'width: 32px; height: 32px; margin: 0 12px; display: flex; justify-content: center; align-items: center; padding: 0; border: none; border-radius: 100%; background: var(--semi-grey-1); color: var(--semi-color-text); font-family: inherit; font-size: inherit; cursor: pointer';
</script>

<Tabs bind:activeKey collapsible style="width: 50%; margin: 20px" {tabList} type="card">
    {#snippet arrow({ items, position, onClick })}
        <Dropdown>
            {#snippet child({ props })}
                <button {...props} style={arrowStyle} type="button" onclick={onClick}>
                    {position === 'start' ? '←' : '→'}
                </button>
            {/snippet}
            {#snippet content()}
                <DropdownMenu>
                    {#each items as item (item.itemKey)}
                        <DropdownItem onclick={() => (activeKey = item.itemKey)}>{item.itemKey}</DropdownItem>
                    {/each}
                </DropdownMenu>
            {/snippet}
        </Dropdown>
    {/snippet}
    {#snippet panel({ index })}Content of card tab {index}{/snippet}
</Tabs>
