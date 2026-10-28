<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/collapsible/constants';
    import CollapsibleFoundation, { type CollapsibleAdapter, type CollapsibleBaseProps } from '@fibrae/semi-foundation/collapsible/foundation';
    import '@fibrae/semi-foundation/collapsible/collapsible.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import type { CollapsibleEmits, CollapsibleProps, CollapsibleSlots } from './interface';

    type Foundation = CollapsibleFoundation<CollapsibleBaseProps>;
    type Adapter = CollapsibleAdapter<CollapsibleBaseProps>;

    const props = withDefaults(defineProps<CollapsibleProps & /* @vue-ignore */ ElementProps<'div', keyof CollapsibleProps | EmitHandlers<CollapsibleEmits>>>(), {
        isOpen: () => semiDefault('Collapsible', 'isOpen', false),
        duration: () => semiDefault('Collapsible', 'duration', 250),
        motion: () => semiDefault('Collapsible', 'motion', true),
        keepDOM: () => semiDefault('Collapsible', 'keepDOM', false),
        lazyRender: () => semiDefault('Collapsible', 'lazyRender', false),
        collapseHeight: () => semiDefault('Collapsible', 'collapseHeight', 0),
        collapseHeightAdaptive: () => semiDefault('Collapsible', 'collapseHeightAdaptive', false),
        fade: () => semiDefault('Collapsible', 'fade', false),
        // A global id would repeat on every instance.
        id: undefined,
    });

    const emit = defineEmits<CollapsibleEmits>();
    defineSlots<CollapsibleSlots>();

    // Derived once up front, so an adapter write never starts from an underived view.
    const view = shallowRef(CollapsibleFoundation.deriveView(props, CollapsibleFoundation.getInitialView(props)));
    const wrapper = useTemplateRef('wrapper');

    const next = computed(() => CollapsibleFoundation.deriveView(props, view.value));
    const transitioning = computed(() => CollapsibleFoundation.isInTransition(props, next.value));
    const wrapperStyle = computed(() => CollapsibleFoundation.getWrapperStyle(props, next.value));
    const shouldRender = computed(() => CollapsibleFoundation.shouldRender(props, next.value));

    // Pre flush: written back before this component renders, so the new height and the transition class reach the DOM
    // in the same patch. Splitting them over two patches would start the transition at 0ms.
    watch(next, (value) => {
        view.value = value;
    });

    const { foundation } = useFoundation<Foundation, Adapter, CollapsibleBaseProps, object>(
        CollapsibleFoundation,
        props,
        () => ({}),
        () => ({
            setVisible: (visible) => {
                if (next.value.visible !== visible) view.value = { ...next.value, visible };
            },
            setIsTransitioning: (isTransitioning) => {
                if (next.value.isTransitioning !== isTransitioning) view.value = { ...next.value, isTransitioning };
            },
            notifyMotionEnd: () => emit('motionEnd'),
            getWrapper: () => wrapper.value,
        })
    );

    const handleTransitionEnd = (event: TransitionEvent) =>
        foundation.handleTransitionEnd({
            isSelf: event.target === event.currentTarget,
            propertyName: event.propertyName,
        });

    watch(
        () => props.isOpen,
        () => foundation.handleOpenChange(),
        { flush: 'post' }
    );
</script>

<template>
    <div ref="wrapper" :class="[`${cssClasses.PREFIX}-wrapper`, { [`${cssClasses.PREFIX}-transition`]: transitioning }]" :style="wrapperStyle" @transitionend="handleTransitionEnd">
        <!-- With collapseHeight > 0 a preview stays visible, so the content is not inert. A boolean false would render
            inert="false" where the DOM has no inert property, so the attribute is removed with undefined instead. -->
        <div :id="props.id" :inert="!props.isOpen && props.collapseHeight === 0 ? 'true' : undefined" style="overflow: hidden" x-semi-prop="children">
            <slot v-if="shouldRender" />
        </div>
    </div>
</template>
