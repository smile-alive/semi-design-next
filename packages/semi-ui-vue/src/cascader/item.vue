<script setup lang="ts">
    import { computed, useTemplateRef, type StyleValue, type VNode } from 'vue';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/cascader/constants';
    import CascaderFoundation, { type BasicData } from '@fibrae/semi-foundation/cascader/foundation';
    import { getColumns, highlightParts } from '@fibrae/semi-foundation/cascader/util';
    import { IconChevronRight, IconTick } from '@fibrae/semi-icons-vue';
    import slotNodes, { hasSlotContent, type KeyedNode } from '../_base/slot-nodes';
    import VirtualList from '../_base/virtual-list.vue';
    import Checkbox from '../checkbox';
    import type { CheckboxEvent } from '../checkbox/interface';
    import useConfig from '../config-provider/use-config';
    import useLocale from '../locale/use-locale';
    import Spin from '../spin';
    import type { CascaderData, CascaderEntity, CascaderFilterItemSlotProps, CascaderVirtualize } from './interface';

    interface SearchData extends BasicData {
        data: CascaderData;
        pathData?: CascaderData[];
    }

    const props = defineProps<{
        activeKeys: Set<string>;
        selectedKeys: Set<string>;
        loadedKeys: Set<string>;
        loadingKeys: Set<string>;
        checkedKeys: Set<string>;
        halfCheckedKeys: Set<string>;
        showNext: 'click' | 'hover';
        /** the search results, a listbox, rather than the tree */
        searchable: boolean;
        keyword: string;
        /** a node without isLeaf is a branch while loadData is set */
        hasLoadData: boolean;
        data: Array<CascaderEntity | SearchData>;
        separator: string;
        multiple: boolean;
        virtualize?: CascaderVirtualize;
        /** id of the tree, or of the listbox of search results; the combobox's aria-controls points at it */
        id: string;
        /** the popup's name, the same as the combobox's */
        ariaLabel?: string;
        ariaLabelledby?: string;
        /** the option the arrow keys are on, pointed at by the combobox's aria-activedescendant */
        keyboardKey: string | null;
        optionId: (key: string) => string;
    }>();

    const emit = defineEmits<{
        itemClick: [event: MouseEvent, item: CascaderEntity | SearchData];
        itemHover: [event: MouseEvent, item: CascaderEntity];
        itemCheckboxClick: [item: CascaderEntity | SearchData];
        listScroll: [event: Event, level: number];
    }>();

    const slots = defineSlots<{
        label?: (props: { item: CascaderData }) => VNode[];
        filterItem?: (props: CascaderFilterItemSlotProps) => VNode[];
        expandIcon?: () => VNode[];
        emptyContent?: () => VNode[];
    }>();

    const config = useConfig();
    const locale = useLocale('Cascader');

    const virtualList = useTemplateRef('virtualList');

    const prefix = cssClasses.PREFIX_OPTION;
    const isEmpty = computed(() => !props.data.length);
    const columns = computed(() => (props.searchable || isEmpty.value ? [] : getColumns(props.data as CascaderEntity[], props.activeKeys)));
    const results = computed(() => (props.searchable ? (props.data as SearchData[]) : []));

    const isDisabled = (item: CascaderEntity | SearchData) => Boolean(item.data.disabled || ('disabled' in item && item.disabled));

    const handleClick = (event: MouseEvent, item: CascaderEntity | SearchData) => {
        if (!isDisabled(item)) {
            emit('itemClick', event, item);
        }
    };

    const handleHover = (event: MouseEvent, item: CascaderEntity) => {
        if (!item.data.disabled && props.showNext === strings.SHOW_NEXT_BY_HOVER) {
            emit('itemHover', event, item);
        }
    };

    const handleCheck = (event: CheckboxEvent, item: CascaderEntity | SearchData) => {
        // the click on the checkbox must not also reach the option as a click
        event.stopPropagation();
        emit('itemCheckboxClick', item);
    };

    const isBranch = (item: CascaderEntity) => CascaderFoundation.isBranch(item.data, props.hasLoadData);

    // one state per row: the class and the aria attributes read the same object from the v-for alias
    const treeRow = (item: CascaderEntity, index: number) => ({ item, index, state: CascaderFoundation.getTreeItemState(item.key, props, props.multiple, isBranch(item)) });

    const treeItemClass = (item: CascaderEntity, state: ReturnType<typeof CascaderFoundation.getTreeItemState>) => [
        prefix,
        {
            [`${prefix}-active`]: state.showActive,
            [`${prefix}-select`]: state.showSelected,
            [`${prefix}-disabled`]: item.data.disabled,
            [`${prefix}-focused`]: item.key === props.keyboardKey,
        },
    ];

    const resultClass = (item: SearchData) => [
        prefix,
        {
            [`${prefix}-flatten`]: !slots.filterItem,
            [`${prefix}-disabled`]: item.disabled,
            [`${prefix}-select`]: props.selectedKeys.has(item.key) && !props.multiple,
            [`${prefix}-focused`]: item.key === props.keyboardKey,
        },
    ];

    const optionAttrs = (item: SearchData, rowStyle?: StyleValue) => ({
        id: props.optionId(item.key),
        role: 'option',
        'aria-disabled': item.disabled || undefined,
        'aria-selected': props.multiple ? props.checkedKeys.has(item.key) : props.selectedKeys.has(item.key),
        ...(rowStyle ? { style: rowStyle } : {}),
    });

    const filterNodes = (item: SearchData): KeyedNode[] | null => {
        if (!slots.filterItem) {
            return null;
        }
        const rendered = slots.filterItem({
            class: resultClass(item),
            inputValue: props.keyword,
            disabled: item.disabled,
            data: item.pathData ?? [],
            checkStatus: { checked: props.checkedKeys.has(item.key), halfChecked: props.halfCheckedKeys.has(item.key) },
            selected: props.selectedKeys.has(item.key),
            onClick: (event) => handleClick(event, item),
            onCheck: (event) => handleCheck(event, item),
        });
        return slotNodes(rendered);
    };

    // Renders the slot once per row so the template reads the nodes from the v-for alias
    const resultRow = (item: SearchData) => ({ item, nodes: filterNodes(item) });

    // Only an element can carry the option's id and role; text and several nodes get an li around them. Known limit: a
    // root component with inheritAttrs: false puts them where it puts its attributes, so the docs ask for a plain element
    const isOneElement = (nodes: KeyedNode[] | null): nodes is [KeyedNode] => nodes?.length === 1 && typeof nodes[0][0].type !== 'symbol';

    const emptyHidden = () => Boolean(slots.emptyContent) && !hasSlotContent(slots.emptyContent);

    defineExpose({
        /** Scrolls the virtual search results; false when they are not virtual, so the caller scrolls the option itself */
        scrollToItem: (index: number) => {
            if (!virtualList.value) {
                return false;
            }
            virtualList.value.scrollToItem(index);
            return true;
        },
    });
</script>

<template>
    <!-- the id stays for the combobox's aria-controls; with nothing to choose there is no tree or listbox -->
    <div v-if="isEmpty" :id="props.id" :class="[`${prefix}-lists`, `${prefix}-lists-empty`]">
        <div v-if="!emptyHidden()" :class="[prefix, `${prefix}-empty`]">
            <span :class="`${prefix}-label`" x-semi-prop="emptyContent">
                <slot name="emptyContent">{{ locale.locale.emptyText }}</slot>
            </span>
        </div>
    </div>
    <div v-else :id="props.id" :aria-label="props.ariaLabel" :aria-labelledby="props.ariaLabelledby" :aria-multiselectable="props.multiple || undefined" :class="`${prefix}-lists`" :role="props.searchable ? 'listbox' : 'tree'">
        <template v-if="props.searchable">
            <VirtualList
                v-if="props.virtualize"
                ref="virtualList"
                :height="props.virtualize.height ?? numbers.LIST_HEIGHT"
                :innerAttrs="{ class: `${prefix}-list`, role: 'none' }"
                innerTag="ul"
                :itemCount="results.length"
                :itemSize="props.virtualize.itemSize"
                :style="{ direction: config.direction }"
                :tabindex="-1"
                :width="props.virtualize.width ?? '100%'"
            >
                <template #default="{ index, style: rowStyle }">
                    <template v-for="{ item, nodes } in [resultRow(results[index])]" :key="item.key">
                        <component :is="nodes[0][0]" v-if="isOneElement(nodes)" v-bind="optionAttrs(item, rowStyle)" />
                        <!-- the combobox handles the keys: it points at this option with aria-activedescendant -->
                        <li v-else v-bind="optionAttrs(item, rowStyle)" :class="resultClass(item)" @click="handleClick($event, item)">
                            <template v-if="nodes">
                                <component :is="node" v-for="[node, key] in nodes" :key="key" />
                            </template>
                            <span v-else :class="`${prefix}-label`">
                                <Checkbox v-if="props.multiple" aria-hidden="true" :class="`${prefix}-label-checkbox`" :disabled="item.disabled" :indeterminate="props.halfCheckedKeys.has(item.key)" :modelValue="props.checkedKeys.has(item.key)" :tabindex="-1" @change="handleCheck($event, item)" />
                                <span v-else aria-hidden="true" :class="[`${prefix}-icon`, `${prefix}-icon-empty`]" />
                                <template v-for="(part, i) in highlightParts(item.searchText, props.keyword, props.separator)" :key="i">
                                    <span v-if="part.match" :class="`${prefix}-label-highlight`">{{ part.text }}</span>
                                    <template v-else>{{ part.text }}</template>
                                </template>
                            </span>
                        </li>
                    </template>
                </template>
            </VirtualList>
            <ul v-else :class="`${prefix}-list`" role="none">
                <template v-for="{ item, nodes } in results.map(resultRow)" :key="item.key">
                    <component :is="nodes[0][0]" v-if="isOneElement(nodes)" v-bind="optionAttrs(item)" />
                    <!-- the combobox handles the keys: it points at this option with aria-activedescendant -->
                    <li v-else v-bind="optionAttrs(item)" :class="resultClass(item)" @click="handleClick($event, item)">
                        <template v-if="nodes">
                            <component :is="node" v-for="[node, key] in nodes" :key="key" />
                        </template>
                        <span v-else :class="`${prefix}-label`">
                            <Checkbox v-if="props.multiple" aria-hidden="true" :class="`${prefix}-label-checkbox`" :disabled="item.disabled" :indeterminate="props.halfCheckedKeys.has(item.key)" :modelValue="props.checkedKeys.has(item.key)" :tabindex="-1" @change="handleCheck($event, item)" />
                            <span v-else aria-hidden="true" :class="[`${prefix}-icon`, `${prefix}-icon-empty`]" />
                            <template v-for="(part, i) in highlightParts(item.searchText, props.keyword, props.separator)" :key="i">
                                <span v-if="part.match" :class="`${prefix}-label-highlight`">{{ part.text }}</span>
                                <template v-else>{{ part.text }}</template>
                            </template>
                        </span>
                    </li>
                </template>
            </ul>
        </template>
        <!--
            One list per level of the active path, together one flat tree: aria-level, aria-setsize and aria-posinset
            carry the hierarchy. Owning the next list as a group (aria-owns) would make it part of the branch's name.
        -->
        <template v-else>
            <ul v-for="column in columns" :key="column.items[0].key" :class="`${prefix}-list`" role="none" @scroll="emit('listScroll', $event, column.level)">
                <!-- the combobox handles the keys: it points at this option with aria-activedescendant -->
                <li
                    v-for="{ item, index, state } in column.items.map(treeRow)"
                    :id="props.optionId(item.key)"
                    :key="item.key"
                    :aria-busy="state.aria['aria-busy']"
                    :aria-checked="state.aria['aria-checked']"
                    :aria-disabled="item.data.disabled || undefined"
                    :aria-expanded="state.aria['aria-expanded']"
                    :aria-level="column.level + 1"
                    :aria-posinset="index + 1"
                    :aria-selected="state.aria['aria-selected']"
                    :aria-setsize="column.items.length"
                    :class="treeItemClass(item, state)"
                    role="treeitem"
                    @click="handleClick($event, item)"
                    @mouseenter="handleHover($event, item)"
                >
                    <span :class="`${prefix}-label`">
                        <Checkbox v-if="props.multiple" aria-hidden="true" :class="`${prefix}-label-checkbox`" :disabled="item.data.disabled" :indeterminate="props.halfCheckedKeys.has(item.key)" :modelValue="props.checkedKeys.has(item.key)" :tabindex="-1" @change="handleCheck($event, item)" />
                        <IconTick v-else-if="state.selected" :class="[`${prefix}-icon`, `${prefix}-icon-active`]" />
                        <span v-else aria-hidden="true" :class="[`${prefix}-icon`, `${prefix}-icon-empty`]" />
                        <span>
                            <slot :item="item.data" name="label">{{ item.data.label }}</slot>
                        </span>
                    </span>
                    <template v-if="isBranch(item)">
                        <!-- the option carries the state as aria-busy; the spinner's own name would join the option's name -->
                        <span v-if="state.loading" aria-hidden="true"><Spin :wrapperClassName="`${prefix}-spin-icon ${prefix}-icon-left`" /></span>
                        <slot v-else name="expandIcon">
                            <IconChevronRight :class="[`${prefix}-icon`, `${prefix}-icon-expand`, `${prefix}-icon-left`]" />
                        </slot>
                    </template>
                </li>
            </ul>
        </template>
    </div>
</template>
