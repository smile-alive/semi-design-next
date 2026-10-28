<script setup lang="ts">
    import { computed, shallowRef, useTemplateRef, watch } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses, getStackThreshold } from '@fibrae/semi-foundation/notification/constants';
    import type { NoticeInstance, NoticePosition } from '@fibrae/semi-foundation/notification/notification-foundation';
    import type { default as NotificationListStore } from '@fibrae/semi-foundation/notification/notification-list-foundation';
    import { pinAnimatedHeight } from '@fibrae/semi-foundation/utils/animated-height';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import { readSemiDefault, useSemiGlobal } from '../_base/semi-default';
    import { provideNoticeListContext, type ListedNotice } from './context';
    import Notice from './notice.vue';

    interface NoticeListProps {
        placement: NoticePosition;
        /** The position's notices, newest first, leaving ones included */
        items: ListedNotice[];
        removedIds: readonly string[];
        updatedItems: readonly NoticeInstance[];
        store: NotificationListStore;
        announce: (key: string, read: () => string) => void;
    }

    // One list per position: pointer and focus state goes when the position empties, so an unmounted list cannot leave
    // notices paused.
    defineOptions({ inheritAttrs: false });
    const props = defineProps<NoticeListProps>();

    const semi = useSemiGlobal();

    const listEl = useTemplateRef('listEl');
    const pointerInside = shallowRef(false);
    const focusInside = shallowRef(false);

    // shortcut: the enter class sits on the stack item, so a stack collapsing during a notice's enter drops that item's
    // height to zero at once instead of easing; move the height animation onto the notice or use Web Animations if it shows.
    // The list is keyed by position and unmounts with its last item, which would cut that notice's leave short. So the
    // store keeps this position's removed notices until no leave here is running. TransitionGroup reports a leave by
    // element only, which is why they are finished together rather than one by one.
    let leaving = 0;

    const prefix = cssClasses.NOTICE;
    const paused = computed(() => pointerInside.value || focusInside.value);
    const offsets = ['top', 'bottom', 'left', 'right'] as const;

    // Vue does not add px to numbers in style bindings. The newest notice decides the list's offsets.
    const listStyle = computed(() => {
        const newest = props.items[0];
        return Object.fromEntries(
            offsets.map((key) => {
                const value = newest[key] ?? readSemiDefault(semi, 'Notification', key);
                return [key, toCssLength(value)];
            })
        );
    });

    const threshold = computed(() => getStackThreshold(props.items[0].stack ?? readSemiDefault(semi, 'Notification', 'stack')));

    // TransitionGroup keeps a leaving notice's element by itself, so only the shown notices are its children.
    const shown = computed(() => props.items.filter((item) => !props.removedIds.includes(item.id)));
    const expanded = computed(() => paused.value || shown.value.length <= threshold.value);
    const rows = computed(() => shown.value.map((item, index) => ({ item, depth: index, layer: shown.value.length - index })));

    provideNoticeListContext(computed(() => ({ paused: paused.value, updatedItems: props.updatedItems, announce: props.announce })));

    const onFocusOut = (event: FocusEvent) => {
        if (!listEl.value?.contains(event.relatedTarget as Node | null)) focusInside.value = false;
    };

    const finishLeaves = () => {
        if (leaving) return;
        for (const item of props.items) {
            if (props.removedIds.includes(item.id)) props.store.finishLeave(item.id);
        }
    };

    const onBeforeLeave = () => {
        leaving++;
    };

    const onLeaveEnd = () => {
        leaving--;
        finishLeaves();
    };

    // List-level and unused options would otherwise land on the notice element as attributes like zindex="1010".
    const itemProps = (item: ListedNotice) => omit(item, ['top', 'bottom', 'left', 'right', 'zIndex', 'getPopupContainer', 'stack', 'position']);

    // A focused notice that unmounts gives no reliable focusout, which would keep every countdown paused.
    watch(
        () => props.items,
        () => {
            if (focusInside.value && !listEl.value?.contains(FocusTrapHandle.getActiveElement(listEl.value))) focusInside.value = false;
        },
        { flush: 'post' }
    );

    // Post flush: the leaves this change starts have begun. Immediate: a notice removed before it rendered, or left over
    // from an unmounted Holder, has no element to leave.
    watch(() => props.removedIds, finishLeaves, { flush: 'post', immediate: true });
</script>

<template>
    <div ref="listEl" :class="cssClasses.LIST" :style="listStyle" :x-placement="props.placement" @focusin="focusInside = true" @focusout="onFocusOut" @mouseenter="pointerInside = true" @mouseleave="pointerInside = false">
        <TransitionGroup
            appear
            :enterActiveClass="`${prefix}-animation-show_${props.placement}`"
            :leaveActiveClass="`${prefix}-animation-hide_${props.placement}`"
            :name="prefix"
            type="animation"
            @afterLeave="onLeaveEnd"
            @beforeLeave="onBeforeLeave"
            @enter="pinAnimatedHeight($event)"
            @leave="pinAnimatedHeight($event)"
            @leaveCancelled="onLeaveEnd"
        >
            <Notice v-for="row in rows" :key="row.item.id" v-bind="itemProps(row.item)" :depth="row.depth" :layer="row.layer" :placement="props.placement" :stack="threshold > 0" :stackExpanded="expanded" @remove="props.store.remove($event)" />
        </TransitionGroup>
    </div>
</template>
