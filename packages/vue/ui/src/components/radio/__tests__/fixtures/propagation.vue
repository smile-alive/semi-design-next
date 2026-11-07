<script setup lang="ts">
    import Radio from '../..';
    import type { RadioChangeEvent } from '../../interface';

    const props = withDefaults(defineProps<{ stop?: boolean }>(), { stop: true });
    const emit = defineEmits<{ parentChange: []; change: [event: RadioChangeEvent] }>();
    const handleChange = (event: RadioChangeEvent) => {
        emit('change', event);
        if (props.stop) {
            event.stopPropagation();
        }
    };
</script>

<template>
    <div role="presentation" @change="emit('parentChange')">
        <Radio name="n1" value="v1" @change="handleChange">A</Radio>
    </div>
</template>
