<script setup lang="ts">
    import { computed, onUpdated, useTemplateRef, watch } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/anchor/constants';
    import AnchorFoundation, { type AnchorAdapter, type AnchorBaseState } from '@fibrae/semi-foundation/components/anchor/foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/components/anchor/anchor.scss';
    import type { ElementProps, EmitHandlers } from '../../base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../../base/semi-default';
    import useFoundation from '../../base/use-foundation';
    import useKeepAliveFoundation from '../../base/use-keep-alive-foundation';
    import useResizeObserver from '../../composables/use-resize-observer';
    import useLocale from '../locale/use-locale';
    import { provideAnchorContext } from './context';
    import type { AnchorClickEvent, AnchorEmits, AnchorProps, AnchorSlots } from './interface';

    type Foundation = AnchorFoundation<AnchorProps, AnchorClickEvent>;
    type Adapter = AnchorAdapter<AnchorProps, AnchorClickEvent>;

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

    const { foundation, state } = useFoundation<Foundation, Adapter, AnchorProps, AnchorBaseState>(
        AnchorFoundation,
        props,
        () => AnchorFoundation.getInitialState(),
        () => ({
            getContainer: () => getContainer.value(),
            getRoot: () => root.value,
            notifyChange: (currentLink, previousLink) => emit('change', currentLink, previousLink),
            notifyClick: (e, link) => emit('click', e, link),
        })
    );

    // while cached, an update or a container change must not bind the scroll listeners
    const { isDeactivated } = useKeepAliveFoundation(foundation);

    const childMap = computed(() => AnchorFoundation.getRegisteredChildMap(state.value.linkParents));

    provideAnchorContext({
        view: computed(() => ({
            activeLink: state.value.activeLink,
            autoCollapse: props.autoCollapse,
            childMap: childMap.value,
            position: props.position,
            showTooltip: props.showTooltip,
            size: props.size,
        })),
        level: 1,
        parentHref: () => undefined,
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
