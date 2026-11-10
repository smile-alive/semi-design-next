<script setup lang="ts" generic="T = BasicSelectValue, Multiple extends boolean | undefined = undefined">
    import { computed, isRef, mergeProps, shallowRef, useAttrs, useId, useTemplateRef, watch, type ShallowRef, type StyleValue } from 'vue';
    import { isEqualWith, omit } from 'es-toolkit';
    import FocusTrapHandle from '@fibrae/semi-foundation/base/focus-handle';
    import { comboboxName } from '@fibrae/semi-foundation/components/select/combobox-name';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/components/select/constants';
    import SelectFoundation, { type SelectAdapter, type SelectBaseProps, type SelectBaseState, getOptionId } from '@fibrae/semi-foundation/components/select/foundation';
    import { getOptionRuns, type BasicOptionProps, type OptionRecord as BaseOptionRecord } from '@fibrae/semi-foundation/components/select/option-foundation';
    import { cssClasses as tagCssClasses } from '@fibrae/semi-foundation/components/tag/constants';
    import { isTextEditor, joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/components/select/select.scss';
    import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../../base/element-props';
    import { readSemiDefault, useSemiGlobal } from '../../base/semi-default';
    import SlotFragment from '../../base/slot-fragment';
    import useFoundation from '../../base/use-foundation';
    import useClickOutside from '../../composables/use-click-outside';
    import VirtualList from '../../internal/virtual-list.vue';
    import { splitControlAttrs } from '../../utils/control-attrs';
    import slotKind from '../../utils/slot-kind';
    import { hasSlotContent } from '../../utils/slot-nodes';
    import useConfig from '../config-provider/use-config';
    import Input, { type InputHandle } from '../input';
    import useGroupLooks from '../input/composables/use-group-looks';
    import { provideInputGroupContext } from '../input/context';
    import useLocale from '../locale/use-locale';
    import OverflowList from '../overflow-list';
    import Popover from '../popover';
    import Space from '../space';
    import Spin from '../spin';
    import Tag, { TagGroup, type TagCloseEvent } from '../tag';
    import { useNestedPopups } from '../tooltip/context';
    import { TypographyText } from '../typography';
    import { provideOptionPrefixContext } from './context';
    import type { BasicSelectValue, SelectChangeValue, SelectCreateItemSlotProps, SelectEmits, SelectHandle, SelectOptionItemSlotProps, SelectOptionProps, SelectProps, SelectSelectedItemSlotProps, SelectSlots, SelectTriggerSlotProps } from './interface';
    import SelectOptGroup from './option-group.vue';
    import SelectOption from './option.vue';
    import { slotsByValue, type GroupRecord, type OptionRecord } from './utils';

    type FoundationProps = SelectBaseProps & { preventScroll?: boolean };
    type Foundation = SelectFoundation<FoundationProps, SelectBaseState, Event>;
    type Adapter = SelectAdapter<FoundationProps, SelectBaseState, Event>;

    type DefaultedKey =
        | 'remote'
        | 'allowCreate'
        | 'autoClearSearchValue'
        | 'autofocus'
        | 'defaultOpen'
        | 'clickToHide'
        | 'defaultActiveFirstOption'
        | 'changeWithObject'
        | 'maxHeight'
        | 'showRestTagsPopover'
        | 'expandRestTagsOnClick'
        | 'ellipsisTrigger'
        | 'borderless'
        | 'searchPosition'
        | 'loading'
        | 'showArrow'
        | 'showClear'
        | 'dropdownMatchSelectWidth'
        | 'motion'
        | 'autoAdjustOverflow'
        | 'stopPropagation';

    defineOptions({ inheritAttrs: false });

    // Only select.vue renders this component and passes every prop already resolved, so none is absent: no Boolean
    // casting applies, and Required restores the narrowing its defaults give
    const props = defineProps<SelectProps<T, Multiple> & Required<Pick<SelectProps<T, Multiple>, DefaultedKey>> & { optionRecords: OptionRecord[] } & /* @vue-ignore */ ElementProps<'div', keyof SelectProps<T, Multiple> | EmitHandlers<SelectEmits<T, Multiple>>>>();
    const emit = defineEmits<SelectEmits<T, Multiple>>();
    const slots = defineSlots<SelectSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Select');

    const trigger = useTemplateRef('trigger');
    const popover = useTemplateRef('popover');
    const triggerInput = shallowRef<InputHandle | null>(null);
    const dropdownInput = shallowRef<InputHandle | null>(null);
    const clearButton = useTemplateRef('clearButton');

    // Annotated: the adapter's getOptionList reads this ref, so inference is circular (TS7022)
    const optionContainer = useTemplateRef<HTMLDivElement>('optionContainer');
    const virtualList = useTemplateRef('virtualList');
    const generatedId = useId();
    const listboxId = useId();
    const selectionTextId = useId();
    const comboboxKeys = new Set(['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const looks = useGroupLooks('Select', props, { disabled: false });

    const prefix = cssClasses.PREFIX;
    const filter = computed(() => props.filter ?? readSemiDefault(semi, 'Select', 'filter', false));

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, SelectBaseState>(
        SelectFoundation,
        props as Readonly<Partial<FoundationProps>>,
        (view) => SelectFoundation.getInitialState(view, props.optionRecords as BaseOptionRecord[]),
        () => ({
            focusInput: () => triggerInput.value?.focus({ preventScroll: props.preventScroll }),
            focusDropdownInput: () => dropdownInput.value?.focus({ preventScroll: props.preventScroll }),
            notifyMaxLimit: (option) => emit('exceed', option as SelectOptionProps),
            notifyDeselect: (value, option) => emit('deselect', value as string | number, option as SelectOptionProps),
            getOptionsFromChildren: () => props.optionRecords as BaseOptionRecord[],
            notifyChange: (value) => {
                const payload = value as SelectChangeValue<T, Multiple>;
                emit('update:modelValue', payload);
                emit('change', payload);
            },
            notifySelect: (value, option) => emit('select', value as string | number, option as SelectOptionProps),
            notifyDropdownVisibleChange: (visible) => emit('dropdownVisibleChange', visible),
            notifySearch: (inputValue, event) => emit('search', inputValue, event),
            notifyCreate: (option) => emit('create', option as SelectOptionProps),
            // mouseenter and mouseleave reach the root as native listeners through the attrs
            notifyMouseEnter: () => undefined,
            notifyMouseLeave: () => undefined,
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            notifyClear: () => emit('clear'),
            notifyListScroll: (event) => emit('listScroll', event),
            focusTrigger: () => trigger.value?.focus({ preventScroll: props.preventScroll }),
            getOptionList: () => optionContainer.value,
            getListId: () => selectId(),
            getTriggerInput: () => triggerInput.value?.input,
            scrollVirtualTo: (index, align) => virtualList.value?.scrollToItem(index, align),
        }),
        {
            props: {
                disabled: () => looks.disabled,
                value: () => props.modelValue,
                onChangeWithObject: () => props.changeWithObject,
                autoFocus: () => props.autofocus,
                filter: () => filter.value as SelectBaseProps['filter'],
            },
        }
    );

    const filterable = computed(() => Boolean(filter.value));
    const position = computed(() => SelectFoundation.getPosition(props.position, config.value.direction));
    const searchInTrigger = computed(() => props.searchPosition === strings.SEARCH_POSITION_TRIGGER);
    const selectedSlots = computed(() => slotsByValue(props.optionRecords));

    // the Inputs inside are parts of this control, not members of the group
    provideInputGroupContext(undefined);
    provideOptionPrefixContext(undefined);

    // A ref in inputProps would replace the Select's own vnode ref, so the Select sets both
    const setInputRef = (own: ShallowRef<InputHandle | null>) => (input: unknown) => {
        own.value = input as InputHandle | null;
        const outer = props.inputProps?.ref;
        if (isRef(outer)) {
            outer.value = input;
        } else if (typeof outer === 'function') {
            outer(input);
        }
    };

    const setTriggerInput = setInputRef(triggerInput);
    const setDropdownInput = setInputRef(dropdownInput);

    // a function in the record compares by presence: markup labels live only in an option's slot
    const sameOptions = (a: OptionRecord[], b: OptionRecord[]) => isEqualWith(a, b, (x, y) => (typeof x === 'function' && typeof y === 'function' ? true : undefined));

    const selectId = () => props.id || generatedId;

    const visibleOptions = computed(() => SelectFoundation.getVisibleOptions(state.value.options as OptionRecord[]));
    const selectedItems = computed((): SelectOptionProps[] => [...state.value.selections.values()]);
    const tagFold = computed(() => SelectFoundation.getTagFold(props, state.value, selectedItems.value.length));
    const clearable = computed(() => SelectFoundation.isClearable({ showClear: props.showClear, disabled: looks.disabled }, state.value));
    const optionRuns = computed(() => getOptionRuns(visibleOptions.value));

    const optionId = (index: number) => getOptionId(selectId(), index);

    const activeDescendant = computed(() => {
        const { isOpen, focusIndex } = state.value;
        const index = SelectFoundation.getActiveOptionIndex({ isOpen, loading: props.loading, focusIndex, visibleCount: visibleOptions.value.length });
        return index === undefined ? undefined : optionId(index);
    });

    const inputId = () => (props.inputProps?.id as string | undefined) ?? `${selectId()}-input`;

    const isComboboxKey = (key: string) => comboboxKeys.has(key);

    // ARIA 1.2: while the search input is in the trigger it is the combobox, otherwise the trigger is a select-only
    // combobox. The single-select input mounts only while searching, so the closed trigger exposes the selected text
    const inputIsCombobox = () => SelectFoundation.isInputCombobox({ filter: filter.value, searchPosition: props.searchPosition, multiple: props.multiple }, state.value.showInput, Boolean(slots.trigger));

    // A rendered inset label names the combobox and the listbox, so it needs an id even when the caller gives none
    const insetLabelShown = () => !slots.trigger && !slotKind(slots.prefix) && Boolean(slotKind(slots.insetLabel));

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? `${selectId()}-inset-label` : undefined);

    // The listbox binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const nameAttrs = () => comboboxName(attrs['aria-labelledby'] as string | undefined, attrs['aria-label'] as string | undefined, insetLabelShown() ? prefixId() : undefined, locale.value.locale.label);

    const comboboxAttrs = () => ({
        ...splitControlAttrs(attrs, isComboboxKey).control,
        role: 'combobox',
        'aria-activedescendant': activeDescendant.value,
        'aria-controls': listboxId,
        'aria-expanded': state.value.isOpen,
        'aria-haspopup': 'listbox' as const,
        ...nameAttrs(),
    });

    const rootAttrs = () => ({
        ...splitControlAttrs(attrs, isComboboxKey).root,
        ...(inputIsCombobox() ? {} : { ...comboboxAttrs(), 'aria-disabled': looks.disabled }),
    });

    const kinds = () => ({
        prefix: slotKind(slots.prefix),
        insetLabel: slotKind(slots.insetLabel),
        suffix: slotKind(slots.suffix),
    });

    const rootClass = (k: ReturnType<typeof kinds>) =>
        slots.trigger
            ? []
            : [
                  prefix,
                  {
                      [`${prefix}-borderless`]: props.borderless,
                      [`${prefix}-open`]: state.value.isOpen,
                      [`${prefix}-focus`]: state.value.isFocus,
                      [`${prefix}-disabled`]: looks.disabled,
                      [`${prefix}-single`]: !props.multiple,
                      [`${prefix}-multiple`]: props.multiple,
                      [`${prefix}-filterable`]: filterable.value,
                      [`${prefix}-small`]: looks.size === 'small',
                      [`${prefix}-large`]: looks.size === 'large',
                      [`${prefix}-error`]: props.validateStatus === 'error',
                      [`${prefix}-warning`]: props.validateStatus === 'warning',
                      [`${prefix}-no-arrow`]: !props.showArrow,
                      [`${prefix}-with-prefix`]: Boolean(k.prefix || k.insetLabel),
                      [`${prefix}-with-suffix`]: Boolean(k.suffix),
                  },
              ];

    const handleInputChange = (value: string, event?: Event) => foundation.handleInputChange(value, event);

    // The search input is inside the trigger, so its keys bubble here. The Select handles a key before the listeners
    const handleKeyDown = (event: KeyboardEvent) => {
        foundation.handleKeyDown(event);
        emit('keydown', event);
    };

    // A press would move the focus to the popup container, where the keys never reach the combobox; it stays on the
    // trigger or the dropdown search input. A text field in a slot still takes the focus.
    const keepFocusOnPress = (event: MouseEvent) => {
        if (!isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    const triggerInputBindings = () => ({
        ...comboboxAttrs(),
        id: inputId(),
        'aria-autocomplete': 'list' as const,
        // the single-select text sits beside the input, which is empty until the user types, so the combobox has no
        // value of its own; the text is exposed as the description
        'aria-describedby': joinIds(attrs['aria-describedby'], props.multiple || state.value.inputValue ? undefined : selectionTextId),
        size: looks.size,
        modelValue: state.value.inputValue,
        disabled: looks.disabled,
        onChange: handleInputChange,
        // the trigger draws its own clear button: a global Input default must not add one
        showClear: false,
        ...omit(props.inputProps ?? {}, ['ref']),
        class: [`${prefix}-input`, props.multiple ? `${prefix}-input-multiple` : `${prefix}-input-single`, props.inputProps?.class],
        style: props.multiple ? { width: state.value.inputValue ? `${state.value.inputValue.length * 16}px` : '2px' } : props.inputProps?.style,
    });

    // a search field over the trigger's list, not a second combobox (React Aria Autocomplete pattern)
    const dropdownInputBindings = () =>
        mergeProps(
            {
                'aria-activedescendant': activeDescendant.value,
                'aria-autocomplete': 'list',
                'aria-controls': listboxId,
                ...nameAttrs(),
                modelValue: state.value.inputValue,
                disabled: looks.disabled,
                placeholder: props.searchPlaceholder,
                showClear: true,
                onChange: handleInputChange,
                ...omit(props.inputProps ?? {}, ['ref']),
                class: [`${prefix}-dropdown-input`, props.multiple ? `${prefix}-dropdown-input-multiple` : `${prefix}-dropdown-input-single`, props.inputProps?.class],
            },
            // The popup is not a DOM descendant of the trigger, so keydown does not bubble to it from this input;
            // mergeProps runs the owner's onKeydown first, as it does on the trigger input
            { onKeydown: (event: KeyboardEvent) => foundation.handleKeyDown(event) }
        );

    // the option as kept in state, the same object Enter selects; a row's own copy drops class, style and its props
    const handleSelect = (option: OptionRecord, index: number, event: MouseEvent) => foundation.onSelect(option as BaseOptionRecord, index, event);

    const optionRowProps = (option: OptionRecord, index: number, rowStyle?: StyleValue) => {
        // a `key` field would become the vnode key; the events read the option from state, which keeps it
        const { key: _key, style, ...rest } = option.data;
        return {
            showTick: true,
            ...rest,
            style: [rowStyle, style] as StyleValue,
            focused: index === state.value.focusIndex,
            inputValue: state.value.inputValue,
            selected: option.selected,
            semiOptionId: optionId(index),
        };
    };

    const optionItemProps = (option: OptionRecord, index: number, rowStyle?: StyleValue): SelectOptionItemSlotProps => {
        const { key: _key, class: className, style, label, value, disabled, showTick: _showTick, ...rest } = option.data;
        const { selected } = option;
        return {
            id: optionId(index),
            disabled,
            focused: index === state.value.focusIndex,
            selected,
            style: [rowStyle, style] as StyleValue,
            label,
            value,
            inputValue: state.value.inputValue,
            onMouseenter: () => foundation.handleOptionMouseEnter(index),
            onClick: (event: MouseEvent) => {
                if (!disabled) {
                    handleSelect(option, index, event);
                }
            },
            class: [className, `${prefix}-option-custom`, { [`${prefix}-option-custom-selected`]: selected }],
            ...rest,
        };
    };

    const createItemProps = (option: OptionRecord, index: number, rowStyle?: StyleValue): SelectCreateItemSlotProps => ({
        inputValue: String(option.data.value),
        focus: index === state.value.focusIndex,
        style: rowStyle,
    });

    // the record's index, not the visible index: a row that filtering moves up keeps its node
    const rowKey = ({ data, childKey, index }: OptionRecord) => String(data.key ?? childKey ?? `${data.label}${data.value}${index}`);

    const hasTitle = (group?: GroupRecord): group is GroupRecord => Boolean(group && (group.labelSlot || group.label || group.label === 0));

    const groupTitleId = (group: GroupRecord, first: number) => (group.attrs.id as string | undefined) ?? `${selectId()}-group-${first}`;

    const groupWrapperAttrs = (group: GroupRecord | undefined, first: number) => (hasTitle(group) ? { 'aria-labelledby': groupTitleId(group, first), class: `${prefix}-group-wrapper`, role: 'group' } : {});

    const emptyHidden = () => Boolean(slots.emptyContent) && !hasSlotContent(slots.emptyContent);

    const singleItem = () => selectedItems.value[0] as SelectOptionProps | undefined;

    const selectedSlot = (option: SelectOptionProps) => selectedSlots.value.get(option.value);

    const hasSingleContent = (option?: SelectOptionProps): option is SelectOptionProps => Boolean(option && (slots.selectedItem || selectedSlot(option) || option.label || option.label === 0));

    const singleTextClass = (shown: boolean) => {
        const searching = state.value.showInput && searchInTrigger.value;
        return [
            `${prefix}-selection-text`,
            {
                [`${prefix}-selection-placeholder`]: !shown,
                [`${prefix}-selection-text-hide`]: Boolean(state.value.inputValue) && searching,
                [`${prefix}-selection-text-inactive`]: !state.value.inputValue && searching,
            },
        ];
    };

    const removeTag = (option: SelectOptionProps, event?: TagCloseEvent) => {
        // keeps the Tag from hiding itself in controlled mode
        event?.preventDefault();
        // as with the clear button, a tag going while it has the focus hands the focus to the combobox
        const tag = event?.currentTarget instanceof Element ? event.currentTarget.closest(`.${tagCssClasses.PREFIX}`) : null;
        if (tag && tag === FocusTrapHandle.getActiveElement(tag)) {
            foundation.focus(undefined, false);
        }
        foundation.removeTag(option as BasicOptionProps);
    };

    const selectedItemProps = (option: SelectOptionProps, index: number): SelectSelectedItemSlotProps => ({
        option,
        index,
        disabled: Boolean(option.disabled || looks.disabled),
        onClose: (event) => removeTag(option, event),
    });

    // the same size mapping as TreeSelect, Cascader and TagInput: a default-size trigger holds large tags
    const tagSize = () => (looks.size === 'small' ? 'small' : 'large');

    const collapsedTags = () => selectedItems.value.slice(0, tagFold.value.limit);

    // OverflowList shows the first overflowed item collapsed, so every other one is hidden; [] means all fit
    const handleOverflow = (items: SelectOptionProps[]) => foundation.updateOverflowItemCount(Math.max(items.length - 1, 0));

    const groupTags = () => selectedItems.value.slice(0, tagFold.value.shownCount);

    const restPopoverBindings = () => ({
        autoAdjustOverflow: true,
        position: 'top' as const,
        showArrow: true,
        trigger: 'hover' as const,
        ...props.restTagsPopoverProps,
    });

    const triggerSlotProps = (): SelectTriggerSlotProps => ({
        value: selectedItems.value,
        inputValue: state.value.inputValue,
        placeholder: props.placeholder,
        disabled: looks.disabled,
        componentProps: { ...omit(props, ['optionRecords']), ...looks },
        onSearch: (value) => handleInputChange(value),
        // bound to a click inside the trigger: stopped so the trigger does not reopen the list
        onClear: (event) => foundation.handleClearClick(event),
        onRemove: (option) => foundation.removeTag(option as BasicOptionProps),
    });

    // select.vue passes a new option array on every render; an option list change also re-resolves the selection,
    // which keeps labels of earlier options
    watch(
        () => props.optionRecords,
        (options, prevOptions) => {
            if (!sameOptions(prevOptions, options)) {
                foundation.handleOptionsChange();
            }
        },
        { flush: 'post' }
    );

    useClickOutside([trigger, optionContainer], foundation.handleClickOutside, () => state.value.isOpen, useNestedPopups());

    // The clear button goes with the value. A removed node fires no blur, so a focused button would drop the focus to
    // the body while the Select stays focused; this pre-flush watcher runs before the patch removes the button.
    watch(clearable, (allowed) => {
        if (!allowed && clearButton.value && clearButton.value === FocusTrapHandle.getActiveElement(clearButton.value)) {
            (triggerInput.value ?? trigger.value)?.focus({ preventScroll: props.preventScroll });
        }
    });

    defineExpose<SelectHandle>({
        close: () => foundation.close(),
        open: () => foundation.open(),
        focus: () => foundation.focus(),
        clearInput: () => foundation.clearInput(),
        selectAll: foundation.selectAll,
        deselectAll: foundation.clearSelected,
        search: foundation.handleInputChange,
        rePosition: () => popover.value?.rePosition(),
    });
</script>

<template>
    <Popover
        ref="popover"
        :autoAdjustOverflow="props.autoAdjustOverflow"
        disableArrowKeyDown
        :motion="props.motion"
        :position="position"
        role="presentation"
        :spacing="props.spacing"
        :stopPropagation="props.stopPropagation"
        :style="props.dropdownMatchSelectWidth ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined"
        trigger="custom"
        :visible="state.isOpen"
        @afterClose="foundation.handlePopoverClose"
        @escKeyDown="foundation.handleEscKeyDown"
        @open="foundation.scrollToSelection"
    >
        <div :id="selectId()" ref="trigger" v-bind="rootAttrs()" :class="rootClass(kinds())" :tabindex="looks.disabled || inputIsCombobox() ? -1 : 0" @click="foundation.handleClick" @focusin="foundation.handleFocusIn" @focusout="foundation.handleFocusOut" @keydown="handleKeyDown">
            <slot v-if="$slots.trigger" name="trigger" v-bind="triggerSlotProps()" />
            <template v-for="(k, i) in $slots.trigger ? [] : [kinds()]" v-else :key="i">
                <div
                    v-if="k.prefix || k.insetLabel"
                    :id="prefixId()"
                    :class="[
                        `${prefix}-prefix`,
                        {
                            [`${prefix}-inset-label`]: Boolean(k.insetLabel),
                            [`${prefix}-prefix-text`]: (k.prefix ?? k.insetLabel) === 'text',
                            [`${prefix}-prefix-icon`]: (k.prefix ?? k.insetLabel) === 'icon',
                        },
                    ]"
                    x-semi-prop="prefix,insetLabel"
                >
                    <slot v-if="k.prefix" name="prefix" />
                    <slot v-else name="insetLabel" />
                </div>
                <div :class="`${prefix}-selection`">
                    <div
                        v-if="props.multiple"
                        :class="[
                            `${prefix}-content-wrapper`,
                            {
                                [`${prefix}-content-wrapper-one-line`]: props.maxTagCount && !state.isOpen,
                                [`${prefix}-content-wrapper-empty`]: !selectedItems.length,
                            },
                        ]"
                    >
                        <template v-if="selectedItems.length">
                            <template v-if="tagFold.expanded">
                                <template v-for="(item, index) in selectedItems" :key="item.value">
                                    <slot v-if="$slots.tag" name="tag" v-bind="selectedItemProps(item, index)" />
                                    <Tag v-else :closable="!selectedItemProps(item, index).disabled" color="white" :size="tagSize()" :style="{ maxWidth: '100%' }" @close="removeTag(item, $event)">
                                        <slot v-if="$slots.selectedItem" name="selectedItem" v-bind="selectedItemProps(item, index)" />
                                        <component :is="selectedSlot(item)" v-else-if="selectedSlot(item)" />
                                        <template v-else>{{ item.label }}</template>
                                    </Tag>
                                </template>
                            </template>
                            <div v-else-if="props.ellipsisTrigger" :class="`${prefix}-content-wrapper-collapse`">
                                <OverflowList itemKey="value" :items="collapsedTags()" @overflow="handleOverflow">
                                    <template #item="{ item, index }">
                                        <slot v-if="$slots.tag" name="tag" v-bind="selectedItemProps(item, index)" />
                                        <Tag v-else :closable="!selectedItemProps(item, index).disabled" color="white" :size="tagSize()" :style="{ maxWidth: '100%' }" @close="removeTag(item, $event)">
                                            <slot v-if="$slots.selectedItem" name="selectedItem" v-bind="selectedItemProps(item, index)" />
                                            <component :is="selectedSlot(item)" v-else-if="selectedSlot(item)" />
                                            <template v-else>{{ item.label }}</template>
                                        </Tag>
                                    </template>
                                    <template #overflow="{ items }">
                                        <template v-for="item in items.slice(0, 1)" :key="item.value">
                                            <slot v-if="$slots.tag" name="tag" v-bind="selectedItemProps(item, collapsedTags().indexOf(item))" />
                                            <Tag v-else :closable="!selectedItemProps(item, 0).disabled" color="white" :size="tagSize()" :style="{ maxWidth: '100%' }" @close="removeTag(item, $event)">
                                                <slot v-if="$slots.selectedItem" name="selectedItem" v-bind="selectedItemProps(item, collapsedTags().indexOf(item))" />
                                                <TypographyText
                                                    v-else
                                                    :ellipsis="{
                                                        rows: 1,
                                                        showTooltip: {
                                                            type: 'popover',
                                                            opts: { style: { width: 'auto', fontSize: '12px' } },
                                                        },
                                                    }"
                                                    size="small"
                                                >
                                                    <component :is="selectedSlot(item)" v-if="selectedSlot(item)" />
                                                    <template v-else>{{ item.label }}</template>
                                                </TypographyText>
                                            </Tag>
                                        </template>
                                    </template>
                                </OverflowList>
                                <component :is="props.showRestTagsPopover ? Popover : SlotFragment" v-if="state.overflowItemCount > 0" v-bind="props.showRestTagsPopover ? restPopoverBindings() : {}">
                                    <Tag :class="`${prefix}-content-wrapper-collapse-tag`" :closable="false" color="grey" :size="tagSize()" :style="{ marginRight: 0, flexShrink: 0 }">+{{ state.overflowItemCount }}</Tag>
                                    <template #content>
                                        <Space :spacing="2" :style="{ maxWidth: '400px' }" wrap>
                                            <template v-for="(item, index) in selectedItems.slice(selectedItems.length - state.overflowItemCount)" :key="item.value">
                                                <slot v-if="$slots.tag" name="tag" v-bind="selectedItemProps(item, index)" />
                                                <Tag v-else :closable="!selectedItemProps(item, index).disabled" color="white" :size="tagSize()" :style="{ maxWidth: '100%' }" @close="removeTag(item, $event)">
                                                    <slot v-if="$slots.selectedItem" name="selectedItem" v-bind="selectedItemProps(item, index)" />
                                                    <component :is="selectedSlot(item)" v-else-if="selectedSlot(item)" />
                                                    <template v-else>{{ item.label }}</template>
                                                </Tag>
                                            </template>
                                        </Space>
                                    </template>
                                </component>
                            </div>
                            <TagGroup
                                v-else
                                :maxTagCount="tagFold.limit"
                                :popoverProps="props.showRestTagsPopover ? props.restTagsPopoverProps : undefined"
                                :restCount="tagFold.restCount"
                                :showPopover="props.showRestTagsPopover"
                                :size="tagSize()"
                                :tagList="groupTags().map((item) => ({ tagKey: item.value }))"
                                @plusNMouseEnter="foundation.updateIsFullTags"
                            >
                                <template #tag="{ index }">
                                    <template v-for="item in [selectedItems[index]]" :key="item.value">
                                        <slot v-if="$slots.tag" name="tag" v-bind="selectedItemProps(item, index)" />
                                        <Tag v-else :closable="!selectedItemProps(item, index).disabled" color="white" :size="tagSize()" :tabindex="-1" @close="removeTag(item, $event)">
                                            <slot v-if="$slots.selectedItem" name="selectedItem" v-bind="selectedItemProps(item, index)" />
                                            <component :is="selectedSlot(item)" v-else-if="selectedSlot(item)" />
                                            <template v-else>{{ item.label }}</template>
                                        </Tag>
                                    </template>
                                </template>
                            </TagGroup>
                        </template>
                        <span v-else-if="props.placeholder && !state.inputValue" :class="[`${prefix}-selection-text`, `${prefix}-selection-placeholder`]">{{ props.placeholder }}</span>
                        <Input v-if="filterable && searchInTrigger" :ref="setTriggerInput" v-bind="triggerInputBindings()" />
                    </div>
                    <div v-else :class="`${prefix}-content-wrapper`">
                        <template v-for="option in [singleItem()]" :key="String(option?.value)">
                            <span :id="selectionTextId" :class="singleTextClass(hasSingleContent(option))" x-semi-prop="placeholder">
                                <template v-if="hasSingleContent(option)">
                                    <slot v-if="$slots.selectedItem" :disabled="looks.disabled" :index="0" name="selectedItem" :onClose="() => foundation.handleClearClick()" :option="option" />
                                    <component :is="selectedSlot(option)" v-else-if="selectedSlot(option)" />
                                    <template v-else>{{ option.label }}</template>
                                </template>
                                <template v-else>{{ props.placeholder }}</template>
                            </span>
                        </template>
                        <Input v-if="filterable && state.showInput && searchInTrigger" :ref="setTriggerInput" v-bind="triggerInputBindings()" />
                    </div>
                </div>
                <div
                    v-if="k.suffix"
                    :class="[
                        `${prefix}-suffix`,
                        {
                            [`${prefix}-suffix-text`]: k.suffix === 'text',
                            [`${prefix}-suffix-icon`]: k.suffix === 'icon',
                        },
                    ]"
                    x-semi-prop="suffix"
                >
                    <slot name="suffix" />
                </div>
            </template>
            <!-- .stop keeps the button's own Enter and Space from the owner's keydown listeners, which listen to the combobox -->
            <button v-if="!$slots.trigger && clearable" ref="clearButton" :aria-label="locale.locale.clear" :class="`${prefix}-clear`" type="button" @click="foundation.handleClearClick" @keydown.enter.space.stop>
                <slot name="clearIcon">
                    <IconClear />
                </slot>
            </button>
            <template v-if="!$slots.trigger">
                <div v-if="props.showArrow" :class="`${prefix}-arrow`" x-semi-prop="arrowIcon">
                    <slot v-if="$slots.arrowIcon" name="arrowIcon" />
                    <IconChevronDown v-else />
                </div>
                <div v-else :class="`${prefix}-arrow-empty`" />
            </template>
        </div>
        <template #content>
            <div
                ref="optionContainer"
                :class="[
                    {
                        [`${prefix}-option-list-wrapper`]: !(visibleOptions.length === 0 && emptyHidden()),
                    },
                    props.dropdownClassName,
                ]"
                :style="props.dropdownStyle"
                @keydown="foundation.handleContainerKeyDown"
                @mousedown="keepFocusOnPress"
            >
                <div v-if="$slots.outerTopSlot" :class="`${prefix}-option-list-outer-top-slot`" @mouseenter="foundation.handleSlotMouseEnter">
                    <slot name="outerTopSlot" />
                </div>
                <div v-if="!searchInTrigger && filterable" :class="`${prefix}-dropdown-search-wrapper`">
                    <Input :ref="setDropdownInput" v-bind="dropdownInputBindings()">
                        <template #prefix>
                            <IconSearch />
                        </template>
                    </Input>
                </div>
                <!-- scroll.capture: with virtualize the scrolling element is the VirtualList inside, and scroll does not bubble -->
                <div :id="listboxId" v-bind="nameAttrs()" :aria-multiselectable="props.multiple" :class="[`${prefix}-option-list`, { [`${prefix}-option-list-chosen`]: state.selections.size }]" role="listbox" :style="{ maxHeight: toCssLength(props.maxHeight) }" @scroll.capture="foundation.handleListScroll">
                    <div v-if="$slots.innerTopSlot" :class="`${prefix}-option-list-inner-top-slot`" @mouseenter="foundation.handleSlotMouseEnter">
                        <slot name="innerTopSlot" />
                    </div>
                    <div v-if="props.loading" :class="`${prefix}-loading-wrapper`">
                        <Spin />
                    </div>
                    <template v-else-if="visibleOptions.length === 0">
                        <SelectOption v-if="!emptyHidden()" empty>
                            <slot v-if="$slots.emptyContent" name="emptyContent" />
                            <template v-else>{{ locale.locale.emptyText }}</template>
                        </SelectOption>
                    </template>
                    <VirtualList v-else-if="props.virtualize" ref="virtualList" :height="props.virtualize.height || numbers.LIST_HEIGHT" :itemCount="visibleOptions.length" :itemSize="props.virtualize.itemSize" :style="{ direction: config.direction }" :tabindex="-1" :width="props.virtualize.width || '100%'">
                        <template #default="{ index, style: rowStyle }">
                            <template v-for="option in [visibleOptions[index]]" :key="rowKey(option)">
                                <div v-if="option.create && $slots.createItem" :id="optionId(index)" aria-selected="false" role="option" @click="handleSelect(option, index, $event)">
                                    <slot name="createItem" v-bind="createItemProps(option, index, rowStyle)" />
                                </div>
                                <slot v-else-if="!option.create && $slots.optionItem" name="optionItem" v-bind="optionItemProps(option, index, rowStyle)" />
                                <SelectOption v-else v-bind="optionRowProps(option, index, rowStyle)" @mouseenter="foundation.handleOptionMouseEnter(index)" @select="(_, event) => handleSelect(option, index, event)">
                                    <template v-if="option.create">
                                        <span :class="`${prefix}-create-tips`">{{ locale.locale.createText }}</span
                                        >{{ option.data.value }}
                                    </template>
                                    <component :is="option.slot" v-else-if="option.slot" />
                                    <template v-else>{{ option.data.label }}</template>
                                </SelectOption>
                            </template>
                        </template>
                    </VirtualList>
                    <template v-for="run in optionRuns" v-else :key="run.group?.key ?? `.${run.first}`">
                        <component :is="hasTitle(run.group) ? 'div' : SlotFragment" v-bind="groupWrapperAttrs(run.group, run.first)">
                            <SelectOptGroup v-if="hasTitle(run.group)" v-bind="run.group.attrs" :id="groupTitleId(run.group, run.first)">
                                <template v-if="run.group.labelSlot" #label>
                                    <component :is="run.group.labelSlot" />
                                </template>
                            </SelectOptGroup>
                            <template v-for="{ option, index } in run.rows" :key="rowKey(option)">
                                <div v-if="option.create && $slots.createItem" :id="optionId(index)" aria-selected="false" role="option" @click="handleSelect(option, index, $event)">
                                    <slot name="createItem" v-bind="createItemProps(option, index)" />
                                </div>
                                <slot v-else-if="!option.create && $slots.optionItem" name="optionItem" v-bind="optionItemProps(option, index)" />
                                <SelectOption v-else v-bind="optionRowProps(option, index)" @mouseenter="foundation.handleOptionMouseEnter(index)" @select="(_, event) => handleSelect(option, index, event)">
                                    <template v-if="option.create">
                                        <span :class="`${prefix}-create-tips`">{{ locale.locale.createText }}</span
                                        >{{ option.data.value }}
                                    </template>
                                    <component :is="option.slot" v-else-if="option.slot" />
                                    <template v-else>{{ option.data.label }}</template>
                                </SelectOption>
                            </template>
                        </component>
                    </template>
                    <div v-if="$slots.innerBottomSlot" :class="`${prefix}-option-list-inner-bottom-slot`" @mouseenter="foundation.handleSlotMouseEnter">
                        <slot name="innerBottomSlot" />
                    </div>
                </div>
                <div v-if="$slots.outerBottomSlot" :class="`${prefix}-option-list-outer-bottom-slot`" @mouseenter="foundation.handleSlotMouseEnter">
                    <slot name="outerBottomSlot" />
                </div>
            </div>
        </template>
    </Popover>
</template>
