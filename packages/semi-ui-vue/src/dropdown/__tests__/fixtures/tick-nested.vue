<script setup lang="ts">
    import Dropdown, { DropdownItem, DropdownMenu, type DropdownProps } from '../..';

    withDefaults(
        defineProps<{
            outerTick?: boolean;
            innerTick?: boolean;
            outerMode?: DropdownProps['selectionMode'];
            innerMode?: DropdownProps['selectionMode'];
        }>(),
        { outerTick: true, innerTick: false, outerMode: undefined, innerMode: undefined }
    );
    const emit = defineEmits<{ parentClick: [event: MouseEvent] }>();
</script>

<template>
    <Dropdown :motion="false" :selectionMode="outerMode" :showTick="outerTick" trigger="custom" visible>
        <button type="button">tick trigger</button>
        <template #content>
            <DropdownMenu>
                <Dropdown :motion="false" position="rightTop" :selectionMode="innerMode" :showTick="innerTick" trigger="custom" visible>
                    <DropdownItem active @click="emit('parentClick', $event)">tick parent</DropdownItem>
                    <template #content>
                        <DropdownMenu>
                            <DropdownItem>tick child</DropdownItem>
                        </DropdownMenu>
                    </template>
                </Dropdown>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
