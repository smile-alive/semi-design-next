<script lang="ts">
    import { on } from 'svelte/events';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseProps, type ResizeGroupBaseState } from '@fibrae/semi-foundation/resizable/foundation';
    import '@fibrae/semi-foundation/resizable/resizable.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { setResizeGroupContext } from './context.js';
    import type { ResizeGroupProps } from './interface.js';
    import { joinStyle } from './style.js';

    type Foundation = ResizeGroupFoundation<ResizeGroupBaseProps>;
    type Adapter = ResizeGroupAdapter<ResizeGroupBaseProps>;

    const defaults = useDefaultProps('ResizeGroup');
    let { direction = defaults('direction', 'horizontal'), children, ...rest }: ResizeGroupProps = $props();

    let group = $state<HTMLDivElement>();

    const prefix = cssClasses.PREFIX;

    const foundationProps: ResizeGroupBaseProps = {
        get direction() {
            return direction;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, ResizeGroupBaseProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        foundationProps,
        () => ResizeGroupFoundation.getInitialState(),
        () => ({
            getGroupRef: () => group ?? null,
        })
    );

    // a handler that left the group (unmounted mid-drag) can still send events: the foundation ignores those
    setResizeGroupContext({
        get direction() {
            return direction;
        },
        registerItem: foundation.registerItem,
        registerHandler: foundation.registerHandler,
        notifyResizeStart: foundation.onResizeStart,
        notifyResizing: foundation.onResizing,
        notifyResizeEnd: foundation.onResizeEnd,
        notifyKeyDown: foundation.resizeByKey,
    });

    const observeResize = (node: HTMLDivElement) => {
        const observer = new ResizeObserver(() => {
            // a group first mounted inside display:none measures 0: lay out again once it becomes measurable
            foundation.handleGroupResize();
            foundation.ensureConstraint();
        });
        observer.observe(node);
        return () => observer.disconnect();
    };

    // vw and vh limits change with the window even when the group keeps its size
    $effect(() => on(window, 'resize', () => foundation.ensureConstraint()));
</script>

<!-- flex-direction follows `direction` even when the caller's style sets it -->
<div bind:this={group} {...rest} {@attach observeResize} class={[`${prefix}-group`, rest.class]} role={groupRole(rest)} style={joinStyle(rest.style as string | undefined, { flexDirection: direction === 'vertical' ? 'column' : 'row' })}>
    {#if states().isResizing}
        <div class={`${prefix}-background`} style={joinStyle(states().backgroundStyle as Record<string, string | undefined>)}></div>
    {/if}
    {@render children?.()}
</div>
