<script setup lang="ts">
    import { provideProbeContext, useProbeContext } from './probe-context';

    const props = defineProps<{ name: string; reset?: boolean; silent?: boolean }>();
    defineSlots<{ default?: () => unknown }>();
    const outer = useProbeContext();
    const seen = outer ? outer.label : 'none';
    if (props.reset) provideProbeContext(undefined);
    else if (!props.silent) provideProbeContext({ label: props.name });
</script>

<template>
    <div>
        <span :data-name="name">{{ seen }}</span>
        <slot />
    </div>
</template>
