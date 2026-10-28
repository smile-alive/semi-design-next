<script setup lang="ts">
    import { IconToken } from '@fibrae/semi-icons-vue/lab';
    import { Button, Dropdown, Toast } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Dropdown position="bottomLeft" trigger="click">
        <Button theme="outline" type="tertiary">
            <template #icon>
                <IconToken />
            </template>
            Click Me
        </Button>
        <template #content>
            <Dropdown.Menu>
                <Dropdown.Item @click="Toast.info('You clicked me!')">1: click me!</Dropdown.Item>
                <Dropdown.Item @mouseenter="Toast.info('Nice to meet you!')">2: mouse enter</Dropdown.Item>
                <Dropdown.Item @mouseleave="Toast.info('See ya!')">3: mouse leave</Dropdown.Item>
                <Dropdown.Item @contextmenu="Toast.info('Right clicked!')">4: right click</Dropdown.Item>
            </Dropdown.Menu>
        </template>
    </Dropdown>
</template>
