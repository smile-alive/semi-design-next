<script setup lang="ts">
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';

    const props = withDefaults(defineProps<{ closeOnEsc?: boolean; trigger?: 'hover' | 'click' }>(), {
        closeOnEsc: true,
        trigger: 'hover',
    });
    const emit = defineEmits<{ leaf: [event: MouseEvent] }>();
</script>

<template>
    <Dropdown :closeOnEsc="props.closeOnEsc" :trigger="props.trigger">
        <button type="button">all hover</button>
        <template #content>
            <DropdownMenu>
                <Dropdown :closeOnEsc="props.closeOnEsc" position="rightTop">
                    <DropdownItem>Branch</DropdownItem>
                    <template #content>
                        <DropdownMenu>
                            <DropdownItem @click="emit('leaf', $event)">Leaf</DropdownItem>
                        </DropdownMenu>
                    </template>
                </Dropdown>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
