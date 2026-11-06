<script lang="ts">
    import { IconToken } from '@fibrae/semi-icons-svelte/lab';
    import { Button, Dropdown, Toast } from '@fibrae/semi-ui-svelte';
</script>

{#snippet subMenu()}
    <Dropdown.Menu>
        <!-- Enter and Space trigger a submenu item's click too -->
        {#each [1, 2, 3] as n (n)}
            <Dropdown.Item onclick={() => Toast.info({ content: `点击了 Nested Menu Item ${n}` })}>Nested Menu Item {n}</Dropdown.Item>
        {/each}
    </Dropdown.Menu>
{/snippet}

<div style="margin: 100px">
    <Dropdown>
        <Button theme="outline" type="tertiary">
            {#snippet icon()}<IconToken />{/snippet}
            Hover Me
        </Button>
        {#snippet content()}
            <Dropdown.Menu>
                <Dropdown content={subMenu} position="rightTop">
                    {#snippet child(trigger)}
                        <Dropdown.Item {...trigger.props}>Menu Item 1</Dropdown.Item>
                    {/snippet}
                </Dropdown>
                <Dropdown content={subMenu} position="leftTop">
                    {#snippet child(trigger)}
                        <Dropdown.Item {...trigger.props}>Menu Item 2</Dropdown.Item>
                    {/snippet}
                </Dropdown>
                <Dropdown.Item>Menu Item 3</Dropdown.Item>
            </Dropdown.Menu>
        {/snippet}
    </Dropdown>
</div>
