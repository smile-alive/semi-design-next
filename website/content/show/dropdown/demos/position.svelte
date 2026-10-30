<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu, Tag } from '@fibrae/semi-ui-svelte';

    const positions = ['bottom', 'bottomLeft', 'bottomRight'] as const;
</script>

<div>
    {#each positions as position, index (position)}
        {#if index > 0}
            <br />
            <br />
        {/if}
        <Dropdown {position}>
            <Tag>{position === 'bottom' ? 'Bottom' : position}</Tag>
            {#snippet content()}
                <DropdownMenu>
                    <DropdownItem>Menu Item 1</DropdownItem>
                    <DropdownItem>Menu Item 2</DropdownItem>
                    <DropdownItem>Menu Item 3</DropdownItem>
                </DropdownMenu>
            {/snippet}
        </Dropdown>
    {/each}
</div>
