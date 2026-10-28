<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, getTabDataKey } from '@fibrae/semi-foundation/tabs/constants';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useLocale from '../locale/use-locale';
    import { useTabsContext } from './context';
    import { getPanelId, getTabId } from './ids';
    import type { TabItemEmits, TabItemProps, TabItemSlots } from './interface';

    // Passed-through attributes come first so role, ids, aria states and tabindex stay the component's
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TabItemProps & /* @vue-ignore */ ElementProps<'div', keyof TabItemProps | EmitHandlers<TabItemEmits>>>(), {
        itemKey: '',
        selected: false,
        disabled: false,
        closable: false,
        size: undefined,
        type: undefined,
        tabPosition: undefined,
    });

    const emit = defineEmits<TabItemEmits>();
    defineSlots<TabItemSlots>();

    const ctx = useTabsContext();
    const locale = useLocale('Tabs');

    const prefix = cssClasses.TABS_TAB;
    const type = computed(() => props.type ?? ctx?.view.value.type ?? 'line');
    const tabPosition = computed(() => props.tabPosition ?? ctx?.view.value.tabPosition ?? 'top');
    const size = computed(() => props.size ?? ctx?.view.value.size);

    const ids = computed(() => {
        if (!ctx) return {};
        const { tabsId, everyPanelMounted } = ctx.view.value;
        return {
            id: getTabId(tabsId, props.itemKey),
            'aria-controls': everyPanelMounted || props.selected ? getPanelId(tabsId, props.itemKey) : undefined,
        };
    });

    const onClick = (event: MouseEvent) => {
        if (props.disabled) return;
        ctx?.tabClick(props.itemKey, event);
        emit('click', props.itemKey, event);
    };

    const onKeydown = (event: KeyboardEvent) => ctx?.handleKeyDown(event, props.itemKey, props.closable);

    const onClose = () => {
        if (!props.disabled) ctx?.deleteTab(props.itemKey);
    };
</script>

<template>
    <div
        v-bind="{ ...$attrs, ...ids }"
        :aria-disabled="props.disabled ? 'true' : 'false'"
        :aria-selected="props.selected ? 'true' : 'false'"
        :class="[prefix, `${prefix}-${type}`, `${prefix}-${tabPosition}`, `${prefix}-single`, { [cssClasses.TABS_TAB_ACTIVE]: props.selected, [cssClasses.TABS_TAB_DISABLED]: props.disabled, [`${prefix}-small`]: size === 'small', [`${prefix}-medium`]: size === 'medium' }]"
        :data-tabkey="getTabDataKey(props.itemKey)"
        role="tab"
        :tabindex="props.selected || props.itemKey === ctx?.view.value.tabbableKey ? 0 : -1"
        @click="onClick"
        @keydown="onKeydown"
    >
        <span v-if="hasSlotContent($slots.icon)" :class="`${cssClasses.TABS_BAR}-icon`">
            <slot name="icon" />
        </span>
        <slot name="tab" />
        <IconClose v-if="props.closable" :aria-label="locale.locale.close" :class="`${prefix}-icon-close`" role="button" @click.stop="onClose" />
    </div>
</template>
