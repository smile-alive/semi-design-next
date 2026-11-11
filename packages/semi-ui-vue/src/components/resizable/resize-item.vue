<script setup lang="ts">
    import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/resizable/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import { type ElementProps, type EmitHandlers, readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../../base/index';
    import { useResizeGroupContext } from './context';
    import type { ResizeItemEmits, ResizeItemProps, ResizeItemSlots } from './interface';

    const props = withDefaults(defineProps<ResizeItemProps & /* @vue-ignore */ ElementProps<'div', keyof ResizeItemProps | EmitHandlers<ResizeItemEmits>>>(), {
        min: semiGlobalDefault('ResizeItem', 'min'),
        max: semiGlobalDefault('ResizeItem', 'max'),
        defaultSize: semiGlobalDefault('ResizeItem', 'defaultSize'),
        onResizeStart: undefined,
    });

    const emit = defineEmits<ResizeItemEmits>();
    defineSlots<ResizeItemSlots>();

    const group = useResizeGroupContext('ResizeItem');
    const semi = useSemiGlobal();

    const item = useTemplateRef('item');

    const prefix = cssClasses.PREFIX;

    // The group sizes the item through its element, which exists only once mounted; the item reads the current props
    // at drag time. The group writes style.width and style.height on the element directly. Known limit: a caller's
    // string style is reapplied whole when it changes and drops them, while an object style leaves them alone; upgrade
    // by replaying the sizes after the group's update if string styles are needed.
    let unregister = () => {};

    onMounted(() => {
        unregister = group.registerItem({
            element: item.value!,
            min: () => props.min,
            max: () => props.max,
            defaultSize: () => props.defaultSize,
            notifyResizeStart: (e, direction) => (props.onResizeStart ?? readSemiDefault(semi, 'ResizeItem', 'onResizeStart'))?.(e, direction),
            notifyResize: (size, e, direction) => emit('change', size, e, direction),
            notifyResizeEnd: (size, e, direction) => emit('resizeEnd', size, e, direction),
        });
    });

    onBeforeUnmount(() => unregister());
</script>

<template>
    <div ref="item" :class="`${prefix}-item`" :role="namedRole($attrs)">
        <slot />
    </div>
</template>
