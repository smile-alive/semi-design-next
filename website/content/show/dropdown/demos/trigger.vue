<script setup lang="ts">
    import { Button, Dropdown, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Dropdown position="bottomLeft" trigger="hover">
            <Tag>Hover me</Tag>
            <template #content>
                <Dropdown.Menu>
                    <Dropdown.Item>Menu Item 1</Dropdown.Item>
                    <Dropdown.Item>Menu Item 2</Dropdown.Item>
                    <Dropdown.Item>Menu Item 3</Dropdown.Item>
                </Dropdown.Menu>
            </template>
        </Dropdown>
        <br />
        <br />
        <Dropdown position="bottomLeft" trigger="focus">
            <div
                :style="{
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: '4px',
                    height: '36px',
                    width: '220px',
                }"
            >
                Please use Tab to focus this div
            </div>
            <template #content>
                <Dropdown.Menu :tabindex="-1">
                    <Dropdown.Item>Menu Item 1</Dropdown.Item>
                    <Dropdown.Item>Menu Item 2</Dropdown.Item>
                    <Dropdown.Item>Menu Item 3</Dropdown.Item>
                </Dropdown.Menu>
            </template>
        </Dropdown>
        <br />
        <br />
        <Dropdown position="bottomLeft" trigger="click">
            <Button>Click me</Button>
            <template #content>
                <Dropdown.Menu>
                    <Dropdown.Item>Menu Item 1</Dropdown.Item>
                    <Dropdown.Item>Menu Item 2</Dropdown.Item>
                    <Dropdown.Item>Menu Item 3</Dropdown.Item>
                </Dropdown.Menu>
            </template>
        </Dropdown>
        <br />
        <br />
        <Dropdown position="bottomRight" trigger="contextMenu">
            <Button :style="{ marginBottom: '20px' }" theme="solid" type="secondary"> Right click (ContextMenu) </Button>
            <template #content>
                <Dropdown.Menu>
                    <Dropdown.Item>Menu Item 1</Dropdown.Item>
                    <Dropdown.Item>Menu Item 2</Dropdown.Item>
                    <Dropdown.Item>Menu Item 3</Dropdown.Item>
                </Dropdown.Menu>
            </template>
        </Dropdown>
    </div>
</template>
