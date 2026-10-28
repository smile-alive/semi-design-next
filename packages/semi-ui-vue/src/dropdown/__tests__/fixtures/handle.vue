<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import Dropdown, { DropdownItem, DropdownMenu, type DropdownHandle } from '../..';

    const emit = defineEmits<{ ready: [handle: DropdownHandle | null] }>();
    const dropdown = useTemplateRef<DropdownHandle>('dropdown');
    onMounted(() => emit('ready', dropdown.value));
</script>

<template>
    <Dropdown ref="dropdown" :motion="false" trigger="click">
        <button type="button">ref trigger</button>
        <template #content>
            <DropdownMenu>
                <DropdownItem>Menu Item 1</DropdownItem>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
