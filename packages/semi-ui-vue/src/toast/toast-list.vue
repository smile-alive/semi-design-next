<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef, watch } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/toast/constants';
    import type { ToastInstance } from '@fibrae/semi-foundation/toast/toast-foundation';
    import type { ToastListProps } from '@fibrae/semi-foundation/toast/toast-list-foundation';
    import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/toast/toast.scss';
    import useAnnouncer from '../_base/use-announcer';
    import useStoreSnapshot from '../_base/use-store-snapshot';
    import { provideToastListContext } from './context';
    import ToastItem from './toast.vue';

    const props = defineProps<ToastListProps>();

    const innerWrapper = useTemplateRef('innerWrapper');
    const pointerInside = shallowRef(false);
    const focusInside = shallowRef(false);
    const stackExpanded = shallowRef(false);

    const snapshot = useStoreSnapshot(props.store);
    const { text: announcement, announcer } = useAnnouncer();

    const prefix = cssClasses.PREFIX;
    const paused = computed(() => pointerInside.value || focusInside.value);
    const sources = { pointer: pointerInside, focus: focusInside };
    const list = computed(() => snapshot.value.list);
    const rows = computed(() => list.value.map((item, index) => ({ id: item.id, item, newerShown: list.value.length - 1 - index })));
    const expanded = computed(() => snapshot.value.stack === 0 || stackExpanded.value || list.value.length <= snapshot.value.stack);

    provideToastListContext(computed(() => ({ paused: paused.value, updatedItems: snapshot.value.updatedItems, announce: (key, read) => announcer.announce(key, read) })));

    const enter = (source: keyof typeof sources) => {
        sources[source].value = true;
        if (snapshot.value.stack) stackExpanded.value = true;
    };

    const leave = (source: keyof typeof sources) => {
        sources[source].value = false;
        if (!paused.value && snapshot.value.stack && innerWrapper.value?.getBoundingClientRect().height) {
            stackExpanded.value = false;
        }
    };

    const onFocusOut = (event: FocusEvent) => {
        if (!innerWrapper.value?.contains(event.relatedTarget as Node | null)) leave('focus');
    };

    // A removed focused toast fires no reliable focusout, which would keep every countdown paused. Checked after the
    // leave, since the leaving element keeps the focus until TransitionGroup removes it.
    const onAfterLeave = () => {
        // An emptied list has no height, so leave() never collapses it; without this the next batch would start expanded.
        if (!snapshot.value.list.length) stackExpanded.value = false;
        if (focusInside.value && !innerWrapper.value?.contains(FocusTrapHandle.getActiveElement(innerWrapper.value))) leave('focus');
    };

    // List-level options would otherwise land on the toast element as attributes like zindex="1010".
    const itemProps = (item: ToastInstance) => omit(item, ['top', 'bottom', 'left', 'right', 'zIndex', 'getPopupContainer', 'stack']);

    // The store keeps a removed toast until the renderer reports its leave ended (React waits for its own animation);
    // TransitionGroup keeps the leaving element itself, so the store's copy is finished right away.
    watch(
        () => snapshot.value.removedItems,
        (items) => {
            for (const { id } of items) {
                if (id) props.store.finishLeave(id);
            }
        },
        { flush: 'post' }
    );
</script>

<template>
    <!-- Stays mounted so it is registered as a live region before any message is written into it -->
    <div aria-atomic="true" aria-live="polite" :class="`${prefix}-announcer`">{{ announcement }}</div>
    <div ref="innerWrapper" :class="[`${prefix}-innerWrapper`, { [`${prefix}-innerWrapper-hover`]: expanded }]" @focusin="enter('focus')" @focusout="onFocusOut" @mouseenter="enter('pointer')" @mouseleave="leave('pointer')">
        <TransitionGroup appear :enterActiveClass="`${prefix}-animation-show`" :leaveActiveClass="`${prefix}-animation-hide`" :name="prefix" type="animation" @afterLeave="onAfterLeave" @enter="pinAnimatedHeight($event)" @leave="pinAnimatedHeight($event)">
            <ToastItem
                v-for="row in rows"
                :key="row.id"
                v-bind="itemProps(row.item)"
                :class="{ [`${prefix}-stack-hidden`]: !expanded && row.newerShown >= numbers.stackVisibleCount }"
                :positionInList="{ length: list.length, index: list.length - 1 - row.newerShown }"
                :stack="snapshot.stack > 0"
                :stackExpanded="expanded"
                @remove="props.store.remove($event)"
            />
        </TransitionGroup>
    </div>
</template>
