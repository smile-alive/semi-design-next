<script lang="ts">
    import { DropdownDivider, DropdownItem, DropdownMenu, DropdownTitle, type DropdownMenuProps } from '..';

    let { attrs = {}, standalone = false }: { attrs?: DropdownMenuProps; standalone?: boolean } = $props();
</script>

{#if standalone}
    <DropdownMenu>
        <DropdownItem active showTick>outside</DropdownItem>
    </DropdownMenu>
{:else}
    <DropdownMenu {...attrs}>
        <DropdownTitle data-testid="title-attr" id="title-id">title</DropdownTitle>
        <DropdownDivider data-testid="divider-attr" />
        <DropdownItem>K1</DropdownItem>
        <DropdownItem>K2</DropdownItem>
    </DropdownMenu>
{/if}
