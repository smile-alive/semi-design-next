<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu } from '..';
</script>

<Dropdown motion={false} trigger="custom" visible>
    {#snippet child({ props })}
        <button {...props} type="button">outer trigger</button>
    {/snippet}
    {#snippet content()}
        <DropdownMenu>
            <Dropdown motion={false} trigger="click">
                {#snippet child({ props })}
                    <DropdownItem {...props} disabled>Parent</DropdownItem>
                {/snippet}
                {#snippet content()}
                    <DropdownMenu>
                        <DropdownItem>Deep</DropdownItem>
                    </DropdownMenu>
                {/snippet}
            </Dropdown>
        </DropdownMenu>
    {/snippet}
</Dropdown>
