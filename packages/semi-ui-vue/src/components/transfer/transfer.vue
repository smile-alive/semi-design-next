<script setup lang="ts">
    import { computed, shallowRef, useId, useTemplateRef, watch } from 'vue';
    import { omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/transfer/constants';
    import TransferFoundation, { type BasicResolvedDataItem, type TransferAdapter, type TransferBaseProps, type TransferBaseState } from '@fibrae/semi-foundation/components/transfer/foundation';
    import { formatLocale } from '@fibrae/semi-foundation/locale/format';
    import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/components/transfer/transfer.scss';
    import { IconSearch } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../../base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../../base/semi-default';
    import SlotFragment from '../../base/slot-fragment';
    import useFoundation from '../../base/use-foundation';
    import type SortableComponent from '../../internal/sortable/sortable.vue';
    import VirtualList from '../../internal/virtual-list.vue';
    import { splitControlAttrs } from '../../utils/control-attrs';
    import { nativeTag } from '../../utils/native-tag';
    import { hasSlotContent } from '../../utils/slot-nodes';
    import Button from '../button';
    import Checkbox from '../checkbox';
    import Input from '../input';
    import useLocale from '../locale/use-locale';
    import Pagination from '../pagination';
    import Spin from '../spin';
    import Tree from '../tree';
    import AutoSizer from '../tree/auto-sizer.vue';
    import type { TreeNodeData, TreeValue } from '../tree/interface';
    import type { TransferDataItem, TransferEmits, TransferHandle, TransferProps, TransferSelectedPanelSlotProps, TransferSlots, TransferSourcePanelSlotProps, TransferValue } from './interface';
    import TransferSelectedItem from './transfer-selected-item.vue';

    type ResolvedItem = BasicResolvedDataItem & TransferDataItem;
    type Foundation = TransferFoundation<TransferBaseProps>;
    type Adapter = TransferAdapter<TransferBaseProps>;

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
        (view) => TransferFoundation.getInitialState(view),
        () => ({
            notifyBlur: (event) => emit('blur', event),
            notifyChange: (values, items) => {
                emit('update:modelValue', values);
                emit('change', values, items as TransferDataItem[]);
            },
            notifySearch: (input) => emit('search', input),
            notifySelect: (item) => emit('select', item as TransferDataItem),
            notifyDeselect: (item) => emit('deselect', item as TransferDataItem),
            searchTree: (keyword) => tree.value?.search(keyword),
            notifyPageChange: (currentPage) => props.pagination?.onPageChange?.(currentPage),
        }),
        { props: { value: () => props.modelValue, filter: () => filter.value } }
    );

    const view = computed(() => TransferFoundation.deriveView<ResolvedItem>({ dataSource: props.dataSource, type: props.type, value: props.modelValue, filter: filter.value, pagination: props.pagination, showPath: props.showPath }, state.value));
    const isTree = computed(() => props.type === strings.TYPE_TREE_TO_LIST);
    const isList = computed(() => props.type === strings.TYPE_LIST || props.type === strings.TYPE_GROUP_LIST);
    const selectedData = computed(() => view.value.selectedData);
    const selectedKeys = computed(() => selectedData.value.map((item) => item.key));
    const virtualized = computed(() => Boolean(props.virtualize && Object.keys(props.virtualize).length));
    const virtualHeight = computed(() => (typeof props.virtualize?.height === 'number' ? props.virtualize.height : undefined));

    // Transfer owns the Tree's value, data and ref: a caller's would fight the selection, break the flat item map or
    // replace the search handle
    const treeBindings = computed(() => omit((props.treeProps ?? {}) as Record<string, unknown>, ['modelValue', 'defaultValue', 'onChange', 'onUpdate:modelValue', 'ref', 'keyMaps', 'treeData', 'treeDataSimpleJson', 'changeWithObject']));

    // the index signature of TransferInputProps still lets these through, and a v-bind modelValue would take over the search box
    const inputBindings = computed(() => omit((props.inputProps ?? {}) as Record<string, unknown>, ['modelValue', 'defaultValue']));

    // the root is not a focus target: a tabindex (one injected by a wrapping Tooltip included) goes to the search box;
    // role="group" does not support aria-required
    const splitAttrs = (attrs: Record<string, unknown>) => splitControlAttrs(omit(attrs, ['aria-required']), (key) => key === 'tabindex' || key === 'tabIndex');

    const pathLabel = (item: ResolvedItem) => (isTree.value && props.showPath ? TransferFoundation.generatePath(item) : undefined);

    const asItem = (item: TreeNodeData) => item as TransferDataItem;

    const onTreeChange = (value: TreeValue) => foundation.handleSelect(value as TransferValue);

    const onInputChange = (input: string) => foundation.handleInputChange(input, true);

    const onSelectOrRemove = (item: TransferDataItem) => foundation.handleSelectOrRemove(item);

    const onAllClick = () => foundation.handleAll(!view.value.allChecked);

    const sourcePanelProps = (): TransferSourcePanelSlotProps => ({
        value: view.value.values,
        loading: props.loading,
        noMatch: view.value.noMatch,
        filterData: view.value.filterData,
        sourceData: view.value.data,
        propsDataSource: props.dataSource,
        allChecked: view.value.allChecked,
        showNumber: view.value.showNumber,
        inputValue: state.value.inputValue,
        selectedItems: view.value.selectedItems,
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
        () => props.draggable,
        (on) => {
            if (on && !Sortable.value) {
                void import('../../internal/sortable/sortable.vue').then((module) => {
                    Sortable.value = module.default;
                });
            }
        },
        { immediate: true }
    );

    watch(
        tree,
        (handle) => {
            if (handle) {
                foundation.handleTreeMount();
            }
        },
        { flush: 'post' }
    );

    defineExpose<TransferHandle>({
        search: (value) => foundation.handleInputChange(value, false),
    });
</script>

<template>
    <div :class="[prefixCls, { [`${prefixCls}-disabled`]: props.disabled, [`${prefixCls}-custom-panel`]: $slots.sourcePanel && $slots.selectedPanel }]" :role="namedRole($attrs)" v-bind="splitAttrs($attrs).root" @focusout="foundation.handleFocusOut">
        <slot v-if="$slots.sourcePanel" name="sourcePanel" v-bind="sourcePanelProps()" />
        <section v-else :class="`${prefixCls}-left`">
            <SearchLandmark v-if="filter !== false" :aria-label="locale.locale.filter" :class="`${prefixCls}-filter`">
                <Input :disabled="props.disabled" :modelValue="state.inputValue" :placeholder="locale.locale.placeholder" showClear v-bind="{ ...splitAttrs($attrs).control, ...inputBindings }" @change="onInputChange">
                    <template #prefix>
                        <IconSearch />
                    </template>
                </Input>
            </SearchLandmark>
            <Spin v-if="props.loading" />
            <template v-else-if="view.noMatch">
                <div v-if="showsEmpty($slots.emptySearch)" :class="[`${prefixCls}-empty`, `${prefixCls}-left-empty`]">
                    <slot name="emptySearch">{{ locale.locale.emptySearch }}</slot>
                </div>
            </template>
            <template v-else-if="view.data.length === 0">
                <div v-if="showsEmpty($slots.emptyLeft)" :class="[`${prefixCls}-empty`, `${prefixCls}-left-empty`]">
                    <slot name="emptyLeft">{{ locale.locale.emptyLeft }}</slot>
                </div>
            </template>
            <template v-else-if="isList || isTree">
                <slot v-if="$slots.sourceHeader" :allChecked="view.allChecked" :leafOnlyNum="view.leafOnlyNum" name="sourceHeader" :num="view.showNumber" :onAllClick="onAllClick" :showButton="view.showAllButton" />
                <div v-else :class="[`${prefixCls}-header`, `${prefixCls}-left-header`]">
                    <span :class="`${prefixCls}-header-total`">{{ formatLocale(locale.locale.total, { total: view.showNumber }) }}</span>
                    <Button v-if="view.showAllButton" :class="`${prefixCls}-header-all`" :disabled="props.disabled" size="small" theme="borderless" type="tertiary" @click="onAllClick">{{ view.allChecked ? locale.locale.clearSelectAll : locale.locale.selectAll }}</Button>
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
                    :modelValue="view.values"
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
                    <component :is="group.grouped ? 'div' : SlotFragment" v-for="group in view.groups" :key="group.index" :role="group.grouped ? 'listitem' : undefined">
                        <div v-if="group.grouped" :id="groupTitleId(group.index)" :class="`${prefixCls}-group-title`">
                            {{ group.title }}
                        </div>
                        <component :is="group.grouped ? 'div' : SlotFragment" :aria-labelledby="group.grouped ? groupTitleId(group.index) : undefined" :role="group.grouped ? 'list' : undefined">
                            <template v-for="{ item, index } in group.items" :key="item.key">
                                <div v-if="$slots.sourceItem" role="listitem">
                                    <slot :checked="view.selectedItems.has(item.key)" :index="index" :item="item" name="sourceItem" :onChange="() => onSelectOrRemove(item)" />
                                </div>
                                <Checkbox v-else :class="[`${prefixCls}-item`, { [`${prefixCls}-item-disabled`]: item.disabled }]" :disabled="item.disabled || props.disabled" :modelValue="view.selectedItems.has(item.key)" role="listitem" @change="onSelectOrRemove(item)">
                                    <slot :item="item" name="label">{{ item.label }}</slot>
                                </Checkbox>
                            </template>
                        </component>
                    </component>
                </div>
                <div v-if="isList && props.pagination && view.totalPage > 1" :class="`${prefixCls}-left-pagination`">
                    <Pagination :currentPage="view.currentPage" :pageSize="view.pageSize" :total="view.filterData.length" @pageChange="foundation.handlePageChange" />
                </div>
            </template>
        </section>
        <slot v-if="$slots.selectedPanel" name="selectedPanel" v-bind="selectedPanelProps()" />
        <section v-else :class="`${prefixCls}-right`">
            <slot v-if="$slots.selectedHeader" name="selectedHeader" :num="selectedData.length" :onClear="foundation.handleClear" :showButton="view.showClearButton" />
            <div v-else :class="[`${prefixCls}-header`, `${prefixCls}-right-header`]">
                <span :class="`${prefixCls}-header-total`">{{ formatLocale(locale.locale.selected, { total: selectedData.length }) }}</span>
                <Button v-if="view.showClearButton" :class="`${prefixCls}-header-all`" :disabled="props.disabled" size="small" theme="borderless" type="tertiary" @click="foundation.handleClear">{{ locale.locale.clear }}</Button>
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
