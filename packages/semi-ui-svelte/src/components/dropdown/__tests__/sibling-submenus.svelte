<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu } from '..';
</script>

<Dropdown motion={false} trigger="click">
    {#snippet child({ props })}
        <button {...props} type="button">aim</button>
    {/snippet}
    {#snippet content()}
        <DropdownMenu>
            <Dropdown motion={false} position="rightTop">
                {#snippet child({ props })}
                    <DropdownItem {...props}>First</DropdownItem>
                {/snippet}
                {#snippet content()}
                    <DropdownMenu>
                        <DropdownItem>First one</DropdownItem>
                        <DropdownItem>First two</DropdownItem>
                        <DropdownItem>First three</DropdownItem>
                    </DropdownMenu>
                {/snippet}
            </Dropdown>
            <Dropdown motion={false} position="rightTop">
                {#snippet child({ props })}
                    <DropdownItem {...props}>Second</DropdownItem>
                {/snippet}
                {#snippet content()}
                    <DropdownMenu>
                        <DropdownItem>Second one</DropdownItem>
                    </DropdownMenu>
                {/snippet}
            </Dropdown>
        </DropdownMenu>
    {/snippet}
</Dropdown>
