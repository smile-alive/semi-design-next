<script lang="ts">
    import { Dropdown, DropdownItem, DropdownMenu, type DropdownProps } from '..';
    import Button from '../../button/button.svelte';

    let { props = {} }: { props?: DropdownProps } = $props();
</script>

{#snippet content()}
    <DropdownMenu>
        <DropdownItem>Alpha</DropdownItem>
    </DropdownMenu>
{/snippet}

<Dropdown {content} motion={false} mouseEnterDelay={0} mouseLeaveDelay={0} {...props}>
    <Button disabled>trigger</Button>
</Dropdown>
