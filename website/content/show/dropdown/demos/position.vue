<script setup lang="ts">
    import { Dropdown, Tag } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Dropdown position="bottom">
            <Tag>Bottom</Tag>
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
        <Dropdown position="bottomLeft">
            <Tag>bottomLeft</Tag>
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
        <Dropdown position="bottomRight">
            <Tag>bottomRight</Tag>
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
