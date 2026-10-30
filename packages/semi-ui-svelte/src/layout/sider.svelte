<script lang="ts">
    import { onMount } from 'svelte';
    import { defaultResponsiveMap } from '@fibrae/semi-foundation/grid/constants';
    import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
    import { registerMediaQuery } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/layout/layout.scss';
    import { getLayoutContext } from './context.js';
    import type { ResponsiveMap, SiderProps } from './interface.js';

    let { prefixCls = cssClasses.PREFIX, breakpoint, onBreakpoint, children, ...rest }: SiderProps = $props();

    const layout = getLayoutContext();

    // Known limit: breakpoint is read once at mount. Upgrade: re-register the queries when it changes.
    onMount(() => {
        const unregisters = (Object.keys(defaultResponsiveMap) as Array<keyof ResponsiveMap>)
            .filter((screen) => breakpoint?.includes(screen))
            .map((screen) =>
                registerMediaQuery(defaultResponsiveMap[screen], {
                    match: () => onBreakpoint?.(screen, true),
                    unmatch: () => onBreakpoint?.(screen, false),
                })
            );
        layout?.addSider();
        return () => {
            unregisters.forEach((unregister) => unregister());
            layout?.removeSider();
        };
    });
</script>

<aside {...rest} class={[rest.class, `${prefixCls}-sider`]}>
    <div class={`${prefixCls}-sider-children`}>
        {@render children?.()}
    </div>
</aside>
