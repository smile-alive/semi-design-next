<script lang="ts">
    import { Dropdown, Tag } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Dropdown position="bottom">
        <Tag>Bottom</Tag>
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
    <Dropdown position="bottomLeft">
        <Tag>bottomLeft</Tag>
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
    <Dropdown position="bottomRight">
        <Tag>bottomRight</Tag>
        {#snippet content()}
            <Dropdown.Menu>
                <Dropdown.Item>Menu Item 1</Dropdown.Item>
                <Dropdown.Item>Menu Item 2</Dropdown.Item>
                <Dropdown.Item>Menu Item 3</Dropdown.Item>
            </Dropdown.Menu>
        {/snippet}
    </Dropdown>
</div>
