<script lang="ts">
    import { on } from 'svelte/events';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseProps, type ResizeGroupBaseState } from '@fibrae/semi-foundation/resizable/foundation';
    import '@fibrae/semi-foundation/resizable/resizable.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { setResizeGroupContext, type ResizeItemEntry } from './context.js';
    import type { ResizeGroupProps } from './interface.js';
    import { joinStyle } from './style.js';

    type Foundation = ResizeGroupFoundation<ResizeGroupBaseProps>;
    type Adapter = ResizeGroupAdapter<ResizeGroupBaseProps>;

    const defaults = useDefaultProps('ResizeGroup');
    let { direction = defaults('direction', 'horizontal'), children, ...rest }: ResizeGroupProps = $props();

    let group = $state<HTMLDivElement>();

    const prefix = cssClasses.PREFIX;

    // Items and handlers register when they mount: tree order on mount, but one inserted later registers last. Index =
    // layout order, which is DOM order; it is read on use because items can come and go. The foundation reads them only
    // after mount, so they need not be reactive.
    const items: ResizeItemEntry[] = [];
    const handlers: HTMLDivElement[] = [];

    const foundationProps: ResizeGroupBaseProps = {
        get direction() {
            return direction;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, ResizeGroupBaseProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        foundationProps,
        () => ({
            isResizing: false,
            originalPosition: { x: 0, y: 0, lastItemSize: 0, nextItemSize: 0 },
            backgroundStyle: { cursor: 'auto' },
            curHandler: null,
        }),
        () => ({
            getGroupRef: () => group ?? null,
            getItem: (index) => orderedItems()[index].el,
            getItemCount: () => items.length,
            getHandler: (index) => orderedHandlers()[index],
            getHandlerCount: () => handlers.length,
            getItemMin: (index) => orderedItems()[index].min(),
            getItemMax: (index) => orderedItems()[index].max(),
            getItemStart: (index) => orderedItems()[index].start,
            getItemChange: (index) => orderedItems()[index].change,
            getItemEnd: (index) => orderedItems()[index].end,
            getItemDefaultSize: (index) => orderedItems()[index].defaultSize(),
        })
    );

    function inDocumentOrder(a: Node, b: Node) {
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    }

    function orderedItems() {
        return items.toSorted((a, b) => inDocumentOrder(a.el, b.el));
    }

    function orderedHandlers() {
        return handlers.toSorted(inDocumentOrder);
    }

    const remove =
        <T>(list: T[], value: T) =>
        () => {
            list.splice(list.indexOf(value), 1);
        };

    setResizeGroupContext({
        get direction() {
            return direction;
        },
        registerItem: (entry) => {
            items.push(entry);
            return remove(items, entry);
        },
        registerHandler: (handler) => {
            handlers.push(handler);
            return remove(handlers, handler);
        },
        // a handler that left the group (unmounted mid-drag) can still send events: those are ignored
        notifyResizeStart: (handler, e) => {
            const index = orderedHandlers().indexOf(handler);
            if (index >= 0) {
                foundation.onResizeStart(index, e);
            }
        },
        notifyResizing: (handler, e) => {
            if (handlers.includes(handler)) {
                foundation.onResizing(e);
            }
        },
        notifyResizeEnd: (handler, e) => {
            if (handlers.includes(handler)) {
                foundation.onResizeEnd(e);
            }
        },
        notifyKeyDown: (handler, e) => {
            const index = orderedHandlers().indexOf(handler);
            return index >= 0 && foundation.resizeByKey(index, e);
        },
    });

    const observeResize = (node: HTMLDivElement) => {
        const observer = new ResizeObserver(() => {
            // a group first mounted inside display:none measures 0: lay out again once it becomes measurable
            foundation.handleGroupResize();
            // a container change without a window resize can leave px limits violated
            foundation.ensureConstraint();
        });
        observer.observe(node);
        return () => observer.disconnect();
    };

    watch(() => direction, foundation.handleDirectionChange);

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
