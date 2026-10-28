<script setup lang="ts">
    import { onBeforeUnmount, onMounted } from 'vue';
    import { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
    import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
    import { registerMediaQuery } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/layout/layout.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { useLayoutContext } from './context';
    import type { LayoutSlots, ResponsiveMap, SiderEmits, SiderProps } from './interface';

    defineOptions({ elementType: 'Layout.Sider' });
    const props = withDefaults(defineProps<SiderProps & /* @vue-ignore */ ElementProps<'aside', keyof SiderProps | EmitHandlers<SiderEmits>>>(), { prefixCls: cssClasses.PREFIX, breakpoint: undefined });
    const emit = defineEmits<SiderEmits>();
    defineSlots<LayoutSlots>();

    const layout = useLayoutContext();

    let unregisters: Array<() => void> = [];

    // Known limit: breakpoint is read once at mount. Upgrade: watch it and re-register the queries.
    const mountBreakpoint = props.breakpoint;

    onMounted(() => {
        unregisters = (Object.keys(defaultResponsiveMap) as Array<keyof ResponsiveMap>)
            .filter((screen) => mountBreakpoint?.includes(screen))
            .map((screen) =>
                registerMediaQuery(defaultResponsiveMap[screen], {
                    match: () => emit('breakpoint', screen, true),
                    unmatch: () => emit('breakpoint', screen, false),
                })
            );
        layout?.addSider();
    });

    onBeforeUnmount(() => {
        unregisters.forEach((unregister) => unregister());
        layout?.removeSider();
    });
</script>

<template>
    <aside :class="`${props.prefixCls}-sider`">
        <div :class="`${props.prefixCls}-sider-children`">
            <slot />
        </div>
    </aside>
</template>
