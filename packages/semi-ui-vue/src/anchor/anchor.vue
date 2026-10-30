<script setup lang="ts">
    import { computed, onUpdated, useTemplateRef, watch } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/anchor/constants';
    import AnchorFoundation, { type AnchorAdapter } from '@fibrae/semi-foundation/anchor/foundation';
    import { findAnchorTarget } from '@fibrae/semi-foundation/anchor/utils';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/anchor/anchor.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import useKeepAliveFoundation from '../_base/use-keep-alive-foundation';
    import useResizeObserver from '../_base/use-resize-observer';
    import useLocale from '../locale/use-locale';
    import { provideAnchorContext } from './context';
    import type { AnchorClickEvent, AnchorEmits, AnchorProps, AnchorSlots, AnchorState } from './interface';

    type Foundation = AnchorFoundation<AnchorProps, AnchorState, AnchorClickEvent>;
    type Adapter = AnchorAdapter<AnchorProps, AnchorState, AnchorClickEvent>;

    defineOptions({ name: 'Anchor' });

    const props = withDefaults(defineProps<AnchorProps & /* @vue-ignore */ ElementProps<'div', keyof AnchorProps | EmitHandlers<AnchorEmits>>>(), {
        autoCollapse: () => semiDefault('Anchor', 'autoCollapse', false),
        defaultAnchor: () => semiDefault('Anchor', 'defaultAnchor', ''),
        // Function-typed props cannot take a factory default; the global default is read in getContainer below.
        getContainer: undefined,
        maxHeight: () => semiDefault('Anchor', 'maxHeight', strings.MAX_HEIGHT),
        maxWidth: () => semiDefault('Anchor', 'maxWidth', strings.MAX_WIDTH),
        offsetTop: () => semiDefault('Anchor', 'offsetTop', 0),
        position: semiGlobalDefault('Anchor', 'position'),
        railTheme: () => semiDefault('Anchor', 'railTheme', 'primary'),
        scrollMotion: () => semiDefault('Anchor', 'scrollMotion', false),
        scrollIntoViewOptions: semiGlobalDefault('Anchor', 'scrollIntoViewOptions'),
        showTooltip: () => semiDefault('Anchor', 'showTooltip', false),
        size: () => semiDefault('Anchor', 'size', 'default'),
        targetOffset: () => semiDefault('Anchor', 'targetOffset', 0),
    });

    const emit = defineEmits<AnchorEmits>();
    defineSlots<AnchorSlots>();

    const semi = useSemiGlobal();
    const locale = useLocale('Anchor');

    const root = useTemplateRef('root');
    const linkWrapper = useTemplateRef('linkWrapper');

    const prefix = cssClasses.PREFIX;
    const getContainer = computed(() => props.getContainer ?? readSemiDefault(semi, 'Anchor', 'getContainer', () => window));

    const { foundation, state } = useFoundation<Foundation, Adapter, AnchorProps, AnchorState>(
        AnchorFoundation,
        props,
        () => ({ activeLink: '', links: [], clickLink: false, slideBarTop: '0' }),
        () => ({
            getContainer: () => getContainer.value() || window,
            getAnchorNode: (selector) => root.value?.querySelector<HTMLElement>(selector) ?? null,
            getContentNode: (link) => findAnchorTarget(root.value, link),
            notifyChange: (currentLink, previousLink) => emit('change', currentLink, previousLink),
            notifyClick: (e, link) => emit('click', e, link),
        })
    );

    // init is not replayed: it would reset the active link to defaultAnchor and scroll the page back to it. While cached,
    // an update or a container change must not bind the scroll listeners.
    const { isDeactivated } = useKeepAliveFoundation(foundation, {
        reactivate: () => {
            foundation.connect();
            foundation.handleContainerChange();
        },
    });

    provideAnchorContext({
        view: computed(() => ({
            activeLink: state.value.activeLink,
            autoCollapse: props.autoCollapse,
            position: props.position,
            showTooltip: props.showTooltip,
            size: props.size,
        })),
        level: 1,
        onClick: foundation.handleClick,
        addLink: foundation.addLink,
        removeLink: foundation.removeLink,
    });

    // getContainer may return a later node: the watch tracks refs it reads, onUpdated non-reactive queries
    onUpdated(() => {
        if (!isDeactivated()) {
            foundation.handleContainerChange();
        }
        // links above the active one can move it without the active link changing
        foundation.syncSlideBar();
    });

    // a narrower container wraps link titles, which moves the active link without any update
    useResizeObserver(linkWrapper, foundation.syncSlideBar);

    watch(
        () => getContainer.value(),
        () => {
            if (!isDeactivated()) {
                foundation.handleContainerChange();
            }
        },
        { flush: 'post' }
    );
</script>

<template>
    <div ref="root" :aria-label="locale.locale.label" :class="[prefix, `${prefix}-size-${props.size}`]" role="navigation" :style="{ maxWidth: toCssLength(props.maxWidth), maxHeight: toCssLength(props.maxHeight) }">
        <div :class="`${prefix}-rail-wrapper`">
            <div aria-hidden="true" :class="[`${prefix}-slide`, `${prefix}-slide-${props.railTheme}`]">
                <span :class="[`${prefix}-slide-bar`, `${prefix}-slide-bar-${props.size}`, `${prefix}-slide-bar-${props.railTheme}`, { [`${prefix}-slide-bar-active`]: state.activeLink }]" :style="{ top: state.slideBarTop }" />
            </div>
            <div ref="linkWrapper" :class="`${prefix}-link-wrapper`" role="list">
                <slot />
            </div>
        </div>
    </div>
</template>
