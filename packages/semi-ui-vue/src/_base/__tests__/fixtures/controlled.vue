<script setup lang="ts">
    import useControllable from '../../use-controllable';

    const props = withDefaults(
        defineProps<{
            modelValue?: string;
            defaultValue?: string;
            keepLastControlled?: boolean;
        }>(),
        { defaultValue: 'initial', keepLastControlled: false }
    );
    const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string] }>();
    const [value, set] = useControllable(
        () => props.modelValue,
        () => props.defaultValue,
        (next) => {
            emit('update:modelValue', next);
            emit('change', next);
        },
        { keepLastControlled: props.keepLastControlled }
    );
</script>

<template>
    <button @click="set('next')">{{ value ?? 'undefined' }}</button>
</template>
