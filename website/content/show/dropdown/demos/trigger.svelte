<script lang="ts">
    import { Button, Dropdown, Tag } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Dropdown position="bottomLeft" trigger="hover">
        <Tag>Hover me</Tag>
        {#snippet content()}
            <Dropdown.Menu>
                <Dropdown.Item>Menu Item 1</Dropdown.Item>
                <Dropdown.Item>Menu Item 2</Dropdown.Item>
                <Dropdown.Item>Menu Item 3</Dropdown.Item>
            </Dropdown.Menu>
        {/snippet}
    </Dropdown>
    <br />
    <br />
    <Dropdown position="bottomLeft" trigger="focus">
        <div style="border: 1px solid var(--semi-color-border); border-radius: 4px; height: 36px; width: 220px">Please use Tab to focus this div</div>
        {#snippet content()}
            <Dropdown.Menu tabindex={-1}>
                <Dropdown.Item>Menu Item 1</Dropdown.Item>
                <Dropdown.Item>Menu Item 2</Dropdown.Item>
                <Dropdown.Item>Menu Item 3</Dropdown.Item>
            </Dropdown.Menu>
        {/snippet}
    </Dropdown>
    <br />
    <br />
    <Dropdown position="bottomLeft" trigger="click">
        <Button>Click me</Button>
        {#snippet content()}
            <Dropdown.Menu>
                <Dropdown.Item>Menu Item 1</Dropdown.Item>
                <Dropdown.Item>Menu Item 2</Dropdown.Item>
                <Dropdown.Item>Menu Item 3</Dropdown.Item>
            </Dropdown.Menu>
        {/snippet}
    </Dropdown>
    <br />
    <br />
    <Dropdown position="bottomRight" trigger="contextMenu">
        <Button style="margin-block-end: 20px" theme="solid" type="secondary">Right click (ContextMenu)</Button>
        {#snippet content()}
            <Dropdown.Menu>
                <Dropdown.Item>Menu Item 1</Dropdown.Item>
                <Dropdown.Item>Menu Item 2</Dropdown.Item>
                <Dropdown.Item>Menu Item 3</Dropdown.Item>
            </Dropdown.Menu>
        {/snippet}
    </Dropdown>
</div>
