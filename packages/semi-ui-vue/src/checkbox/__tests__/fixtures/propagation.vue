<script setup lang="ts">
    import Checkbox from '../..';
    import type { CheckboxEvent } from '../../interface';

    const props = withDefaults(defineProps<{ stop?: boolean }>(), { stop: true });
    const emit = defineEmits<{ parentClick: [] }>();
    const handleChange = (event: CheckboxEvent) => {
        if (props.stop) {
            event.stopPropagation();
            event.preventDefault();
        }
    };
</script>

<template>
    <div role="presentation" @click="emit('parentClick')">
        <Checkbox @change="handleChange" />
    </div>
</template>
