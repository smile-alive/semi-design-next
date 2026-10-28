<script setup lang="ts">
    import { IconToken } from '@fibrae/semi-icons-vue/lab';
    import { Button, Dropdown, type DropDownMenuItem } from '@fibrae/semi-ui-vue';

    const menu: DropDownMenuItem[] = [
        { node: 'title', name: '分组1' },
        { node: 'item', name: 'primary1', type: 'primary', onClick: () => console.log('click primary') },
        { node: 'item', name: 'secondary', type: 'secondary' },
        { node: 'divider' },
        { node: 'title', name: '分组2' },
        { node: 'item', name: 'tertiary', type: 'tertiary' },
        { node: 'item', name: 'warning', type: 'warning', active: true },
        { node: 'item', name: 'danger', type: 'danger' },
    ];
</script>

<template>
    <Dropdown :menu="menu" position="bottomLeft" showTick trigger="click">
        <Button theme="outline" type="tertiary">
            <template #icon>
                <IconToken />
            </template>
            Click Me
        </Button>
    </Dropdown>
</template>
