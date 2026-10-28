<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/list/constants';
    import '@fibrae/semi-foundation/list/list.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import { hasSlotContent } from '../_base/slot-nodes';
    import { useListContext } from './context';
    import type { ListItemProps, ListItemSlots } from './interface';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ListItemProps>(), {
        align: 'flex-start',
        onClick: undefined,
        onRightClick: undefined,
    });

    const slots = defineSlots<ListItemSlots>();
    const attrs = useAttrs();

    const list = useListContext();

    const prefixCls = cssClasses.PREFIX;
    const handleClick = computed(() => props.onClick ?? list?.value.onClick);
    const handleRightClick = computed(() => props.onRightClick ?? list?.value.onRightClick);
    const clickable = computed(() => Boolean(handleClick.value || handleRightClick.value));

    // The button is the single tab stop; extra stays outside it so interactive extras are never nested in a button, and
    // its body uses spans since only phrasing content is valid inside.
    const bodyView = () => {
        const header = hasSlotContent(slots.header);
        const main = hasSlotContent(slots.main);
        return { key: 'view', header, main, body: header || main, extra: hasSlotContent(slots.extra) };
    };

    const handleLiClick = (event: MouseEvent) => {
        const handler = handleClick.value;
        if (!handler) return;
        // :scope > keeps a nested List's extra from being taken for this item's
        const ownExtra = (event.currentTarget as HTMLElement).querySelector(`:scope > .${prefixCls}-item-extra`);
        if (ownExtra?.contains(event.target as Node)) return;
        handler(event);
    };

    const liListeners = () => (clickable.value ? { click: handleLiClick, contextmenu: handleRightClick.value } : {});

    // The button is the only tab stop, so tabindex and aria-* belong there, not on the li.
    const attrParts = () => splitControlAttrs(attrs, (key) => clickable.value && (key.toLowerCase() === 'tabindex' || key.startsWith('aria-')));
</script>

<template>
    <li v-bind="attrParts().root" :class="[`${prefixCls}-item`, { [`${prefixCls}-item-clickable`]: clickable }]" v-on="liListeners()">
        <template v-for="view in [bodyView()]" :key="view.key">
            <button v-if="clickable" v-bind="attrParts().control" :class="`${prefixCls}-item-button`" type="button">
                <span v-if="view.body" :class="[`${prefixCls}-item-body`, `${prefixCls}-item-body-${props.align}`]">
                    <span v-if="view.header" :class="`${prefixCls}-item-body-header`">
                        <slot name="header" />
                    </span>
                    <span v-if="view.main" :class="`${prefixCls}-item-body-main`">
                        <slot name="main" />
                    </span>
                </span>
                <slot v-else />
            </button>
            <div v-else-if="view.body" :class="[`${prefixCls}-item-body`, `${prefixCls}-item-body-${props.align}`]">
                <div v-if="view.header" :class="`${prefixCls}-item-body-header`">
                    <slot name="header" />
                </div>
                <div v-if="view.main" :class="`${prefixCls}-item-body-main`">
                    <slot name="main" />
                </div>
            </div>
            <slot v-if="!(clickable && !view.body)" />
            <div v-if="view.extra" :class="`${prefixCls}-item-extra`">
                <slot name="extra" />
            </div>
        </template>
    </li>
</template>
