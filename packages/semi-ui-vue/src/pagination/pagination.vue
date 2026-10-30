<script setup lang="ts">
    import { Text, computed, watch } from 'vue';
    import { cssClasses, numbers } from '@fibrae/semi-foundation/pagination/constants';
    import PaginationFoundation, { type PaginationAdapter, type PaginationBaseState } from '@fibrae/semi-foundation/pagination/foundation';
    import { ENTER_KEY, isComposing } from '@fibrae/semi-foundation/utils/key-code';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import '@fibrae/semi-foundation/pagination/pagination.scss';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import slotNodes, { isSlotContent } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import InputNumber from '../input-number';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import Select from '../select';
    import type { PaginationEmits, PaginationProps, PaginationSlots } from './interface';
    import RestPages from './rest-pages.vue';

    type Foundation = PaginationFoundation<PaginationProps, PaginationBaseState>;
    type Adapter = PaginationAdapter<PaginationProps, PaginationBaseState>;

    const props = withDefaults(defineProps<PaginationProps & /* @vue-ignore */ ElementProps<'ul', keyof PaginationProps | EmitHandlers<PaginationEmits>>>(), {
        total: () => semiDefault('Pagination', 'total', 1),
        showTotal: () => semiDefault('Pagination', 'showTotal', false),
        pageSize: semiGlobalDefault('Pagination', 'pageSize'),
        pageSizeOpts: () => semiDefault('Pagination', 'pageSizeOpts', [...numbers.PAGE_SIZE_OPTION]),
        size: () => semiDefault('Pagination', 'size', 'default'),
        currentPage: semiGlobalDefault('Pagination', 'currentPage'),
        defaultCurrentPage: () => semiDefault('Pagination', 'defaultCurrentPage', 1),
        showSizeChanger: () => semiDefault('Pagination', 'showSizeChanger', false),
        showQuickJumper: () => semiDefault('Pagination', 'showQuickJumper', false),
        popoverPosition: semiGlobalDefault('Pagination', 'popoverPosition'),
        hideOnSinglePage: () => semiDefault('Pagination', 'hideOnSinglePage', false),
        hoverShowPageSelect: semiGlobalDefault('Pagination', 'hoverShowPageSelect'),
        disabled: () => semiDefault('Pagination', 'disabled', false),
        preventPageChangeOnPageSizeChange: () => semiDefault('Pagination', 'preventPageChangeOnPageSizeChange', false),
    });

    const emit = defineEmits<PaginationEmits>();
    defineSlots<PaginationSlots>();

    const config = useConfig();
    const locale = useLocale('Pagination');

    const { foundation, state } = useFoundation<Foundation, Adapter, PaginationProps, PaginationBaseState>(
        PaginationFoundation,
        props,
        (view) => PaginationFoundation.getInitialState(view),
        (base) => ({
            updatePageSize: (pageSize) => base.setState({ pageSize }),
            updateQuickJumpPage: (quickJumpPage) => base.setState({ quickJumpPage }),
            setCurrentPage: (currentPage) => base.setState({ currentPage }),
            notifyPageChange: (pageIndex) => {
                emit('update:currentPage', pageIndex);
                emit('pageChange', pageIndex);
            },
            notifyPageSizeChange: (pageSize) => {
                emit('update:pageSize', pageSize);
                emit('pageSizeChange', pageSize);
            },
            notifyChange: (pageIndex, pageSize) => emit('change', pageIndex, pageSize),
        })
    );

    const prefix = cssClasses.PREFIX;
    const text = computed(() => locale.value.locale);
    const sizeChangerShown = computed(() => props.showSizeChanger && props.size !== 'small');
    const totalPageNum = computed(() => PaginationFoundation.getTotalPageNumber(props.total, state.value.pageSize));
    const disabledState = computed(() => PaginationFoundation.getDisabled(state.value.currentPage, props.total, state.value.pageSize));
    const pageData = computed(() => PaginationFoundation.getPageList(state.value.currentPage, props.total, state.value.pageSize));
    const hidden = computed(() => totalPageNum.value < 2 && props.hideOnSinglePage && !sizeChangerShown.value);
    const quickJumpDisabled = computed(() => totalPageNum.value < 2 || props.disabled);
    const smallText = computed(() => `${state.value.currentPage}/${totalPageNum.value} `);
    const switchPosition = computed(() => props.popoverPosition ?? (config.value.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));

    const sizeOptions = computed(() =>
        PaginationFoundation.getPageSizeOpts(props.pageSizeOpts, state.value.pageSize).map((size) => ({
            value: size,
            label: text.value.pageSize.replace('${pageSize}', String(size)),
        }))
    );

    const pageLabel = (page: number) => text.value.pageN.replace('${page}', String(page));

    const isRest = (page: number | '...') => page === '...' && !props.disabled;

    const restPopoverProps = (page: number | '...') => (isRest(page) ? { position: props.popoverPosition, trigger: 'hover' as const } : {});

    // Only plain text names the button; icons and elements keep the locale name, empty text falls back to the default icon
    const textView = (slot: PaginationSlots['prevText']) => {
        const nodes = slotNodes(slot?.() ?? []);
        return {
            nodes,
            hasContent: nodes.some(isSlotContent),
            namedByContent: nodes.length === 1 && nodes[0][0].type === Text && isSlotContent(nodes[0]),
        };
    };

    const changePageSize = (value?: number) => {
        if (value !== undefined) {
            foundation.changePageSize(value);
        }
    };

    // InputNumber does not declare an enter event; its keydown fires for every key
    const onQuickJumpKeydown = (event: KeyboardEvent) => {
        if (event.key === ENTER_KEY && !isComposing(event)) {
            foundation.handleQuickJumpEnterPress((event.target as HTMLInputElement).value);
        }
    };

    // Only the pageSize prop itself may overwrite the page size: the size changer writes state alone, and a total change
    // must not revert that choice.
    watch(
        () => props.currentPage,
        (page) => foundation.updatePage(page)
    );

    watch(
        () => props.total,
        () => foundation.updatePage(props.currentPage)
    );

    watch(
        () => props.pageSize,
        (size) => {
            // v-model:pageSize writes back the size the changer just chose; restarting at page 1 would undo the page the
            // changer recomputed
            if (size !== state.value.pageSize) {
                foundation.updatePage(props.currentPage, size);
            }
        }
    );

    watch(
        () => sizeChangerShown.value && props.hideOnSinglePage,
        (conflict) => warning(conflict, '[Semi Pagination] You should not use showSizeChanger and hideOnSinglePage in ths same time. At this time, hideOnSinglePage no longer takes effect, otherwise there may be a problem that the switch entry disappears'),
        { immediate: true }
    );
</script>

<template>
    <ul v-if="!hidden" :class="[prefix, { [`${prefix}-small`]: props.size === 'small', [`${prefix}-disabled`]: props.disabled }]">
        <li v-if="props.showTotal && props.size !== 'small'" :class="`${prefix}-total`">
            {{ text.total.replace('${total}', totalPageNum.toString()) }}
        </li>
        <!-- one-item list: the slot runs once per render; the constant key keeps the button and its focus -->
        <li v-for="(prev, i) in [textView($slots.prevText)]" :key="i">
            <button
                :aria-label="prev.namedByContent ? undefined : text.prev"
                :class="[`${prefix}-item`, `${prefix}-prev`, { [`${prefix}-item-disabled`]: disabledState.prevDisabled || props.disabled }]"
                :disabled="disabledState.prevDisabled || props.disabled"
                type="button"
                x-semi-prop="prevText"
                @click="foundation.goPrev"
            >
                <template v-if="prev.hasContent">
                    <component :is="node" v-for="[node, key] in prev.nodes" :key="key" />
                </template>
                <IconChevronLeft v-else size="large" />
            </button>
        </li>
        <li v-if="props.size === 'small'">
            <Popover v-if="props.hoverShowPageSelect && !props.disabled">
                <button :class="[`${prefix}-item`, `${prefix}-item-small`]" type="button">{{ smallText }}</button>
                <template #content>
                    <RestPages :count="totalPageNum" :start="1" @select="foundation.goPage" />
                </template>
            </Popover>
            <div v-else :class="[`${prefix}-item`, `${prefix}-item-small`, { [`${prefix}-item-all-disabled`]: props.disabled }]">
                {{ smallText }}
            </div>
        </li>
        <template v-else>
            <li v-for="(page, i) in pageData.pageList" :key="page === '...' ? (i < 3 ? 'rest-left' : 'rest-right') : page">
                <component :is="isRest(page) ? Popover : SlotFragment" v-bind="restPopoverProps(page)">
                    <button
                        :aria-current="page === state.currentPage ? 'page' : undefined"
                        :aria-label="page === '...' ? text.more : pageLabel(page)"
                        :class="[
                            `${prefix}-item`,
                            {
                                [`${prefix}-item-active`]: page === state.currentPage,
                                [`${prefix}-item-all-disabled`]: props.disabled,
                                [`${prefix}-item-all-disabled-active`]: page === state.currentPage && props.disabled,
                            },
                        ]"
                        :disabled="props.disabled"
                        type="button"
                        @click="foundation.goPage(page)"
                    >
                        {{ page }}
                    </button>
                    <template v-if="isRest(page)" #content>
                        <RestPages v-bind="i < 3 ? pageData.restLeftRange : pageData.restRightRange" @select="foundation.goPage" />
                    </template>
                </component>
            </li>
        </template>
        <li v-for="(next, i) in [textView($slots.nextText)]" :key="i">
            <button
                :aria-label="next.namedByContent ? undefined : text.next"
                :class="[`${prefix}-item`, `${prefix}-next`, { [`${prefix}-item-disabled`]: disabledState.nextDisabled || props.disabled }]"
                :disabled="disabledState.nextDisabled || props.disabled"
                type="button"
                x-semi-prop="nextText"
                @click="foundation.goNext"
            >
                <template v-if="next.hasContent">
                    <component :is="node" v-for="[node, key] in next.nodes" :key="key" />
                </template>
                <IconChevronRight v-else size="large" />
            </button>
        </li>
        <li v-if="sizeChangerShown" :class="`${prefix}-switch`">
            <Select :aria-label="text.pageSizeSelector" clickToHide :disabled="props.disabled" :dropdownClassName="`${prefix}-select-dropdown`" :modelValue="state.pageSize" :optionList="sizeOptions" :position="switchPosition" @change="changePageSize" />
        </li>
        <li v-if="props.showQuickJumper" :class="[`${prefix}-quickjump`, { [`${prefix}-quickjump-disabled`]: quickJumpDisabled }]">
            <span>{{ text.jumpTo }}</span>
            <InputNumber :aria-label="text.jumpTo" :class="`${prefix}-quickjump-input-number`" :disabled="quickJumpDisabled" hideButtons :modelValue="state.quickJumpPage" :showClear="false" @blur="foundation.handleQuickJumpBlur" @change="foundation.handleQuickJumpNumberChange" @keydown="onQuickJumpKeydown" />
            <span>{{ text.page }}</span>
        </li>
    </ul>
</template>
