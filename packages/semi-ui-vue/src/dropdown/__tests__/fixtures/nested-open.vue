<script setup lang="ts">
    import Dropdown, { DropdownItem, DropdownMenu } from '../..';

    const emit = defineEmits<{
        outerClick: [event: MouseEvent];
        parentMousedown: [event: MouseEvent];
        innerClick: [event: MouseEvent];
        innerMousedown: [event: MouseEvent];
    }>();
</script>

<template>
    <Dropdown :motion="false" trigger="custom" visible>
        <button type="button">nested trigger</button>
        <template #content>
            <DropdownMenu>
                <DropdownItem @click="emit('outerClick', $event)">outer item</DropdownItem>
                <Dropdown :motion="false" position="rightTop" trigger="custom" visible>
                    <DropdownItem @mousedown="emit('parentMousedown', $event)">parent item</DropdownItem>
                    <template #content>
                        <DropdownMenu>
                            <DropdownItem @click="emit('innerClick', $event)" @mousedown="emit('innerMousedown', $event)"> inner item </DropdownItem>
                        </DropdownMenu>
                    </template>
                </Dropdown>
            </DropdownMenu>
        </template>
    </Dropdown>
</template>
