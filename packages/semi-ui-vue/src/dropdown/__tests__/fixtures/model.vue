<script setup lang="ts">
    import { ref } from 'vue';
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';

    const props = defineProps<{ keepDOM?: boolean }>();
    const emit = defineEmits<{ visibleChange: [visible: boolean] }>();
    const visible = ref(false);
</script>

<template>
    <Dropdown v-model:visible="visible" :keepDOM="props.keepDOM" :motion="false" trigger="click" @visibleChange="emit('visibleChange', $event)">
        <button type="button">model trigger</button>
        <template #content>
            <DropdownMenu>
                <DropdownItem>First</DropdownItem>
                <DropdownItem>Last</DropdownItem>
            </DropdownMenu>
        </template>
    </Dropdown>
    <button type="button">outside</button>
</template>
