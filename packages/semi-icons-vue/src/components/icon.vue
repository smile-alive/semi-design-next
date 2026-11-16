<script setup lang="ts">
    import { useAttrs } from 'vue';
    import { BASE_CLASS_PREFIX } from '../env';
    import type { IconProps, IconSlots } from './interface';
    import '@fibrae/semi-icons-core/styles/icons.scss';

    defineOptions({ name: 'Icon', inheritAttrs: false, elementType: 'Icon' });
    const props = withDefaults(defineProps<IconProps>(), { size: 'default', spin: false });
    defineSlots<IconSlots>();

    const attrs = useAttrs();
    const prefix = `${BASE_CLASS_PREFIX}-icon`;
    // attrs are not reactive, so the check runs during render.
    const exposed = () => Boolean(attrs['aria-label'] || attrs['aria-labelledby']) || Number(attrs.tabindex) >= 0;
</script>

<template>
    <span
        :aria-hidden="exposed() ? undefined : true"
        :class="[
            prefix,
            {
                [`${prefix}-${props.size}`]: props.size !== 'inherit',
                [`${prefix}-spinning`]: props.spin,
                [`${prefix}-${props.type}`]: props.type,
            },
        ]"
        :role="exposed() ? 'img' : undefined"
        :style="Number.isSafeInteger(props.rotate) ? { transform: `rotate(${props.rotate}deg)` } : undefined"
        v-bind="$attrs"
    >
        <component :is="node" v-for="(node, index) in $slots.default?.() ?? []" :key="node.key ?? index" v-bind="props.fill ? { fill: props.fill } : {}" />
    </span>
</template>
