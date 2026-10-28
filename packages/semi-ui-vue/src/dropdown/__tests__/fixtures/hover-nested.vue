<script setup lang="ts">
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';

    const emit = defineEmits<{ deep: [event: MouseEvent] }>();
</script>

<template>
    <Dropdown trigger="click">
        <button type="button">hover nested</button>
        <template #content>
            <DropdownMenu>
                <DropdownItem>Alpha</DropdownItem>
                <Dropdown position="rightTop">
                    <DropdownItem>Parent</DropdownItem>
                    <template #content>
                        <DropdownMenu>
                            <DropdownItem @click="emit('deep', $event)">Deep one</DropdownItem>
                            <DropdownItem>Deep two</DropdownItem>
                        </DropdownMenu>
                    </template>
                </Dropdown>
                <DropdownItem>Omega</DropdownItem>
            </DropdownMenu>
        </template>
    </Dropdown>
    <button type="button">after</button>
</template>
