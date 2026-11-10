<script setup lang="ts">
    import { useControllable } from '../../composables/index';

    const props = withDefaults(
        defineProps<{
            modelValue?: string;
            defaultValue?: string;
        }>(),
        { defaultValue: 'initial' }
    );
    const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string] }>();
    const [value, set] = useControllable(
        () => props.modelValue,
        () => props.defaultValue,
        (next) => {
            emit('update:modelValue', next);
            emit('change', next);
        }
    );
</script>

<template>
    <button @click="set('next')">{{ value ?? 'undefined' }}</button>
</template>
