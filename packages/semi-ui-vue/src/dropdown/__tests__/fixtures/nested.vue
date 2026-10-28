<script setup lang="ts">
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';
    import ConfigProvider from '../../../config-provider';

    const props = defineProps<{ direction?: 'ltr' | 'rtl' }>();
    const emit = defineEmits<{ inner: [event: MouseEvent] }>();
</script>

<template>
    <ConfigProvider :direction="props.direction">
        <Dropdown :motion="false" trigger="click">
            <button type="button">nested menu</button>
            <template #content>
                <DropdownMenu>
                    <DropdownItem>Alpha</DropdownItem>
                    <Dropdown :motion="false" position="rightTop" trigger="click">
                        <DropdownItem>Parent</DropdownItem>
                        <template #content>
                            <DropdownMenu>
                                <DropdownItem @click="emit('inner', $event)">Inner one</DropdownItem>
                                <DropdownItem disabled>Inner disabled</DropdownItem>
                                <DropdownItem>Inner two</DropdownItem>
                            </DropdownMenu>
                        </template>
                    </Dropdown>
                    <DropdownItem>Omega</DropdownItem>
                </DropdownMenu>
            </template>
        </Dropdown>
    </ConfigProvider>
</template>
