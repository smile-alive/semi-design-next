<script setup lang="ts">
    import { onMounted, onUpdated, shallowRef, useTemplateRef, type VNode } from 'vue';
    import { cssClasses, numbers } from '@fibrae/semi-ai-foundation/ai-chat-input/constants';
    import { IconChevronRightStroked } from '@fibrae/semi-icons-vue';
    import { useFocusHandover, useLocale, useResizeObserver } from '@fibrae/semi-ui-vue/hooks';

    defineSlots<{ default?: () => VNode[] }>();

    const i18n = useLocale('AIChatInput');

    const wrapper = useTemplateRef('wrapper');
    const container = useTemplateRef('container');
    const canScrollLeft = shallowRef(false);
    const canScrollRight = shallowRef(false);

    const prefix = cssClasses.PREFIX;

    // a button unmounts when its direction runs out; keyboard focus moves to the opposite one instead of the body
    const handoverFromLeft = useFocusHandover(() => wrapper.value?.querySelector<HTMLElement>(`.${prefix}-scroll-button-right`));
    const handoverFromRight = useFocusHandover(() => wrapper.value?.querySelector<HTMLElement>(`.${prefix}-scroll-button-left`));

    const check = () => {
        const element = container.value;
        if (element) {
            const { scrollLeft, scrollWidth, clientWidth } = element;
            canScrollLeft.value = scrollLeft > 1;
            canScrollRight.value = Math.ceil(scrollLeft) < scrollWidth - clientWidth;
        }
    };

    // Known limitation: the scroll step is fixed; expose it as a prop if callers need to tune it
    const scroll = (amount: number) => container.value?.scrollBy({ left: amount, behavior: 'smooth' });

    useResizeObserver(container, check);

    onMounted(check);

    // new children can widen the content without resizing the container
    onUpdated(check);
</script>

<template>
    <div ref="wrapper" :class="`${prefix}-scroll-wrapper`">
        <button v-if="canScrollLeft" :ref="handoverFromLeft" :aria-label="i18n.locale.scrollLeft" :class="[`${prefix}-scroll-button`, `${prefix}-scroll-button-left`]" type="button" @click="scroll(-numbers.SCROLL_AMOUNT)">
            <IconChevronRightStroked :class="`${prefix}-scroll-button-left-icon`" />
        </button>
        <div ref="container" :class="`${prefix}-scroll-container`" @scroll="check">
            <slot />
        </div>
        <button v-if="canScrollRight" :ref="handoverFromRight" :aria-label="i18n.locale.scrollRight" :class="[`${prefix}-scroll-button`, `${prefix}-scroll-button-right`]" type="button" @click="scroll(numbers.SCROLL_AMOUNT)">
            <IconChevronRightStroked />
        </button>
    </div>
</template>
