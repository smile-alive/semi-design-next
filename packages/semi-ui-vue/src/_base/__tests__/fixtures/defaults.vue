<script setup lang="ts">
    import { computed } from 'vue';
    import semiDefault, { readSemiDefault, useSemiGlobal } from '../../semi-default';
    import type { DefaultsProps } from './defaults-types';

    const props = withDefaults(defineProps<DefaultsProps>(), {
        label: () => semiDefault('Fixture', 'label', 'local'),
        disabled: () => semiDefault('Fixture', 'disabled', false),
        filter: undefined,
    });
    const semi = useSemiGlobal();
    const filterValue = computed(() => props.filter ?? readSemiDefault(semi, 'Fixture', 'filter', false));
    const output = computed(() => (typeof filterValue.value === 'function' ? filterValue.value('value') : String(filterValue.value)));
</script>

<template>
    <button :disabled="disabled">{{ label }}</button>
    <output aria-label="默认值结果">{{ output }}</output>
</template>
