<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import { getResizeGroupContext } from './context.js';
    import type { ResizeItemProps } from './interface.js';

    const defaults = useDefaultProps('ResizeItem');
    let { min = defaults('min'), max = defaults('max'), defaultSize = defaults('defaultSize'), onResizeStart = defaults('onResizeStart'), onChange, onResizeEnd, children, ...rest }: ResizeItemProps = $props();

    const group = getResizeGroupContext('ResizeItem');

    let item = $state<HTMLDivElement>();

    const prefix = cssClasses.PREFIX;

    // The group sizes the item through its element, which exists only once mounted; the entry reads the current props at
    // drag time. The group writes style.width and style.height on the element directly. Known limit: Svelte rewrites the
    // style attribute whole when the caller's `style` changes and drops them; upgrade by replaying the sizes after the
    // group's update if a changing style is needed.
    onMount(() =>
        group.registerItem({
            el: item as HTMLDivElement,
            min: () => min,
            max: () => max,
            defaultSize: () => defaultSize,
            start: (e, direction) => onResizeStart?.(e, direction),
            change: (size, e, direction) => onChange?.(size, e, direction),
            end: (size, e, direction) => onResizeEnd?.(size, e, direction),
        })
    );
</script>

<div bind:this={item} {...rest} class={[`${prefix}-item`, rest.class]} role={groupRole(rest)}>
    {@render children?.()}
</div>
