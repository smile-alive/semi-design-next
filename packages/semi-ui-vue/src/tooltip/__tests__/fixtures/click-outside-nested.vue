<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import useClickOutside from '../../../_base/use-click-outside';
    import Popover from '../../../popover';
    import { useNestedPopups } from '../../context';

    const emit = defineEmits<{ outside: [] }>();
    const panel = useTemplateRef('panel');
    useClickOutside([panel], () => emit('outside'), true, useNestedPopups());
</script>

<template>
    <div ref="panel">
        <Popover ariaLabel="Nested" :motion="false" trigger="custom" visible>
            <button type="button">nested trigger</button>
            <template #content>
                <button type="button">inside nested</button>
            </template>
        </Popover>
    </div>
</template>
