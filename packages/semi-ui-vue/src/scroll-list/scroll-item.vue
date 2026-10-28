<script setup lang="ts" generic="T extends ScrollListItem = ScrollListItem">
    import { computed, useId, useTemplateRef, watch } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
    import ItemFoundation, { type ScrollItemAdapter } from '@fibrae/semi-foundation/scroll-list/item-foundation';
    import '@fibrae/semi-foundation/scroll-list/scroll-list.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import useFoundation from '../_base/use-foundation';
    import type { ScrollItemEmits, ScrollItemHandle, ScrollItemProps, ScrollItemSelectData, ScrollListItem } from './interface';

    interface ScrollItemState {
        prependCount: number;
        appendCount: number;
    }

    type Foundation = ItemFoundation<T, ScrollItemProps<T>, ScrollItemState>;
    type Adapter = ScrollItemAdapter<T, ScrollItemProps<T>, ScrollItemState>;

    // The listbox, not the root, is what a name describes, so the naming attributes go to the ul.
    defineOptions({ name: 'ScrollItem', inheritAttrs: false });

    const props = withDefaults(defineProps<ScrollItemProps<T> & /* @vue-ignore */ ElementProps<'div', keyof ScrollItemProps<T> | EmitHandlers<ScrollItemEmits<T>>>>(), {
        cycled: () => semiDefault('ScrollItem', 'cycled', false),
        list: semiGlobalDefault('ScrollItem', 'list'),
        mode: () => semiDefault('ScrollItem', 'mode', 'wheel'),
        motion: () => semiDefault('ScrollItem', 'motion', true),
        selectedIndex: semiGlobalDefault('ScrollItem', 'selectedIndex'),
        transform: undefined,
        type: semiGlobalDefault('ScrollItem', 'type'),
    });

    const emit = defineEmits<ScrollItemEmits<T>>();

    const semi = useSemiGlobal();

    const listId = useId();
    const root = useTemplateRef('root');

    // <component :is> switches between a div and SlotFragment, so vue-tsc cannot infer it; only wheel mode reads it.
    const outer = useTemplateRef<HTMLDivElement>('outer');
    const listbox = useTemplateRef('listbox');
    const selector = useTemplateRef('selector');

    const prefix = cssClasses.PREFIX;
    const list = computed(() => props.list ?? []);
    const selectedIndex = computed(() => props.selectedIndex ?? 0);
    const transform = computed(() => props.transform ?? readSemiDefault(semi, 'ScrollItem', 'transform'));
    const isWheel = computed(() => props.mode === 'wheel');

    const { foundation, state } = useFoundation<Foundation, Adapter, ScrollItemProps<T>, ScrollItemState>(
        ItemFoundation,
        props,
        () => ({ prependCount: 0, appendCount: 0 }),
        () => ({
            getListNode: () => listbox.value,
            getScrollNode: () => (isWheel.value ? outer.value : root.value),
            getSelectorNode: () => selector.value,
            notifySelectItem: (data) => {
                emit('update:selectedIndex', (data as ScrollItemSelectData<T>).index);
                emit('select', data as ScrollItemSelectData<T>);
            },
        }),
        { props: { list: () => list.value, selectedIndex: () => selectedIndex.value } }
    );

    // In normal mode the class wrapper is dropped, otherwise SlotFragment would hand it to the ul.
    const outerAttrs = computed(() =>
        isWheel.value
            ? {
                  class: [`${prefix}-list-outer`, { [`${prefix}-list-outer-nocycle`]: !props.cycled }],
                  onScroll: () => foundation.handleScroll(),
              }
            : {}
    );

    const isControlKey = (key: string) => key === 'aria-label' || key === 'aria-labelledby' || key === 'aria-describedby';

    // Focus stays on the listbox and the selected option is its active descendant. Only the list itself carries ids:
    // a cycled column also renders copies of it, and the copy in view can change while the value stays.
    const optionId = (index: number) => `${listId}-option-${index}`;

    // One flat v-for: the foundation moves the li of a cycled column outside the render, which one Fragment tolerates
    // best. The copies only fill the wheel, so they are hidden from assistive technology: the listbox has one option per
    // item and one selected option.
    const options = computed(() => {
        const items = (keyPrefix: string) =>
            list.value.map((item, index) => {
                const selected = selectedIndex.value === index;
                const itemTransform = typeof item.transform === 'function' ? item.transform : transform.value;
                return {
                    key: `${keyPrefix}${index}`,
                    id: keyPrefix ? undefined : optionId(index),
                    copy: Boolean(keyPrefix),
                    index,
                    selected,
                    disabled: item.disabled,
                    clickable: !isWheel.value && !item.disabled,
                    class: {
                        [`${prefix}-item-sel`]: selected && !isWheel.value,
                        [`${prefix}-item-disabled`]: Boolean(item.disabled),
                    },
                    text: selected && typeof itemTransform === 'function' ? itemTransform(item.value, item.text) : (item.text ?? item.value),
                };
            });
        if (!isWheel.value) {
            return items('');
        }
        const copies = (count: number, name: string) => Array.from({ length: count }, (_, i) => items(`${name}_${i}_`));
        return [...copies(state.value.prependCount, 'pre').toReversed().flat(), ...items(''), ...copies(state.value.appendCount, 'app').flat()];
    });

    // The click is handled on the ul, where it also stops: an ancestor's click listener does not see a wheel click.
    const onListClick = (event: MouseEvent) => {
        if (isWheel.value) {
            event.stopImmediatePropagation();
            foundation.handleWheelClick(event);
        }
    };

    watch(
        () => selectedIndex.value,
        (selectedIndex, previous) => foundation.syncSelectedIndex(selectedIndex, previous),
        { flush: 'post' }
    );

    watch(
        () => list.value.length,
        () => foundation.syncList(),
        { flush: 'post' }
    );

    defineExpose<ScrollItemHandle>({ scrollToIndex: (_index, duration) => foundation.scrollToSelected(duration) });
</script>

<template>
    <div ref="root" v-bind="splitControlAttrs($attrs, isControlKey).root" :class="isWheel ? `${prefix}-item-wheel` : `${prefix}-item`">
        <template v-if="isWheel">
            <div :class="[`${prefix}-shade`, `${prefix}-shade-pre`]" />
            <div ref="selector" :class="`${prefix}-selector`" />
            <div :class="[`${prefix}-shade`, `${prefix}-shade-post`]" />
        </template>
        <component :is="isWheel ? 'div' : SlotFragment" ref="outer" v-bind="outerAttrs">
            <ul ref="listbox" v-bind="splitControlAttrs($attrs, isControlKey).control" :aria-activedescendant="list[selectedIndex] ? optionId(selectedIndex) : undefined" aria-multiselectable="false" role="listbox" tabindex="0" @click="onListClick" @keydown="foundation.handleKeyDown($event)">
                <li v-for="option in options" :id="option.id" :key="option.key" :aria-disabled="option.disabled" :aria-hidden="option.copy || undefined" :aria-selected="option.selected" :class="option.class" role="option" @click="option.clickable ? foundation.selectIndex(option.index) : undefined">
                    {{ option.text }}
                </li>
            </ul>
        </component>
    </div>
</template>
