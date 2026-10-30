<script lang="ts">
    import { IconToken } from '@fibrae/semi-icons-svelte/lab';
    import { Button, Dropdown, DropdownItem, DropdownMenu, Toast } from '@fibrae/semi-ui-svelte';

    const submenus = [
        { label: 'Menu Item 1', position: 'rightTop' },
        { label: 'Menu Item 2', position: 'leftTop' },
    ] as const;
</script>

<div style="margin: 100px">
    <Dropdown>
        <Button theme="outline" type="tertiary">
            {#snippet icon()}<IconToken />{/snippet}
            Hover Me
        </Button>
        {#snippet content()}
            <DropdownMenu>
                {#each submenus as submenu (submenu.label)}
                    <Dropdown position={submenu.position}>
                        {#snippet child({ props })}
                            <DropdownItem {...props}>{submenu.label}</DropdownItem>
                        {/snippet}
                        {#snippet content()}
                            <DropdownMenu>
                                <!-- Enter and Space trigger a submenu item's click too -->
                                {#each [1, 2, 3] as n (n)}
                                    <DropdownItem onclick={() => Toast.info(`点击了 Nested Menu Item ${n}`)}>Nested Menu Item {n}</DropdownItem>
                                {/each}
                            </DropdownMenu>
                        {/snippet}
                    </Dropdown>
                {/each}
                <DropdownItem>Menu Item 3</DropdownItem>
            </DropdownMenu>
        {/snippet}
    </Dropdown>
</div>
