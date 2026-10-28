<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';

    const props = defineProps<{ custom?: boolean }>();
    const emit = defineEmits<{ confirm: [event: MouseEvent] }>();
    const confirm = useTemplateRef<HTMLButtonElement>('confirm');
    const moveFocus = () => confirm.value?.focus();
</script>

<template>
    <Dropdown v-if="props.custom" trigger="custom" :visible="false">
        <div tabindex="0" @click="moveFocus">custom trigger</div>
        <template #content>
            <DropdownMenu>
                <DropdownItem>Alpha</DropdownItem>
            </DropdownMenu>
        </template>
    </Dropdown>
    <Dropdown v-else trigger="click">
        <button type="button">more</button>
        <template #content>
            <DropdownMenu>
                <DropdownItem @click="moveFocus">Delete</DropdownItem>
            </DropdownMenu>
        </template>
    </Dropdown>
    <button ref="confirm" type="button" @click="emit('confirm', $event)">confirm</button>
</template>
