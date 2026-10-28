<script setup lang="ts" generic="T extends string | number">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/video-player/constants';
    import Dropdown, { DropdownItem, DropdownMenu } from '../dropdown';
    import type { ControlsMenuEmits, ControlsMenuProps } from './interface';

    const props = defineProps<ControlsMenuProps<T>>();
    const emit = defineEmits<ControlsMenuEmits<T>>();

    const controlsCls = cssClasses.PREFIX_CONTROLS;
    const currentLabel = computed(() => props.list.find((option) => option.value === props.current)?.label ?? String(props.current));
    const buttonName = computed(() => [props.label, currentLabel.value].filter(Boolean).join(' '));
</script>

<template>
    <Dropdown :class="`${controlsCls}-popup-menu`" position="top" selectionMode="single">
        <button :aria-label="buttonName" :class="[`${controlsCls}-menu-item`, `${controlsCls}-popup`]" type="button">
            {{ currentLabel }}
        </button>
        <template #content>
            <DropdownMenu>
                <DropdownItem v-for="option in props.list" :key="option.value" :active="option.value === props.current" :class="`${controlsCls}-popup-menu-item`" @click="emit('select', option)">
                    {{ option.label }}
                </DropdownItem>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
