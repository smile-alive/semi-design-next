<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu } from '..';
</script>

<Dropdown classNames={{ item: 'outer-item', itemIcon: 'outer-icon', menu: 'outer-menu' }} motion={false} styles={{ item: 'order: 1' }} trigger="custom" visible>
    {#snippet child({ props })}
        <button {...props} type="button">owner</button>
    {/snippet}
    {#snippet content()}
        <DropdownMenu>
            <Dropdown classNames={{ item: ['inner-item'] }} motion={false} position="rightTop" styles={{ item: 'opacity: 0.5' }} trigger="custom" visible>
                {#snippet child({ props })}
                    <DropdownItem {...props}>Parent</DropdownItem>
                {/snippet}
                {#snippet content()}
                    {#snippet icon()}<i></i>{/snippet}
                    <DropdownMenu>
                        <DropdownItem classNames={{ icon: 'own-icon' }} {icon} style="order: 3" styles={{ icon: 'order: 4' }}>Inner</DropdownItem>
                    </DropdownMenu>
                {/snippet}
            </Dropdown>
        </DropdownMenu>
    {/snippet}
</Dropdown>
