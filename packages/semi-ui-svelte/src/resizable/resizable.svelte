<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
    import { ResizableFoundation, type ResizableAdapter, type ResizableBaseProps, type ResizableBaseState } from '@fibrae/semi-foundation/resizable/foundation';
    import { directions, type Direction } from '@fibrae/semi-foundation/resizable/types';
    import { getStringSize, isKeyboardEdge } from '@fibrae/semi-foundation/resizable/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
    import '@fibrae/semi-foundation/resizable/resizable.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { ResizableProps } from './interface.js';
    import { joinStyle } from './style.js';

    type Foundation = ResizableFoundation<ResizableBaseProps>;
    type Adapter = ResizableAdapter<ResizableBaseProps>;

    const defaults = useDefaultProps('Resizable');

    let {
        size = defaults('size'),
        defaultSize = defaults('defaultSize'),
        enable = defaults('enable', { top: true, right: true, bottom: true, left: true, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true }),
        grid = defaults('grid', [1, 1]),
        snap = defaults('snap'),
        snapGap = defaults('snapGap', 0),
        boundElement = defaults('boundElement'),
        boundsByDirection = defaults('boundsByDirection'),
        minWidth = defaults('minWidth'),
        minHeight = defaults('minHeight'),
        maxWidth = defaults('maxWidth'),
        maxHeight = defaults('maxHeight'),
        lockAspectRatio = defaults('lockAspectRatio', false),
        lockAspectRatioExtraWidth = defaults('lockAspectRatioExtraWidth', 0),
        lockAspectRatioExtraHeight = defaults('lockAspectRatioExtraHeight', 0),
        scale = defaults('scale', 1),
        ratio = defaults('ratio', 1),
        handleStyle = defaults('handleStyle'),
        handleClass = defaults('handleClass'),
        handleWrapperStyle = defaults('handleWrapperStyle'),
        handleWrapperClass = defaults('handleWrapperClass'),
        onResizeStart = defaults('onResizeStart'),
        onChange,
        onResizeEnd,
        children,
        handle,
        ...rest
    }: ResizableProps = $props();

    const locale = useLocale('Resizable');

    let root = $state<HTMLDivElement>();

    // the foundation reads the props through getters, so it always sees the current values
    const foundationProps: ResizableBaseProps = {
        get size() {
            return size;
        },
        get defaultSize() {
            return defaultSize;
        },
        get grid() {
            return grid;
        },
        get snap() {
            return snap;
        },
        get snapGap() {
            return snapGap;
        },
        get boundElement() {
            return boundElement;
        },
        get boundsByDirection() {
            return boundsByDirection;
        },
        get minWidth() {
            return minWidth;
        },
        get minHeight() {
            return minHeight;
        },
        get maxWidth() {
            return maxWidth;
        },
        get maxHeight() {
            return maxHeight;
        },
        get lockAspectRatio() {
            return lockAspectRatio;
        },
        get lockAspectRatioExtraWidth() {
            return lockAspectRatioExtraWidth;
        },
        get lockAspectRatioExtraHeight() {
            return lockAspectRatioExtraHeight;
        },
        get scale() {
            return scale;
        },
        get ratio() {
            return ratio;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, ResizableBaseProps, ResizableBaseState>(
        ResizableFoundation,
        foundationProps,
        (view) => {
            const propSize = ResizableFoundation.getPropSize(view);
            return {
                isResizing: false,
                width: propSize.width ?? 'auto',
                height: propSize.height ?? 'auto',
                direction: 'right',
                original: { x: 0, y: 0, width: 0, height: 0 },
                backgroundStyle: { cursor: 'auto' },
                flexBasis: undefined,
            };
        },
        () => ({
            getResizable: () => root ?? null,
            notifyResizeStart: (e, direction) => onResizeStart?.(e, direction),
            notifyChange: (next, event, direction) => onChange?.(next, event, direction),
            notifyResizeEnd: (next, event, direction) => onResizeEnd?.(next, event, direction),
        })
    );

    const prefix = cssClasses.PREFIX;
    const enabledDirections = $derived(enable ? directions.filter((dir) => enable[dir] !== false) : []);

    // The caller's style sits between the min/max style and the computed size, so a caller's width, height or
    // flex-basis cannot freeze the drag
    const rootStyle = $derived.by(() => {
        const { isResizing, flexBasis } = states();
        return joinStyle(
            { userSelect: isResizing ? 'none' : 'auto', maxWidth: toCssLength(maxWidth), maxHeight: toCssLength(maxHeight), minWidth: toCssLength(minWidth), minHeight: toCssLength(minHeight) },
            rest.style as string | undefined,
            ResizableFoundation.getSizeStyle(foundationProps, states()),
            flexBasis ? { flexBasis: getStringSize(flexBasis) } : undefined
        );
    });

    const separatorAttrs = (dir: Direction): HTMLAttributes<HTMLDivElement> => {
        if (!enable || !isKeyboardEdge(enable, dir)) {
            return {};
        }
        const horizontal = dir === 'right' || dir === 'left';
        const range = states().ariaRange?.[horizontal ? 'width' : 'height'];
        const text = locale().locale;
        return {
            role: 'separator',
            tabindex: 0,
            'aria-orientation': horizontal ? 'vertical' : 'horizontal',
            'aria-label': horizontal ? text.resizeWidth : text.resizeHeight,
            'aria-valuenow': range && Math.round(range.now),
            'aria-valuemin': range && Math.round(range.min),
            'aria-valuemax': range && Math.round(range.max),
            onkeydown: (e: KeyboardEvent) => {
                if (foundation.resizeByKey(dir, e)) {
                    e.preventDefault();
                }
            },
        };
    };

    const handlePointerdown = (dir: Direction, e: PointerEvent & { currentTarget: HTMLElement }) => {
        if (isSecondaryPress(e)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        foundation.onResizeStart(e, dir);
    };

    const observeResize = (node: HTMLDivElement) => {
        const observer = new ResizeObserver(foundation.updateAriaRange);
        observer.observe(node);
        return () => observer.disconnect();
    };
</script>

<div bind:this={root} {...rest} {@attach observeResize} class={[`${prefix}-resizable`, rest.class]} role={groupRole(rest)} style={rootStyle}>
    {#if states().isResizing}
        <div class={`${prefix}-background`} style={joinStyle(states().backgroundStyle as Record<string, string | undefined>)}></div>
    {/if}
    {@render children?.()}
    {#if enable}
        <div class={handleWrapperClass} style={handleWrapperStyle}>
            {#each enabledDirections as dir (dir)}
                <div {...separatorAttrs(dir)} class={[handleClass?.[dir], `${prefix}-resizableHandler`, `${prefix}-resizableHandler-${dir}`]} style={handleStyle?.[dir]} onlostpointercapture={foundation.onResizeEnd} onpointerdown={(e) => handlePointerdown(dir, e)} onpointermove={foundation.onResizing}>
                    {@render handle?.({ direction: dir })}
                </div>
            {/each}
        </div>
    {/if}
</div>
