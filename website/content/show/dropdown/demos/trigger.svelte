<script lang="ts">
    import { Button, Dropdown, DropdownItem, DropdownMenu, Tag } from '@fibrae/semi-ui-svelte';
</script>

{#snippet menu(tabindex?: number)}
    <DropdownMenu {tabindex}>
        <DropdownItem>Menu Item 1</DropdownItem>
        <DropdownItem>Menu Item 2</DropdownItem>
        <DropdownItem>Menu Item 3</DropdownItem>
    </DropdownMenu>
{/snippet}

<div>
    <Dropdown position="bottomLeft" trigger="hover">
        <Tag>Hover me</Tag>
        {#snippet content()}{@render menu()}{/snippet}
    </Dropdown>
    <br />
    <br />
    <Dropdown position="bottomLeft" trigger="focus">
        <div style="border: 1px solid var(--semi-color-border); border-radius: 4px; height: 36px; width: 220px">Please use Tab to focus this div</div>
        {#snippet content()}{@render menu(-1)}{/snippet}
    </Dropdown>
    <br />
    <br />
    <Dropdown position="bottomLeft" trigger="click">
        <Button>Click me</Button>
        {#snippet content()}{@render menu()}{/snippet}
    </Dropdown>
    <br />
    <br />
    <Dropdown position="bottomRight" trigger="contextMenu">
        <Button style="margin-bottom: 20px" theme="solid" type="secondary">Right click (ContextMenu)</Button>
        {#snippet content()}{@render menu()}{/snippet}
    </Dropdown>
</div>
