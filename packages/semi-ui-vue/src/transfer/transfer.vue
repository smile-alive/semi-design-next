<script setup lang="ts">
    import { computed, shallowRef, useId, useTemplateRef, watch } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/transfer/constants';
    import TransferFoundation, { type BasicResolvedDataItem, type TransferAdapter, type TransferBaseProps, type TransferBaseState } from '@fibrae/semi-foundation/transfer/foundation';
    import '@fibrae/semi-foundation/transfer/transfer.scss';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import { nativeTag } from '../_base/native-tag';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import VirtualList from '../_base/virtual-list.vue';
    import type SortableComponent from '../_sortable/sortable.vue';
    import Button from '../button';
    import Checkbox from '../checkbox';
    import Input from '../input';
    import useLocale from '../locale/use-locale';
    import Pagination from '../pagination';
    import Spin from '../spin';
    import Tree from '../tree';
    import AutoSizer from '../tree/auto-sizer.vue';
    import type { TreeNodeData, TreeValue } from '../tree/interface';
    import type { TransferDataItem, TransferEmits, TransferGroupItem, TransferHandle, TransferProps, TransferSelectedPanelSlotProps, TransferSlots, TransferSourcePanelSlotProps, TransferValue } from './interface';
    import TransferSelectedItem from './transfer-selected-item.vue';

    type ResolvedItem = BasicResolvedDataItem & TransferDataItem;

    interface LeftGroup {
        /** The group's position among the non-empty groups of the dataSource, which search and paging keep */
        index: number;
        parent?: Omit<TransferGroupItem, 'children'>;
        items: { item: ResolvedItem; index: number }[];
    }

    type Foundation = TransferFoundation<TransferBaseProps, TransferBaseState>;
    type Adapter = TransferAdapter<TransferBaseProps, TransferBaseState>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TransferProps & /* @vue-ignore */ ElementProps<'div', keyof TransferProps | EmitHandlers<TransferEmits>>>(), {
        modelValue: undefined,
        defaultValue: () => semiDefault('Transfer', 'defaultValue', []),
        dataSource: () => semiDefault('Transfer', 'dataSource', []),
        type: () => semiDefault('Transfer', 'type', 'list'),
        disabled: semiGlobalDefault('Transfer', 'disabled'),
        draggable: semiGlobalDefault('Transfer', 'draggable'),
        loading: semiGlobalDefault('Transfer', 'loading'),
        showPath: () => semiDefault('Transfer', 'showPath', false),
        // Function-typed: the global default is read in the computed below
        filter: undefined,
        inputProps: semiGlobalDefault('Transfer', 'inputProps'),
        treeProps: semiGlobalDefault('Transfer', 'treeProps'),
        pagination: semiGlobalDefault('Transfer', 'pagination'),
        virtualize: semiGlobalDefault('Transfer', 'virtualize'),
    });

    const emit = defineEmits<TransferEmits>();
    defineSlots<TransferSlots>();

    const semi = useSemiGlobal();
    const locale = useLocale('Transfer');

    const uid = useId();
    const tree = useTemplateRef('tree');
    const Sortable = shallowRef<typeof SortableComponent | null>(null);

    const prefixCls = cssClasses.PREFIX;
    const SearchLandmark = nativeTag('search');
    const filter = computed(() => props.filter ?? readSemiDefault(semi, 'Transfer', 'filter'));

    const { foundation, state } = useFoundation<Foundation, Adapter, TransferBaseProps, TransferBaseState>(
        TransferFoundation,
        props,
        () => ({
            selectedValues: props.defaultValue,
            inputValue: '',
            leftCurrentPage: props.pagination?.defaultCurrentPage ?? props.pagination?.currentPage ?? 1,
        }),
        (base) => ({
            updateSelected: (selectedValues) => base.setState({ selectedValues }),
            notifyBlur: (event) => emit('blur', event),
            notifyChange: (values, items) => {
                emit('update:modelValue', values);
                emit('change', values, items as TransferDataItem[]);
            },
            notifySearch: (input) => emit('search', input),
            notifySelect: (item) => emit('select', item as TransferDataItem),
            notifyDeselect: (item) => emit('deselect', item as TransferDataItem),
            updateInput: (inputValue) => base.setState({ inputValue }),
            searchTree: (keyword) => tree.value?.search(keyword),
            updateCurrentPage: (leftCurrentPage) => base.setState({ leftCurrentPage }),
            notifyPageChange: (currentPage) => props.pagination?.onPageChange?.(currentPage),
        }),
        { props: { value: () => props.modelValue, filter: () => filter.value } }
    );

    const data = computed(() => TransferFoundation.getData(props.dataSource, props.type) as ResolvedItem[]);
    const selectedItems = computed(() => TransferFoundation.getSelectedItems(props.modelValue, data.value, state.value.selectedValues) as Map<string | number, ResolvedItem>);
    const isTree = computed(() => props.type === strings.TYPE_TREE_TO_LIST);
    const isList = computed(() => props.type === strings.TYPE_LIST || props.type === strings.TYPE_GROUP_LIST);
    const searchResult = computed(() => (state.value.inputValue === '' ? null : TransferFoundation.getSearchResult(data.value, state.value.inputValue, filter.value ?? true, props.type)));
    const filterData = computed(() => TransferFoundation.getFilterData(data.value, searchResult.value));
    const showNumber = computed(() => searchResult.value?.size ?? data.value.length);
    const noMatch = computed(() => searchResult.value?.size === 0);
    const enabledFilterData = computed(() => TransferFoundation.getEnabledItems(filterData.value, props.type));
    const leftContainsNotInSelected = computed(() => enabledFilterData.value.some((item) => !selectedItems.value.has(item.key)));
    const leafOnlyNum = computed(() => TransferFoundation.getLeafCount(filterData.value, props.type));
    const showAllButton = computed(() => !isTree.value && enabledFilterData.value.length > 0);
    const values = computed(() => TransferFoundation.getValuesAndItemsFromMap(selectedItems.value, props.type, props.showPath).values);
    const pageSize = computed(() => TransferFoundation.getPageSize(props.pagination));
    const totalPage = computed(() => TransferFoundation.getTotalPage(props.pagination, filterData.value.length));
    const currentPage = computed(() => TransferFoundation.getCurrentPage(props.pagination, state.value.leftCurrentPage, filterData.value.length));

    const leftGroups = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value;
        const visible = props.pagination ? filterData.value.slice(start, start + pageSize.value) : filterData.value;
        const groupIndexes = TransferFoundation.getGroupIndexes(data.value);
        const groups: LeftGroup[] = [];
        visible.forEach((item, index) => {
            const last = groups.at(-1);
            if (last && last.parent === item._parent) {
                last.items.push({ item, index });
            } else {
                groups.push({
                    index: groupIndexes.get(item._parent) ?? 0,
                    parent: item._parent,
                    items: [{ item, index }],
                });
            }
        });
        return groups;
    });

    const selectedData = computed((): ResolvedItem[] =>
        [...selectedItems.value.values()].map((item) => ({
            ...item,
            fullPath: TransferFoundation.getFullPath(item, props.type, props.showPath) as TransferDataItem[] | undefined,
        }))
    );

    const selectedKeys = computed(() => selectedData.value.map((item) => item.key));
    const virtualized = computed(() => Boolean(props.virtualize && Object.keys(props.virtualize).length));
    const virtualHeight = computed(() => (typeof props.virtualize?.height === 'number' ? props.virtualize.height : undefined));

    // Transfer owns the Tree's value, data and ref: a caller's would fight the selection, break the flat item map or
    // replace the search handle
    const treeBindings = computed(() => omit((props.treeProps ?? {}) as Record<string, unknown>, ['modelValue', 'defaultValue', 'onChange', 'onUpdate:modelValue', 'ref', 'keyMaps', 'treeData', 'treeDataSimpleJson', 'changeWithObject']));

    // the root is not a focus target: a tabindex (one injected by a wrapping Tooltip included) goes to the search box;
    // role="group" does not support aria-required
    const splitAttrs = (attrs: Record<string, unknown>) => splitControlAttrs(omit(attrs, ['aria-required']), (key) => key === 'tabindex' || key === 'tabIndex');

    const pathLabel = (item: ResolvedItem) => (isTree.value && props.showPath ? TransferFoundation.generatePath(item) : undefined);

    const asItem = (item: TreeNodeData) => item as TransferDataItem;

    const onTreeChange = (value: TreeValue) => foundation.handleSelect(value as TransferValue);

    const onInputChange = (input: string) => foundation.handleInputChange(input, true);

    const onSelectOrRemove = (item: TransferDataItem) => foundation.handleSelectOrRemove(item);

    const onAllClick = () => foundation.handleAll(leftContainsNotInSelected.value);

    const sourcePanelProps = (): TransferSourcePanelSlotProps => ({
        value: values.value,
        loading: props.loading,
        noMatch: noMatch.value,
        filterData: filterData.value,
        sourceData: data.value,
        propsDataSource: props.dataSource,
        allChecked: !leftContainsNotInSelected.value,
        showNumber: showNumber.value,
        inputValue: state.value.inputValue,
        selectedItems: selectedItems.value,
        onSelect: foundation.handleSelect,
        onAllClick,
        onSearch: onInputChange,
        onSelectOrRemove,
    });

    const selectedPanelProps = (): TransferSelectedPanelSlotProps => ({
        length: selectedData.value.length,
        selectedData: selectedData.value,
        onClear: foundation.handleClear,
        onRemove: onSelectOrRemove,
        onSortEnd: foundation.handleSortEnd,
    });

    const showsEmpty = (slot?: () => unknown) => !slot || hasSlotContent(slot as Parameters<typeof hasSlotContent>[0]);

    const groupTitleId = (index: number) => `${uid}-group-${index}`;

    watch(
        () => props.modelValue,
        (next, previous) => {
            if (Array.isArray(previous) && !Array.isArray(next)) {
                foundation.handleValueRelease();
            }
        }
    );

    watch(
        () => props.draggable,
        (on) => {
            if (on && !Sortable.value) {
                void import('../_sortable/sortable.vue').then((module) => {
                    Sortable.value = module.default;
                });
            }
        },
        { immediate: true }
    );

    // The Tree unmounts while loading or empty, and a keyword typed meanwhile only reached the search box
    watch(
        tree,
        (handle) => {
            if (handle && state.value.inputValue) {
                handle.search(state.value.inputValue);
            }
        },
        { flush: 'post' }
    );

    defineExpose<TransferHandle>({
        // a search through the handle comes from the caller, so `search` is not emitted
        search: (value) => foundation.handleInputChange(value, false),
    });
</script>

<template>
    <div :class="[prefixCls, { [`${prefixCls}-disabled`]: props.disabled, [`${prefixCls}-custom-panel`]: $slots.sourcePanel && $slots.selectedPanel }]" :role="groupRole($attrs)" v-bind="splitAttrs($attrs).root" @focusout="foundation.handleFocusOut">
        <slot v-if="$slots.sourcePanel" name="sourcePanel" v-bind="sourcePanelProps()" />
        <section v-else :class="`${prefixCls}-left`">
            <SearchLandmark v-if="filter !== false" :aria-label="locale.locale.filter" :class="`${prefixCls}-filter`">
                <Input :disabled="props.disabled" :modelValue="state.inputValue" :placeholder="locale.locale.placeholder" showClear v-bind="{ ...splitAttrs($attrs).control, ...props.inputProps }" @change="onInputChange">
                    <template #prefix>
                        <IconSearch />
                    </template>
                </Input>
            </SearchLandmark>
            <Spin v-if="props.loading" />
            <template v-else-if="noMatch">
                <div v-if="showsEmpty($slots.emptySearch)" :class="[`${prefixCls}-empty`, `${prefixCls}-left-empty`]">
                    <slot name="emptySearch">{{ locale.locale.emptySearch }}</slot>
                </div>
            </template>
            <template v-else-if="data.length === 0">
                <div v-if="showsEmpty($slots.emptyLeft)" :class="[`${prefixCls}-empty`, `${prefixCls}-left-empty`]">
                    <slot name="emptyLeft">{{ locale.locale.emptyLeft }}</slot>
                </div>
            </template>
            <template v-else-if="isList || isTree">
                <slot v-if="$slots.sourceHeader" :allChecked="!leftContainsNotInSelected" :leafOnlyNum="leafOnlyNum" name="sourceHeader" :num="showNumber" :onAllClick="onAllClick" :showButton="showAllButton" />
                <div v-else :class="[`${prefixCls}-header`, `${prefixCls}-left-header`]">
                    <span :class="`${prefixCls}-header-total`">{{ locale.locale.total.replace('${total}', String(showNumber)) }}</span>
                    <Button v-if="showAllButton" :class="`${prefixCls}-header-all`" :disabled="props.disabled" size="small" theme="borderless" type="tertiary" @click="onAllClick">{{ leftContainsNotInSelected ? locale.locale.selectAll : locale.locale.clearSelectAll }}</Button>
                </div>
                <Tree
                    v-if="isTree"
                    ref="tree"
                    :aria-label="locale.locale.optionList"
                    defaultExpandAll
                    :disabled="props.disabled"
                    disableStrictly
                    filterTreeNode
                    leafOnly
                    :modelValue="values"
                    multiple
                    :style="{ flex: 1, overflow: 'auto' }"
                    :treeData="props.dataSource as TreeNodeData[]"
                    v-bind="treeBindings"
                    @change="onTreeChange"
                >
                    <template #search />
                    <template v-if="$slots.label" #label="{ item }">
                        <slot :item="asItem(item)" name="label" />
                    </template>
                </Tree>
                <!-- checkboxes are disabled with the transfer, so the keyboard can only scroll the list -->
                <div v-else :aria-label="locale.locale.optionList" :class="`${prefixCls}-left-list`" role="list" :tabindex="props.disabled ? 0 : undefined">
                    <component :is="group.parent ? 'div' : SlotFragment" v-for="group in leftGroups" :key="group.index" :role="group.parent ? 'listitem' : undefined">
                        <div v-if="group.parent" :id="groupTitleId(group.index)" :class="`${prefixCls}-group-title`">
                            {{ group.parent.title }}
                        </div>
                        <component :is="group.parent ? 'div' : SlotFragment" :aria-labelledby="group.parent ? groupTitleId(group.index) : undefined" :role="group.parent ? 'list' : undefined">
                            <template v-for="{ item, index } in group.items" :key="item.key">
                                <div v-if="$slots.sourceItem" role="listitem">
                                    <slot :checked="selectedItems.has(item.key)" :index="index" :item="item" name="sourceItem" :onChange="() => onSelectOrRemove(item)" />
                                </div>
                                <Checkbox v-else :class="[`${prefixCls}-item`, { [`${prefixCls}-item-disabled`]: item.disabled }]" :disabled="item.disabled || props.disabled" :modelValue="selectedItems.has(item.key)" role="listitem" @change="onSelectOrRemove(item)">
                                    <slot :item="item" name="label">{{ item.label }}</slot>
                                </Checkbox>
                            </template>
                        </component>
                    </component>
                </div>
                <div v-if="isList && props.pagination && totalPage > 1" :class="`${prefixCls}-left-pagination`">
                    <Pagination :currentPage="currentPage" :pageSize="pageSize" :total="filterData.length" @pageChange="foundation.handlePageChange" />
                </div>
            </template>
        </section>
        <slot v-if="$slots.selectedPanel" name="selectedPanel" v-bind="selectedPanelProps()" />
        <section v-else :class="`${prefixCls}-right`">
            <slot v-if="$slots.selectedHeader" name="selectedHeader" :num="selectedData.length" :onClear="foundation.handleClear" :showButton="selectedData.some((item) => !item.disabled)" />
            <div v-else :class="[`${prefixCls}-header`, `${prefixCls}-right-header`]">
                <span :class="`${prefixCls}-header-total`">{{ locale.locale.selected.replace('${total}', String(selectedData.length)) }}</span>
                <Button v-if="selectedData.some((item) => !item.disabled)" :class="`${prefixCls}-header-all`" :disabled="props.disabled" size="small" theme="borderless" type="tertiary" @click="foundation.handleClear">{{ locale.locale.clear }}</Button>
            </div>
            <template v-if="selectedData.length === 0">
                <div v-if="showsEmpty($slots.emptyRight)" :class="[`${prefixCls}-empty`, `${prefixCls}-right-empty`]">
                    <slot name="emptyRight">{{ locale.locale.emptyRight }}</slot>
                </div>
            </template>
            <!-- a disabled transfer falls through to the plain list, whose drag handles are aria-disabled stand-ins -->
            <component
                :is="Sortable"
                v-else-if="props.draggable && !props.disabled && Sortable"
                :aria-label="locale.locale.selectedList"
                :class="`${prefixCls}-right-list`"
                :dragHandleLabel="locale.locale.dragSort"
                :dragOverlayClass="`${prefixCls}-right-item-drag-item-move`"
                :items="selectedKeys"
                :prefix="`${prefixCls}-right-item`"
                role="list"
                :style="{ overflow: 'auto' }"
                @sortEnd="foundation.handleSortEnd"
            >
                <template #item="{ index }">
                    <TransferSelectedItem draggable :index="index" :item="selectedData[index]" :pathLabel="pathLabel(selectedData[index])" sortable @remove="onSelectOrRemove(selectedData[index])">
                        <template v-if="$slots.selectedItem" #selectedItem="itemProps">
                            <slot name="selectedItem" v-bind="itemProps" />
                        </template>
                        <template v-if="$slots.label" #label="labelProps">
                            <slot name="label" v-bind="labelProps" />
                        </template>
                    </TransferSelectedItem>
                </template>
            </component>
            <div v-else-if="!props.draggable && virtualized && virtualHeight === undefined" :style="{ flexGrow: 1, minHeight: 0 }">
                <AutoSizer :defaultHeight="props.virtualize?.height ?? ''" :defaultWidth="props.virtualize?.width">
                    <template #default="{ height, width }">
                        <VirtualList
                            :aria-label="locale.locale.selectedList"
                            :class="[`${prefixCls}-right-list`, `${prefixCls}-right-virtual-list`]"
                            :height="height"
                            :itemCount="selectedData.length"
                            :itemKey="(index) => selectedData[index]?.key ?? index"
                            :itemSize="props.virtualize?.itemSize ?? 0"
                            role="list"
                            :tabindex="props.disabled ? 0 : undefined"
                            :width="width"
                        >
                            <template #default="{ index, style }">
                                <div role="presentation" :style="style">
                                    <TransferSelectedItem :disabled="props.disabled" :draggable="false" :index="index" :item="selectedData[index]" :pathLabel="pathLabel(selectedData[index])" :sortable="false" @remove="onSelectOrRemove(selectedData[index])">
                                        <template v-if="$slots.selectedItem" #selectedItem="itemProps">
                                            <slot name="selectedItem" v-bind="itemProps" />
                                        </template>
                                        <template v-if="$slots.label" #label="labelProps">
                                            <slot name="label" v-bind="labelProps" />
                                        </template>
                                    </TransferSelectedItem>
                                </div>
                            </template>
                        </VirtualList>
                    </template>
                </AutoSizer>
            </div>
            <VirtualList
                v-else-if="!props.draggable && virtualHeight !== undefined"
                :aria-label="locale.locale.selectedList"
                :class="[`${prefixCls}-right-list`, `${prefixCls}-right-virtual-list`]"
                :height="virtualHeight"
                :itemCount="selectedData.length"
                :itemKey="(index) => selectedData[index]?.key ?? index"
                :itemSize="props.virtualize?.itemSize ?? 0"
                role="list"
                :tabindex="props.disabled ? 0 : undefined"
                :width="props.virtualize?.width || '100%'"
            >
                <template #default="{ index, style }">
                    <div role="presentation" :style="style">
                        <TransferSelectedItem :disabled="props.disabled" :draggable="false" :index="index" :item="selectedData[index]" :pathLabel="pathLabel(selectedData[index])" :sortable="false" @remove="onSelectOrRemove(selectedData[index])">
                            <template v-if="$slots.selectedItem" #selectedItem="itemProps">
                                <slot name="selectedItem" v-bind="itemProps" />
                            </template>
                            <template v-if="$slots.label" #label="labelProps">
                                <slot name="label" v-bind="labelProps" />
                            </template>
                        </TransferSelectedItem>
                    </div>
                </template>
            </VirtualList>
            <div v-else :aria-label="locale.locale.selectedList" :class="`${prefixCls}-right-list`" role="list" :tabindex="props.disabled ? 0 : undefined">
                <TransferSelectedItem v-for="(item, index) in selectedData" :key="item.key" :disabled="props.disabled" :draggable="Boolean(props.draggable)" :index="index" :item="item" :pathLabel="pathLabel(item)" :sortable="false" @remove="onSelectOrRemove(item)">
                    <template v-if="$slots.selectedItem" #selectedItem="itemProps">
                        <slot name="selectedItem" v-bind="itemProps" />
                    </template>
                    <template v-if="$slots.label" #label="labelProps">
                        <slot name="label" v-bind="labelProps" />
                    </template>
                </TransferSelectedItem>
            </div>
        </section>
    </div>
</template>
