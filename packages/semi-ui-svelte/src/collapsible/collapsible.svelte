<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/collapsible/constants';
    import CollapsibleFoundation, { type CollapsibleAdapter, type CollapsibleBaseProps } from '@fibrae/semi-foundation/collapsible/foundation';
    import '@fibrae/semi-foundation/collapsible/collapsible.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import type { CollapsibleProps } from './interface.js';

    type Foundation = CollapsibleFoundation<CollapsibleBaseProps>;
    type Adapter = CollapsibleAdapter<CollapsibleBaseProps>;

    const defaults = useDefaultProps('Collapsible');

    // `id` has no global default: one id would repeat on every instance
    let {
        isOpen = defaults('isOpen', false),
        duration = defaults('duration', 250),
        motion = defaults('motion', true),
        keepDOM = defaults('keepDOM', false),
        lazyRender = defaults('lazyRender', false),
        collapseHeight = defaults('collapseHeight', 0),
        collapseHeightAdaptive = defaults('collapseHeightAdaptive', false),
        fade = defaults('fade', false),
        id,
        onMotionEnd,
        children,
        ...rest
    }: CollapsibleProps = $props();

    let root = $state<HTMLDivElement>();

    // the foundation reads the props through getters, so it always sees the current values
    const foundationProps: CollapsibleBaseProps = {
        get isOpen() {
            return isOpen;
        },
        get duration() {
            return duration;
        },
        get motion() {
            return motion;
        },
        get keepDOM() {
            return keepDOM;
        },
        get lazyRender() {
            return lazyRender;
        },
        get collapseHeight() {
            return collapseHeight;
        },
        get collapseHeightAdaptive() {
            return collapseHeightAdaptive;
        },
        get fade() {
            return fade;
        },
    };

    // derived once up front, so an adapter write never starts from an underived view
    let view = $state.raw(CollapsibleFoundation.deriveView(foundationProps, CollapsibleFoundation.getInitialView(foundationProps)));

    const { foundation } = useFoundation<Foundation, Adapter, CollapsibleBaseProps, object>(
        CollapsibleFoundation,
        foundationProps,
        () => ({}),
        () => ({
            setVisible: (visible) => {
                if (next.visible !== visible) view = { ...next, visible };
            },
            setIsTransitioning: (isTransitioning) => {
                if (next.isTransitioning !== isTransitioning) view = { ...next, isTransitioning };
            },
            notifyMotionEnd: () => onMotionEnd?.(),
            getWrapper: () => root ?? null,
        })
    );

    const next = $derived(CollapsibleFoundation.deriveView(foundationProps, view));
    const transitioning = $derived(CollapsibleFoundation.isInTransition(foundationProps, next));
    const shouldRender = $derived(CollapsibleFoundation.shouldRender(foundationProps, next));

    const wrapperStyle = $derived(
        Object.entries(CollapsibleFoundation.getWrapperStyle(foundationProps, next))
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => `${key.startsWith('--') ? key : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`)
            .join(';')
    );

    const handleTransitionEnd = (event: TransitionEvent & { currentTarget: HTMLDivElement }) => {
        rest.ontransitionend?.(event);
        foundation.handleTransitionEnd({
            isSelf: event.target === event.currentTarget,
            propertyName: event.propertyName,
        });
    };

    // Pre flush: written back before this component renders, so the new height and the transition class reach the DOM
    // in the same patch. Splitting them over two patches would start the transition at 0ms.
    $effect.pre(() => {
        view = next;
    });

    watch(() => isOpen, foundation.handleOpenChange);
</script>

<!-- With collapseHeight > 0 a preview stays visible, so the content is not inert -->
<div bind:this={root} {...rest} class={[`${cssClasses.PREFIX}-wrapper`, rest.class, { [`${cssClasses.PREFIX}-transition`]: transitioning }]} style={rest.style ? `${wrapperStyle};${rest.style}` : wrapperStyle} ontransitionend={handleTransitionEnd}>
    <div {id} inert={!isOpen && collapseHeight === 0 ? true : undefined} style="overflow: hidden" x-semi-prop="children">
        {#if shouldRender}
            {@render children?.()}
        {/if}
    </div>
</div>
