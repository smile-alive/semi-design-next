<script setup lang="ts">
    import { Comment, Text, computed, isVNode, onActivated, onDeactivated, onMounted, onUpdated, useId, useTemplateRef, watch, type VNode } from 'vue';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/carousel/constants';
    import CarouselFoundation, { type CarouselAdapter } from '@fibrae/semi-foundation/carousel/foundation';
    import '@fibrae/semi-foundation/carousel/carousel.scss';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import type { CarouselEmits, CarouselHandle, CarouselProps, CarouselSlots, CarouselState } from './interface';

    type Foundation = CarouselFoundation<CarouselProps, CarouselState>;
    type Adapter = CarouselAdapter<CarouselProps, CarouselState>;

    defineOptions({ name: 'Carousel' });

    const props = withDefaults(defineProps<CarouselProps & /* @vue-ignore */ ElementProps<'div', keyof CarouselProps | EmitHandlers<CarouselEmits>>>(), {
        activeIndex: semiGlobalDefault('Carousel', 'activeIndex'),
        animation: () => semiDefault('Carousel', 'animation', 'slide'),
        arrowProps: semiGlobalDefault('Carousel', 'arrowProps'),
        arrowType: () => semiDefault('Carousel', 'arrowType', 'always'),
        autoPlay: () => semiDefault('Carousel', 'autoPlay', true),
        defaultActiveIndex: () => semiDefault('Carousel', 'defaultActiveIndex', numbers.DEFAULT_ACTIVE_INDEX),
        indicatorPosition: () => semiDefault('Carousel', 'indicatorPosition', 'center'),
        indicatorSize: () => semiDefault('Carousel', 'indicatorSize', 'small'),
        indicatorType: () => semiDefault('Carousel', 'indicatorType', 'dot'),
        showArrow: () => semiDefault('Carousel', 'showArrow', true),
        showIndicator: () => semiDefault('Carousel', 'showIndicator', true),
        slideDirection: () => semiDefault('Carousel', 'slideDirection', 'left'),
        speed: () => semiDefault('Carousel', 'speed', numbers.DEFAULT_SPEED),
        theme: () => semiDefault('Carousel', 'theme', 'light'),
        trigger: () => semiDefault('Carousel', 'trigger', 'click'),
    });

    const emit = defineEmits<CarouselEmits>();
    const slots = defineSlots<CarouselSlots>();

    const config = useConfig();
    const i18n = useLocale('Carousel');

    const baseId = useId();

    // Used to find the indicator tab to focus, from the root: a ref inside the slot-scoped v-for would be an array.
    const root = useTemplateRef('root');

    // The foundation asks for the slide count from timers and mount hooks, where calling the slot would warn and track
    // nothing. Rendering writes it instead: the value is derived from the slot, so the write is idempotent.
    // Limit: the count is only as fresh as the last render, which is when the slides could have changed anyway.
    let slideCount = 0;

    // onActivated also runs after the first mount; only a return from the cache sets up again
    let deactivated = false;

    // the roving tabindex moves with the current slide, so focus follows it after a key changed it
    let focusPending = false;

    // Slides that arrive after mount (data still loading) start the configured autoplay, as mounting with them would.
    // A controlled carousel waits for its first switch, and a pointer under hoverToPause keeps the pause.
    let renderedCount = 0;

    const { foundation, state } = useFoundation<Foundation, Adapter, CarouselProps, CarouselState>(
        CarouselFoundation,
        props,
        (view) => {
            const activeIndex = CarouselFoundation.getDefaultActiveIndex(view);
            return { activeIndex, preIndex: activeIndex, isReverse: false, isInit: true, rotating: false };
        },
        (base) => ({
            notifyChange: (activeIndex, preIndex) => {
                emit('update:activeIndex', activeIndex);
                emit('change', activeIndex, preIndex);
            },
            setNewActiveIndex: (activeIndex) => base.setState({ activeIndex }),
            setPreActiveIndex: (preIndex) => base.setState({ preIndex }),
            setIsReverse: (isReverse) => base.setState({ isReverse }),
            setIsInit: (isInit) => base.setState({ isInit }),
            setRotating: (rotating) => base.setState({ rotating }),
            getSlideCount: () => slideCount,
        }),
        { context: () => config.value }
    );

    const animateStyle = computed(() => ({
        transitionTimingFunction: 'ease',
        transitionDuration: `${props.speed}ms`,
        animationTimingFunction: 'ease',
        animationDuration: `${props.speed}ms`,
    }));

    const content = cssClasses.CAROUSEL_CONTENT;
    const indicator = cssClasses.CAROUSEL_INDICATOR;
    const arrow = cssClasses.CAROUSEL_ARROW;

    const tabId = (index: number) => `${baseId}-tab-${index}`;

    const onMouseenter = () => foundation.handlePointerEnter();

    const onMouseleave = () => foundation.handlePointerLeave();

    // Only keyboard focus pauses: a mouse click on an arrow focuses it too.
    const onFocusin = (event: FocusEvent) => {
        if ((event.target as Element).matches(':focus-visible')) {
            foundation.handleKeyboardFocus();
        }
    };

    const onFocusout = (event: FocusEvent) => {
        if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) {
            foundation.handleFocusLeave();
        }
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (foundation.handleKeyDown(event)) {
            focusPending = true;
        }
    };

    const onTabBlur = () => {
        focusPending = false;
    };

    const collectSlides = (): KeyedNode[] => {
        const slides = slotNodes(slots.default?.() ?? []).filter(([node]) => node.type !== Text);
        slideCount = slides.length;
        return slides;
    };

    const currentIndex = (total: number) => CarouselFoundation.deriveActiveIndex(props, state.value, total);

    const hasIndicator = (total: number) => props.showIndicator && total > 1;

    // a slide keeps an id of its own, so links to it still work
    const slideId = (slides: KeyedNode[], index: number) => (slides[index][0].props?.id as string | undefined) ?? `${baseId}-slide-${index}`;

    // What the slide receives, merged into it by <component :is>: with indicators the slides are the panels of their
    // tabs (APG tabbed carousel), otherwise named groups.
    const slideAttrs = (slides: KeyedNode[], index: number) => {
        const total = slides.length;
        const current = currentIndex(total);
        const isCurrent = index === current;
        const { animation } = props;
        const { isInit, preIndex } = state.value;
        const a11y = hasIndicator(total)
            ? { id: slideId(slides, index), role: 'tabpanel', 'aria-labelledby': tabId(index) }
            : {
                  role: 'group',
                  'aria-roledescription': i18n.value.locale.slide,
                  'aria-label': (slides[index][0].props?.['aria-label'] as string | undefined) ?? i18n.value.locale.slideN.replace('${index}', String(index + 1)),
              };
        return {
            ...a11y,
            // hidden slides are only transparent or invisible, so take them out of focus and the a11y tree; '' because a
            // DOM without the inert property gets the attribute, where `false` would still write inert="false"
            inert: isCurrent ? undefined : '',
            style: animateStyle.value,
            class: {
                [`${content}-item-prev`]: index === (current - 1 + total) % total,
                [`${content}-item-next`]: index === (current + 1 + total) % total,
                [`${content}-item-current`]: isCurrent,
                [`${content}-item`]: true,
                [`${content}-item-active`]: isCurrent,
                [`${content}-item-slide-in`]: animation === 'slide' && !isInit && isCurrent,
                [`${content}-item-slide-out`]: animation === 'slide' && !isInit && index === preIndex,
            },
        };
    };

    // Text rendered inside a child component is invisible here; such arrows pass `aria-label` through arrowProps.
    const hasReadableText = (node: unknown): boolean => {
        if (typeof node === 'string') return node.trim() !== '';
        if (typeof node === 'number') return true;
        if (Array.isArray(node)) return node.some(hasReadableText);
        if (isVNode(node) && node.type !== Comment) {
            return (node.type !== Text && Boolean(node.props?.['aria-label'])) || hasReadableText(node.children);
        }
        return false;
    };

    // children with readable text name the button; arrowProps.*.props can set `aria-label` instead
    const arrowLabel = (slot: (() => VNode[]) | undefined, fallback: string) => (hasReadableText(slot?.()) ? undefined : fallback);

    watch(
        () => props.activeIndex,
        (activeIndex) => foundation.syncActiveIndex(activeIndex as number)
    );

    // a boolean, since autoPlay is often a fresh object literal on every render
    watch(
        () => CarouselFoundation.isAutoPlayOn(props.autoPlay),
        (autoPlayOn) => foundation.handleAutoPlayChange(autoPlayOn)
    );

    watch(
        () => CarouselFoundation.deriveActiveIndex(props, state.value, slideCount),
        () => {
            if (focusPending) {
                focusPending = false;
                // scoped to this carousel's own indicator: slides may contain tabs or nested carousels
                root.value?.querySelector<HTMLElement>(`:scope > .${indicator} [role="tab"][tabindex="0"]`)?.focus();
            }
        },
        { flush: 'post' }
    );

    // A cached carousel is out of the page, so it must not keep switching slides. mouseleave and focusout do not reach
    // it there, so the hover and focus pauses are dropped here and the configured autoplay restarts on activation.
    onDeactivated(() => {
        deactivated = true;
        foundation.resetPointer();
        foundation.stop();
        foundation.handleFocusLeave();
    });

    onActivated(() => {
        if (deactivated) {
            deactivated = false;
            foundation.init();
        }
    });

    onMounted(() => {
        renderedCount = slideCount;
    });

    onUpdated(() => {
        const previous = renderedCount;
        renderedCount = slideCount;
        foundation.handleSlideCountChange(previous, slideCount);
    });

    defineExpose<CarouselHandle>({
        play: () => {
            foundation.setForcePlay(true);
            foundation.handleAutoPlay();
        },
        stop: () => {
            foundation.stopByUser();
        },
        goTo: (targetIndex) => foundation.goTo(targetIndex),
        prev: () => foundation.prev(),
        next: () => foundation.next(),
    });
</script>

<template>
    <div ref="root" :aria-roledescription="i18n.locale.carousel" :class="cssClasses.CAROUSEL" role="region" @focusin="onFocusin" @focusout="onFocusout" @mouseenter="onMouseenter" @mouseleave="onMouseleave">
        <template v-for="(slides, n) in [collectSlides()]" :key="n">
            <!-- announce a slide the user switched to, never one that rotation brought -->
            <div :aria-live="state.rotating ? 'off' : 'polite'" :class="[`${content}-${props.animation}`, content, { [`${content}-reverse`]: props.slideDirection === 'left' ? state.isReverse : !state.isReverse }]" x-semi-prop="children">
                <component :is="node" v-for="([node, key], index) in slides" :key="key" v-bind="slideAttrs(slides, index)" />
            </div>
            <div v-if="hasIndicator(slides.length)" :class="indicator">
                <div :aria-label="i18n.locale.indicators" :class="[indicator, `${indicator}-${props.indicatorType}`, `${indicator}-${props.indicatorPosition}`]" role="tablist">
                    <button
                        v-for="(_, i) in slides"
                        :id="tabId(i)"
                        :key="i"
                        :aria-controls="slideId(slides, i)"
                        :aria-label="i18n.locale.slideN.replace('${index}', String(i + 1))"
                        :aria-selected="i === currentIndex(slides.length)"
                        :class="[`${indicator}-item`, { [`${indicator}-item-active`]: i === currentIndex(slides.length), [`${indicator}-item-${props.theme}`]: props.theme, [`${indicator}-item-${props.indicatorSize}`]: props.indicatorSize }]"
                        :data-index="i"
                        role="tab"
                        :tabindex="i === currentIndex(slides.length) ? 0 : -1"
                        type="button"
                        @blur="onTabBlur"
                        @click="props.trigger === 'click' && foundation.onIndicatorChange(i)"
                        @keydown="onKeydown"
                        @mouseenter="props.trigger === 'hover' && foundation.onIndicatorChange(i)"
                    />
                </div>
            </div>
            <div v-if="props.showArrow && slides.length > 1" :class="[arrow, `${arrow}-${props.theme}`, { [`${arrow}-hover`]: props.arrowType === 'hover' }]">
                <!-- arrowProps goes after the built-in aria-label so that its name wins; class and onClick merge -->
                <button :aria-label="arrowLabel($slots.leftArrow, i18n.locale.prev)" :class="[`${arrow}-prev`, `${arrow}-${props.theme}`]" type="button" v-bind="props.arrowProps?.leftArrow?.props" x-semi-prop="leftArrow" @click="foundation.prev()">
                    <slot v-if="$slots.leftArrow" name="leftArrow" />
                    <IconChevronLeft v-else size="inherit" />
                </button>
                <button :aria-label="arrowLabel($slots.rightArrow, i18n.locale.next)" :class="[`${arrow}-next`, `${arrow}-${props.theme}`]" type="button" v-bind="props.arrowProps?.rightArrow?.props" x-semi-prop="rightArrow" @click="foundation.next()">
                    <slot v-if="$slots.rightArrow" name="rightArrow" />
                    <IconChevronRight v-else size="inherit" />
                </button>
            </div>
        </template>
    </div>
</template>
