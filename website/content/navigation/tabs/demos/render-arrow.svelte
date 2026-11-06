<script lang="ts">
    import { Dropdown, Tabs, type PlainTab } from '@fibrae/semi-ui-svelte';

    let activeKey = $state<string | null | undefined>('Tab-0');
    const tabList: PlainTab[] = Array.from({ length: 10 }, (_, i) => ({ itemKey: `Tab-${i}`, tab: `Tab-${i}` }));
    const arrowStyle = 'width: 32px; height: 32px; margin: 0 12px; display: flex; justify-content: center; align-items: center; padding: 0; border: none; border-radius: 100%; background: var(--semi-grey-1); color: var(--semi-color-text); font-family: inherit; font-size: inherit; cursor: pointer';
</script>

<Tabs bind:activeKey collapsible style="width: 50%; margin: 20px" {tabList} type="card">
    {#snippet arrow(arrowProps)}
        <Dropdown>
            {#snippet child(trigger)}
                <button {...trigger.props} style={arrowStyle} type="button" onclick={arrowProps.onClick}>
                    {arrowProps.position === 'start' ? '←' : '→'}
                </button>
            {/snippet}
            {#snippet content()}
                <Dropdown.Menu>
                    {#each arrowProps.items as item (item.itemKey)}
                        <Dropdown.Item onclick={() => (activeKey = item.itemKey)}>{item.itemKey}</Dropdown.Item>
                    {/each}
                </Dropdown.Menu>
            {/snippet}
        </Dropdown>
    {/snippet}
    {#snippet panel(pane)}Content of card tab {pane.index}{/snippet}
</Tabs>
