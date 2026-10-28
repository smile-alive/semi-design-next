<script setup lang="ts">
    import { computed, shallowRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/tabs/constants';
    import TabsFoundation from '@fibrae/semi-foundation/tabs/foundation';
    import type { ElementProps } from '../_base/element-props';
    import { useTabsContext } from './context';
    import { getPanelId, getTabId } from './ids';
    import type { TabPaneProps, TabPaneSlots } from './interface';

    // Tabs reads props and slots from the vnode. Passed-through attributes come first so id, role and aria pairing stay
    // the component's; tabindex defaults to 0 and stays overridable.
    defineOptions({ inheritAttrs: false, elementType: 'Tabs.TabPane' });

    const props = withDefaults(defineProps<TabPaneProps & /* @vue-ignore */ ElementProps<'div', keyof TabPaneProps>>(), {
        itemKey: undefined,
        disabled: undefined,
        closable: undefined,
    });

    defineSlots<TabPaneSlots>();

    const ctx = useTabsContext();

    if (!ctx) {
        throw new Error('[Semi Tabs] TabPane must be a child of Tabs');
    }

    const view = ctx.view;
    const active = computed(() => view.value.activeKey === props.itemKey);

    const activated = shallowRef(active.value);

    const shouldRender = computed(() => !view.value.lazyRender || active.value || activated.value);
    const paneMotion = computed(() => TabsFoundation.getPaneMotion({ ...view.value, itemKey: props.itemKey }));

    // split so the watch below fires only when one of the two values changes
    const startClassName = computed(() => paneMotion.value.startClassName);
    const hasMotion = computed(() => paneMotion.value.hasMotion);

    // The overlay stays mounted, so the class is toggled by hand: on when a pane activates with motion, off at its end
    const animating = shallowRef(hasMotion.value);

    watch(active, (isActive) => {
        if (isActive) activated.value = true;
    });

    watch([hasMotion, startClassName], ([motion]) => {
        animating.value = motion;
    });
</script>

<template>
    <div
        v-bind="$attrs"
        :id="getPanelId(view.tabsId, props.itemKey ?? '')"
        :aria-hidden="active ? 'false' : 'true'"
        :aria-labelledby="getTabId(view.tabsId, props.itemKey ?? '')"
        :class="[cssClasses.TABS_PANE, active ? cssClasses.TABS_PANE_ACTIVE : cssClasses.TABS_PANE_INACTIVE]"
        role="tabpanel"
        :tabindex="($attrs.tabindex as number | string | undefined) ?? 0"
        x-semi-prop="children"
    >
        <!-- .self: animation events bubble, and one from the pane's content must not end the overlay's slide -->
        <div :class="[cssClasses.TABS_PANE_MOTION_OVERLAY, animating ? startClassName : '']" x-semi-prop="children" @animationend.self="animating = false">
            <slot v-if="shouldRender" />
        </div>
    </div>
</template>
