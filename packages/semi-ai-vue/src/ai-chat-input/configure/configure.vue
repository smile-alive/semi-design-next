<script setup lang="ts">
    import { computed, shallowRef } from 'vue';
    import type { LeftMenuChangeProps } from '@fibrae/semi-ai-foundation/ai-chat-input/interface';
    import { provideConfigureContext } from './context';
    import type { ConfigureEmits, ConfigureHandle, ConfigureProps, ConfigureSlots } from './interface';

    // the root is the slot alone, so there is no element for attrs to land on
    defineOptions({ name: 'Configure', inheritAttrs: false });
    const props = defineProps<ConfigureProps>();
    const emit = defineEmits<ConfigureEmits>();
    defineSlots<ConfigureSlots>();

    // Items register in one mount pass, each merging onto the value the previous one wrote
    const value = shallowRef<LeftMenuChangeProps>({ ...props.defaultValue });

    provideConfigureContext({
        view: computed(() => value.value),
        onChange: (changed, init = false) => {
            value.value = { ...value.value, ...changed };
            if (!init) {
                emit('change', value.value, changed);
            }
        },
        onRemove: (field) => {
            const { [field]: _removed, ...rest } = value.value;
            value.value = rest;
            emit('change', value.value);
        },
    });

    defineExpose<ConfigureHandle>({ getConfigureValue: () => value.value });
</script>

<template>
    <slot />
</template>
