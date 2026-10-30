<script setup lang="ts" generic="Multiple extends boolean | undefined = undefined">
    import { computed, nextTick, onDeactivated, shallowRef, useAttrs, useId, useTemplateRef, watch } from 'vue';
    import { isEqual } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/cascader/constants';
    import CascaderFoundation, { type BasicCascaderInnerData, type BasicCascaderProps, type BasicValue, type CascaderAdapter } from '@fibrae/semi-foundation/cascader/foundation';
    import { calcMergeType } from '@fibrae/semi-foundation/cascader/util';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { isInnerControlKey, isTextEditor, joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/cascader/cascader.scss';
    import { IconChevronDown, IconClear } from '@fibrae/semi-icons-vue';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import slotKind from '../_base/slot-kind';
    import slotNodes, { hasSlotContent, type KeyedNode } from '../_base/slot-nodes';
    import useClickOutside from '../_base/use-click-outside';
    import useFocusHandover from '../_base/use-focus-handover';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import Input, { type InputHandle } from '../input';
    import { provideInputGroupContext } from '../input/context';
    import useGroupLooks from '../input/use-group-looks';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import Tag, { type TagCloseEvent } from '../tag';
    import TagInput, { type TagInputHandle } from '../tag-input';
    import { useNestedPopups } from '../tooltip/context';
    import type { CascaderChangeValue, CascaderData, CascaderEmits, CascaderEntity, CascaderHandle, CascaderProps, CascaderScrollPanelProps, CascaderSimpleValue, CascaderSlots, CascaderTagSlotProps, CascaderTriggerSlotProps } from './interface';
    import Item from './item.vue';

    // the click or key event that opens, selects or closes; the foundation passes it on to focus and blur
    type FoundationEvent = MouseEvent | KeyboardEvent;
    type Foundation = CascaderFoundation<FoundationEvent, Event>;
    type Adapter = CascaderAdapter<FoundationEvent, Event>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<CascaderProps<Multiple> & /* @vue-ignore */ ElementProps<'div', keyof CascaderProps<Multiple> | EmitHandlers<CascaderEmits<Multiple>>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('Cascader', 'defaultValue'),
        // a default other than undefined would break the inference of Multiple, so the global config cannot set it
        multiple: undefined,
        treeData: () => semiDefault('Cascader', 'treeData', []),
        keyMaps: semiGlobalDefault('Cascader', 'keyMaps'),
        changeOnSelect: () => semiDefault('Cascader', 'changeOnSelect', false),
        autoMergeValue: () => semiDefault('Cascader', 'autoMergeValue', true),
        leafOnly: () => semiDefault('Cascader', 'leafOnly', false),
        checkRelation: () => semiDefault('Cascader', 'checkRelation', strings.RELATED),
        disableStrictly: () => semiDefault('Cascader', 'disableStrictly', false),
        max: semiGlobalDefault('Cascader', 'max'),
        maxTagCount: semiGlobalDefault('Cascader', 'maxTagCount'),
        showRestTagsPopover: () => semiDefault('Cascader', 'showRestTagsPopover', false),
        restTagsPopoverProps: semiGlobalDefault('Cascader', 'restTagsPopoverProps'),
        enableLeafClick: () => semiDefault('Cascader', 'enableLeafClick', false),
        clickToSelect: () => semiDefault('Cascader', 'clickToSelect', false),
        showNext: () => semiDefault('Cascader', 'showNext', strings.SHOW_NEXT_BY_CLICK),
        loadData: undefined,
        filterTreeNode: undefined,
        filterSorter: undefined,
        filterLeafOnly: () => semiDefault('Cascader', 'filterLeafOnly', true),
        treeNodeFilterProp: () => semiDefault('Cascader', 'treeNodeFilterProp', 'label'),
        remote: () => semiDefault('Cascader', 'remote', false),
        displayProp: () => semiDefault('Cascader', 'displayProp', 'label'),
        separator: () => semiDefault('Cascader', 'separator', ' / '),
        changeWithObject: () => semiDefault('Cascader', 'changeWithObject', false),
        placeholder: semiGlobalDefault('Cascader', 'placeholder'),
        searchPlaceholder: semiGlobalDefault('Cascader', 'searchPlaceholder'),
        searchPosition: () => semiDefault('Cascader', 'searchPosition', strings.SEARCH_POSITION_TRIGGER),
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        disabled: undefined,
        size: undefined,
        borderless: () => semiDefault('Cascader', 'borderless', false),
        validateStatus: semiGlobalDefault('Cascader', 'validateStatus'),
        // A global id would repeat on every instance.
        insetLabelId: undefined,
        showClear: () => semiDefault('Cascader', 'showClear', false),
        defaultOpen: () => semiDefault('Cascader', 'defaultOpen', false),
        motion: () => semiDefault('Cascader', 'motion', true),
        autoAdjustOverflow: semiGlobalDefault('Cascader', 'autoAdjustOverflow'),
        position: semiGlobalDefault('Cascader', 'position'),
        stopPropagation: () => semiDefault('Cascader', 'stopPropagation', true),
        dropdownClassName: semiGlobalDefault('Cascader', 'dropdownClassName'),
        dropdownStyle: semiGlobalDefault('Cascader', 'dropdownStyle'),
        preventScroll: semiGlobalDefault('Cascader', 'preventScroll'),
        virtualizeInSearch: semiGlobalDefault('Cascader', 'virtualizeInSearch'),
    });

    const emit = defineEmits<CascaderEmits<Multiple>>();
    const slots = defineSlots<CascaderSlots<Multiple>>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('Cascader');

    const trigger = useTemplateRef('trigger');
    const content = useTemplateRef('content');

    // refs inside the v-for are arrays
    const searchInputs = useTemplateRef<InputHandle[]>('searchInput');
    const tagInputs = useTemplateRef<TagInputHandle[]>('tagInput');
    const item = useTemplateRef('item');
    const popupId = useId();
    const selectionTextId = useId();

    // The foundation caches keyEntities by treeData reference, so in-place changes need a new one; an equal array
    // keeps the old one. Known limit: the deep watcher walks the whole tree; recommend shallowRef/markRaw for large trees.
    const treeData = shallowRef(props.treeData);
    const comboboxKeys = new Set(['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    // A key is reported once: in the capture phase if the options may take it, in the bubble phase for inner controls
    const reported = new WeakSet<KeyboardEvent>();

    const looks = useGroupLooks('Cascader', props, { size: 'default', disabled: false });

    const prefix = cssClasses.PREFIX;

    // The generic Multiple has no runtime type, so a valueless `multiple` attribute arrives as ''
    const multiple = computed(() => (props.multiple as unknown) === '' || Boolean(props.multiple));
    const loadData = computed(() => props.loadData ?? readSemiDefault(semi, 'Cascader', 'loadData'));
    const filterTreeNode = computed(() => props.filterTreeNode ?? readSemiDefault(semi, 'Cascader', 'filterTreeNode', false));
    const filterSorter = computed(() => props.filterSorter ?? readSemiDefault(semi, 'Cascader', 'filterSorter'));
    const mergeType = computed(() => calcMergeType(props.autoMergeValue, props.leafOnly));
    const triggerSearch = computed(() => Boolean(filterTreeNode.value) && props.searchPosition === strings.SEARCH_POSITION_TRIGGER);
    const position = computed(() => props.position ?? (config.value.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const inputPlaceholder = computed(() => props.searchPlaceholder || props.placeholder);

    // the Input and TagInput inside are parts of this control, not members of the group
    provideInputGroupContext(undefined);

    const combobox = () => searchInputs.value?.[0] ?? tagInputs.value?.[0];

    // ids are IDREFs for aria-activedescendant, so a key with spaces is encoded
    const optionId = (key: string) => `${popupId}-option-${encodeURIComponent(key)}`;

    const isComboboxKey = (key: string) => comboboxKeys.has(key);

    // A rendered inset label names the combobox and the popup, so it needs an id even when the caller gives none
    const insetLabelShown = () => !slots.trigger && !slotKind(slots.prefix) && Boolean(slotKind(slots.insetLabel));

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? `${popupId}-inset-label` : undefined);

    // The popup binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const nameAttrs = () => comboboxName(attrs['aria-labelledby'] as string | undefined, attrs['aria-label'] as string | undefined, insetLabelShown() ? prefixId() : undefined, locale.value.locale.label);

    const kinds = () => ({
        prefix: slotKind(slots.prefix),
        insetLabel: slotKind(slots.insetLabel),
        suffix: slotKind(slots.suffix),
    });

    const tagSize = () => (looks.size === 'default' ? 'large' : looks.size);

    const isShownTag = (index: number) => typeof props.maxTagCount !== 'number' || props.maxTagCount >= index + 1;

    const restPopoverBindings = () => ({
        autoAdjustOverflow: true,
        position: 'top' as const,
        showArrow: true,
        trigger: 'hover' as const,
        ...props.restTagsPopoverProps,
    });

    const report = (event: KeyboardEvent) => {
        if (!reported.has(event)) {
            reported.add(event);
            emit('keydown', event);
        }
    };

    // a press would focus the popup, which is hidden on close and drops the focus to body; the focus stays on the
    // trigger. A text field in a slot still takes the focus.
    const keepFocusOnPress = (event: MouseEvent) => {
        if (!isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    watch(
        () => props.treeData,
        (next, previous) => {
            if (next === previous || !isEqual(next, treeData.value)) {
                treeData.value = [...(next ?? [])];
            }
        },
        { deep: true }
    );

    const { foundation, state } = useFoundation<Foundation, Adapter, BasicCascaderProps, BasicCascaderInnerData>(
        CascaderFoundation,
        props,
        (view) => CascaderFoundation.getInitialState(view),
        (base) => ({
            focusCombobox: () => {
                const search = searchInputs.value?.[0];
                const tags = tagInputs.value?.[0];
                if (search) {
                    search.focus({ preventScroll: props.preventScroll });
                } else if (tags) {
                    // TagInput reads preventScroll from its own prop
                    tags.focus();
                } else {
                    trigger.value?.focus({ preventScroll: props.preventScroll });
                }
            },
            blurCombobox: () => {
                combobox()?.blur();
                trigger.value?.blur();
            },
            updateStates: (states) => base.setState(states as BasicCascaderInnerData),
            notifyChange: (value) => {
                emit('update:modelValue', value as CascaderChangeValue<Multiple>);
                emit('change', value as CascaderChangeValue<Multiple>);
            },
            notifySelect: (selected) => emit('select', selected as CascaderEmits<Multiple>['select'][0]),
            notifyOnSearch: (input) => emit('search', input),
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            notifyDropdownVisibleChange: (visible) => emit('dropdownVisibleChange', visible),
            notifyLoadData: (selectedOpt, callback, onReject) => {
                const load = loadData.value;
                if (!load) {
                    return;
                }
                const loading = load(selectedOpt as CascaderData[]);
                loading.then(undefined, onReject);
                // The rejection stays unhandled here so it reaches the caller; nextTick runs the callback after the
                // treeData update, otherwise loadingKeys clears first and activeKeys shifts.
                void loading.then(() => nextTick(() => callback()));
            },
            notifyOnLoad: (newLoadedKeys, data) => emit('load', newLoadedKeys, data as CascaderData),
            notifyListScroll: (event, panel) => emit('listScroll', event, panel as CascaderScrollPanelProps),
            notifyOnExceed: (data) => emit('exceed', data as CascaderEntity[]),
            notifyClear: () => emit('clear'),
            toggleInputShow: (showInput, callback) => {
                const focusInTrigger = trigger.value?.contains(FocusTrapHandle.getActiveElement(trigger.value));
                base.setState({ showInput }, () => {
                    // unmounting the focused search input would drop focus to the body
                    if (!showInput && focusInTrigger) {
                        trigger.value?.focus({ preventScroll: true });
                    }
                    callback();
                });
            },
            scrollToOption: (key, index) => {
                if (!item.value?.scrollToItem(index)) {
                    content.value?.querySelector(`#${CSS.escape(optionId(key))}`)?.scrollIntoView({ block: 'nearest' });
                }
            },
        }),
        {
            props: {
                size: () => looks.size,
                disabled: () => looks.disabled,
                value: () => props.modelValue as BasicCascaderProps['value'],
                onChangeWithObject: () => props.changeWithObject,
                multiple: () => multiple.value,
                treeData: () => treeData.value,
                loadData: () => loadData.value as BasicCascaderProps['loadData'],
                filterTreeNode: () => filterTreeNode.value as BasicCascaderProps['filterTreeNode'],
                filterSorter: () => filterSorter.value as BasicCascaderProps['filterSorter'],
            },
        }
    );

    // controlled values and the multiple-mode tree are derived here, so they reach the DOM in the render that receives them
    const foundationProps = computed(() => foundation.getProps());
    const view = computed(() => (multiple.value ? { ...state.value, ...CascaderFoundation.deriveMultipleState(foundationProps.value, state.value) } : state.value));
    const renderData = computed(() => CascaderFoundation.getRenderData(foundationProps.value, view.value));
    const isEmpty = computed(() => !renderData.value.length);
    const realKeys = computed(() => (mergeType.value === strings.NONE_MERGE_TYPE || props.checkRelation === strings.UN_RELATED ? view.value.checkedKeys : view.value.resolvedCheckedKeys));
    const keyboardKey = computed(() => (view.value.isOpen ? CascaderFoundation.getKeyboardKey(view.value) : null));

    // multiple mode keeps no selectedKeys beyond the one getInitialState writes; its value also holds controlled paths without tags
    const clearable = computed(() => props.showClear && Boolean(view.value.inputValue || (multiple.value ? CascaderFoundation.hasMultipleValue(foundationProps.value, view.value) : view.value.selectedKeys.size)) && !looks.disabled);

    // ARIA 1.2: the search input is the combobox while mounted, otherwise the trigger is a select-only combobox
    const inputIsCombobox = () => triggerSearch.value && !slots.trigger && (multiple.value || view.value.showInput);

    const comboboxAttrs = () => ({
        ...splitControlAttrs(attrs, isComboboxKey).control,
        role: 'combobox',
        'aria-activedescendant': keyboardKey.value === null ? undefined : optionId(keyboardKey.value),
        'aria-controls': popupId,
        'aria-expanded': view.value.isOpen,
        'aria-haspopup': (filterTreeNode.value && view.value.isSearching ? 'listbox' : 'tree') as 'listbox' | 'tree',
        ...nameAttrs(),
    });

    const rootAttrs = () => ({
        ...splitControlAttrs(attrs, isComboboxKey).root,
        ...(inputIsCombobox() ? {} : { ...comboboxAttrs(), 'aria-disabled': looks.disabled }),
    });

    const rootClass = (k: ReturnType<typeof kinds>) =>
        slots.trigger
            ? []
            : [
                  prefix,
                  {
                      [`${prefix}-borderless`]: props.borderless,
                      [`${prefix}-focus`]: view.value.isOpen,
                      [`${prefix}-disabled`]: looks.disabled,
                      [`${prefix}-single`]: true,
                      [`${prefix}-filterable`]: Boolean(filterTreeNode.value),
                      [`${prefix}-error`]: props.validateStatus === 'error',
                      [`${prefix}-warning`]: props.validateStatus === 'warning',
                      [`${prefix}-small`]: looks.size === 'small',
                      [`${prefix}-large`]: looks.size === 'large',
                      [`${prefix}-with-prefix`]: Boolean(k.prefix || k.insetLabel),
                      [`${prefix}-with-suffix`]: Boolean(k.suffix),
                  },
              ];

    const displayContent = (): { shown: boolean; nodes?: KeyedNode[]; text?: string } => {
        const [key] = view.value.selectedKeys;
        if (key === undefined) {
            return { shown: false };
        }
        const { keyEntities } = view.value;
        const labels: Array<string | number> = CascaderFoundation.getItemPropPath(key, props.displayProp, keyEntities);
        if (slots.display) {
            const path: CascaderSimpleValue[] = CascaderFoundation.getItemPropPath(key, [], keyEntities);
            const nodes = slots.display({ labels, path });
            return { shown: hasSlotContent(() => nodes), nodes: slotNodes(nodes) };
        }
        return { shown: true, text: labels.join(props.separator) };
    };

    const singleTextClass = (shown: boolean) => ({
        [`${prefix}-selection-placeholder`]: !shown,
        [`${prefix}-selection-text-hide`]: Boolean(view.value.showInput && view.value.inputValue),
        [`${prefix}-selection-text-inactive`]: Boolean(view.value.showInput && !view.value.inputValue),
    });

    const searchInputBindings = () => ({
        ...comboboxAttrs(),
        'aria-autocomplete': 'list' as const,
        // the selected text sits beside the input, which is empty until the user types, so the combobox has no value of
        // its own; the text is exposed as the description
        'aria-describedby': joinIds(attrs['aria-describedby'], view.value.inputValue ? undefined : selectionTextId),
        // the trigger draws its own clear button: a global Input default must not add one
        showClear: false,
    });

    const entityOf = (key: string) => view.value.keyEntities[key] as CascaderEntity | undefined;

    const isTagDisabled = (key: string) => Boolean(looks.disabled || entityOf(key)?.data.disabled || (props.disableStrictly && view.value.disabledKeys?.has(key)));

    const removeTag = (key: string, event?: TagCloseEvent) => {
        // when the value does not change, the tag must not hide itself
        event?.preventDefault();
        foundation.handleTagRemoveByKey(key);
    };

    const tagSlotProps = (key: string, index: number): CascaderTagSlotProps => ({
        entity: entityOf(key) as CascaderEntity,
        index,
        disabled: isTagDisabled(key),
        onClose: (event) => removeTag(key, event),
    });

    const triggerSlotProps = (): CascaderTriggerSlotProps<Multiple> => {
        const { keyEntities, checkedKeys, resolvedCheckedKeys, selectedKeys } = view.value;
        // the trigger gets positions; mergeType decides which checked set they come from, whatever checkRelation is
        const keys = mergeType.value === strings.NONE_MERGE_TYPE ? checkedKeys : resolvedCheckedKeys;
        const value = multiple.value ? new Set([...keys].map((key) => keyEntities[key]?.pos)) : keyEntities[[...selectedKeys][0]]?.pos;
        return {
            value: value as CascaderTriggerSlotProps<Multiple>['value'],
            inputValue: view.value.inputValue,
            placeholder: inputPlaceholder.value,
            disabled: looks.disabled,
            componentProps: { ...props, ...looks },
            onSearch: foundation.handleInputChange,
            onClear: (event) => handleClear(event),
            onRemove: foundation.handleTagRemoveInTrigger,
        };
    };

    const handleClear = (event?: MouseEvent) => {
        event?.stopPropagation();
        foundation.handleClear();
    };

    const handleClearClick = (event: MouseEvent) => {
        handleClear(event);
        if (inputIsCombobox()) {
            foundation.focus();
        } else {
            trigger.value?.focus();
        }
    };

    const handleOptionKeyDown = (event: KeyboardEvent) =>
        foundation.handleOptionKeyDown(event, {
            editing: isTextEditor(event.target),
            rtl: config.value.direction === 'rtl',
        });

    const handleKeyDownCapture = (event: KeyboardEvent) => {
        if (isInnerControlKey(event)) {
            return;
        }
        report(event);
        // an Enter that picks the option must not reach TagInput, which would add the typed text as a tag
        if (handleOptionKeyDown(event)) {
            event.stopPropagation();
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        report(event);
        if (!isInnerControlKey(event)) {
            foundation.handleSelectionKeyDown(event);
        }
        foundation.handleKeyDown(event);
    };

    // Focus enters the dropdown through a field in a slot, and the dropdown is not a DOM descendant of the trigger, so
    // containment is checked against its popup layer
    const handleFocusOut = (event: FocusEvent) => {
        const target = event.relatedTarget;
        const inside = target instanceof Node && (Boolean(trigger.value?.contains(target)) || Boolean(content.value?.closest('[popover]')?.contains(target)));
        if (!inside) {
            foundation.handleFocusLeave(event);
        }
    };

    const handleContentKeyDown = (event: KeyboardEvent) => {
        handleOptionKeyDown(event);
        foundation.handleKeyDown(event);
    };

    // One watcher for the tuple, so options and value changing together only re-collect the options. Known limit: modelValue
    // is not watched deeply, so a controlled array changed in place is missed; upgrade when needed.
    watch([() => treeData.value, () => props.keyMaps, () => props.modelValue], ([data, keyMaps, value], [previousData, previousKeyMaps, previousValue]) => {
        const optionsChanged = data !== previousData || !isEqual(keyMaps, previousKeyMaps);
        // by content: an inline value is a new array on every parent render, and each change resets the search;
        // undefined, a value going back to uncontrolled, clears the selection
        foundation.handleInputsChange({ optionsChanged, valueChanged: !isEqual(value, previousValue) }, value as BasicValue);
    });

    const nestedPopups = useNestedPopups();

    useClickOutside(
        [trigger, content],
        (event) => {
            if (content.value) {
                foundation.handleClickOutside(event);
            }
        },
        () => state.value.isOpen,
        nestedPopups
    );

    // The dropdown follows the foundation state, which a cached KeepAlive subtree would keep open
    onDeactivated(() => {
        if (state.value.isOpen) {
            foundation.deactivate();
        }
    });

    // the owner may clear the value while the clear button holds focus; the combobox takes it back
    const clearHandover = useFocusHandover(() => (inputIsCombobox() ? trigger.value?.querySelector('input') : trigger.value));

    defineExpose<CascaderHandle>({
        open: foundation.open,
        close: foundation.close,
        focus: foundation.focus,
        blur: foundation.blur,
        search: foundation.handleInputChange,
    });
</script>

<template>
    <!-- the tree inside is the combobox's popup; an empty list has no columns to size it, so it takes the trigger's width -->
    <Popover
        :autoAdjustOverflow="props.autoAdjustOverflow"
        :motion="props.motion"
        :position="position"
        role="presentation"
        :stopPropagation="props.stopPropagation"
        :style="isEmpty ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined"
        trigger="custom"
        :visible="view.isOpen"
        @afterClose="foundation.endSearching"
        @open="foundation.handlePopoverOpen"
    >
        <!-- the combobox is the Tab stop -->
        <div ref="trigger" v-bind="rootAttrs()" :class="rootClass(kinds())" :tabindex="looks.disabled || inputIsCombobox() ? -1 : 0" @click="foundation.handleClick" @focusin="foundation.handleFocusEnter" @focusout="handleFocusOut" @keydown="handleKeyDown" @keydown.capture="handleKeyDownCapture">
            <slot v-if="$slots.trigger" name="trigger" v-bind="triggerSlotProps()" />
            <template v-else>
                <template v-for="(k, i) in [kinds()]" :key="i">
                    <div
                        v-if="k.prefix || k.insetLabel"
                        :id="prefixId()"
                        :class="[`${prefix}-prefix`, { [`${prefix}-inset-label`]: Boolean(k.insetLabel), [`${prefix}-prefix-text`]: (k.prefix ?? k.insetLabel) === 'text', [`${prefix}-prefix-icon`]: (k.prefix ?? k.insetLabel) === 'icon' }]"
                        x-semi-prop="prefix,insetLabel"
                    >
                        <slot v-if="k.prefix" name="prefix" />
                        <slot v-else name="insetLabel" />
                    </div>
                    <div :class="[`${prefix}-selection`, { [`${prefix}-selection-multiple`]: multiple && view.checkedKeys.size > 0 }]">
                        <div v-if="triggerSearch && !multiple" :class="[`${prefix}-search-wrapper`, { [`${prefix}-search-wrapper-${looks.size}`]: looks.size !== 'default' }]">
                            <template v-for="(display, d) in [displayContent()]" :key="d">
                                <span :id="selectionTextId" :class="singleTextClass(display.shown)">
                                    <template v-if="!display.shown">{{ inputPlaceholder }}</template>
                                    <template v-else-if="display.nodes">
                                        <component :is="node" v-for="[node, key] in display.nodes" :key="key" />
                                    </template>
                                    <template v-else>{{ display.text }}</template>
                                </span>
                            </template>
                            <Input v-if="view.showInput" ref="searchInput" v-bind="searchInputBindings()" :class="`${prefix}-input`" :disabled="looks.disabled" :modelValue="view.inputValue" :size="looks.size" @change="foundation.handleInputChange" />
                        </div>
                        <TagInput
                            v-else-if="triggerSearch"
                            ref="tagInput"
                            v-bind="comboboxAttrs()"
                            aria-autocomplete="list"
                            :class="`${prefix}-tagInput-wrapper`"
                            :disabled="looks.disabled"
                            :expandRestTagsOnClick="false"
                            :inputValue="view.inputValue"
                            :maxTagCount="props.maxTagCount"
                            :modelValue="[...realKeys]"
                            :placeholder="inputPlaceholder"
                            :preventScroll="props.preventScroll"
                            :restTagsPopoverProps="props.restTagsPopoverProps"
                            :showRestTagsPopover="props.showRestTagsPopover"
                            :size="looks.size"
                            @inputChange="foundation.handleInputChange"
                            @remove="foundation.handleTagRemoveByKey"
                        >
                            <template #tag="{ value: key, index }">
                                <template v-if="entityOf(key)">
                                    <slot v-if="$slots.tag" name="tag" v-bind="tagSlotProps(key, index)" />
                                    <Tag v-else :class="[`${prefix}-selection-tag`, { [`${prefix}-selection-tag-disabled`]: isTagDisabled(key) }]" :closable="!isTagDisabled(key)" color="white" :size="tagSize()" :tagKey="key" @close="removeTag(key, $event)">{{ entityOf(key)?.data[props.displayProp] }}</Tag>
                                </template>
                            </template>
                        </TagInput>
                        <template v-else-if="multiple">
                            <span v-if="view.checkedKeys.size === 0" :class="`${prefix}-selection-placeholder`">{{ props.placeholder }}</span>
                            <template v-for="(key, index) in [...realKeys]" v-else :key="`tag-${key}-${index}`">
                                <template v-if="isShownTag(index) && entityOf(key)">
                                    <slot v-if="$slots.tag" name="tag" v-bind="tagSlotProps(key, index)" />
                                    <Tag v-else :class="[`${prefix}-selection-tag`, { [`${prefix}-selection-tag-disabled`]: isTagDisabled(key) }]" :closable="!isTagDisabled(key)" color="white" :size="tagSize()" :tagKey="key" @close="removeTag(key, $event)">{{ entityOf(key)?.data[props.displayProp] }}</Tag>
                                </template>
                            </template>
                            <component :is="props.showRestTagsPopover ? Popover : SlotFragment" v-if="view.checkedKeys.size > 0 && !isShownTag(realKeys.size - 1)" v-bind="props.showRestTagsPopover ? restPopoverBindings() : {}">
                                <span :class="[`${prefix}-selection-n`, { [`${prefix}-selection-n-disabled`]: looks.disabled }]">+{{ realKeys.size - (props.maxTagCount ?? 0) }}</span>
                                <template #content>
                                    <template v-for="(key, index) in [...realKeys]" :key="`tag-${key}-${index}`">
                                        <template v-if="!isShownTag(index) && entityOf(key)">
                                            <slot v-if="$slots.tag" name="tag" v-bind="tagSlotProps(key, index)" />
                                            <Tag v-else :class="[`${prefix}-selection-tag`, { [`${prefix}-selection-tag-disabled`]: isTagDisabled(key) }]" :closable="!isTagDisabled(key)" color="white" :size="tagSize()" :tagKey="key" @close="removeTag(key, $event)">{{ entityOf(key)?.data[props.displayProp] }}</Tag>
                                        </template>
                                    </template>
                                </template>
                            </component>
                        </template>
                        <template v-for="(display, d) in [displayContent()]" v-else :key="d">
                            <span :class="singleTextClass(display.shown)">
                                <template v-if="!display.shown">{{ props.placeholder }}</template>
                                <template v-else-if="display.nodes">
                                    <component :is="node" v-for="[node, key] in display.nodes" :key="key" />
                                </template>
                                <template v-else>{{ display.text }}</template>
                            </span>
                        </template>
                    </div>
                    <div v-if="k.suffix" :class="[`${prefix}-suffix`, { [`${prefix}-suffix-text`]: k.suffix === 'text', [`${prefix}-suffix-icon`]: k.suffix === 'icon' }]" x-semi-prop="suffix">
                        <slot name="suffix" />
                    </div>
                </template>
                <!-- the stylesheet shows it in the arrow's place on hover, while open and while focus is inside;
                     .stop keeps its Enter and Space from the owner's keydown listeners, which listen to the combobox -->
                <button v-if="clearable" :ref="clearHandover" :aria-label="locale.locale.clear" :class="`${prefix}-clearbtn`" type="button" @click="handleClearClick" @keydown.enter.space.stop>
                    <slot name="clearIcon">
                        <IconClear />
                    </slot>
                </button>
                <div v-if="!$slots.arrowIcon || hasSlotContent($slots.arrowIcon)" :class="`${prefix}-arrow`" x-semi-prop="arrowIcon">
                    <slot name="arrowIcon">
                        <IconChevronDown />
                    </slot>
                </div>
            </template>
        </div>
        <template #content>
            <div ref="content" :class="[props.dropdownClassName, `${prefix}-popover`]" :style="props.dropdownStyle" @focusin="foundation.handleFocusEnter" @focusout="handleFocusOut" @keydown="handleContentKeyDown" @mousedown="keepFocusOnPress">
                <slot name="topSlot" />
                <Item
                    :id="popupId"
                    ref="item"
                    :activeKeys="view.activeKeys"
                    :ariaLabel="nameAttrs()['aria-label']"
                    :ariaLabelledby="nameAttrs()['aria-labelledby']"
                    :checkedKeys="view.checkedKeys"
                    :data="renderData"
                    :halfCheckedKeys="view.halfCheckedKeys"
                    :hasLoadData="Boolean(loadData)"
                    :keyboardKey="keyboardKey"
                    :keyword="view.inputValue"
                    :loadedKeys="view.loadedKeys"
                    :loadingKeys="view.loadingKeys"
                    :multiple="multiple"
                    :optionId="optionId"
                    :searchable="Boolean(filterTreeNode) && view.isSearching"
                    :selectedKeys="view.selectedKeys"
                    :separator="props.separator"
                    :showNext="props.showNext"
                    :virtualize="props.virtualizeInSearch"
                    @itemCheckboxClick="foundation.onItemCheckboxClick"
                    @itemClick="foundation.handleItemClick"
                    @itemHover="foundation.handleItemHover"
                    @listScroll="foundation.handleListScroll"
                >
                    <template v-if="$slots.label" #label="labelProps">
                        <slot name="label" v-bind="labelProps" />
                    </template>
                    <template v-if="$slots.filterItem" #filterItem="filterProps">
                        <slot name="filterItem" v-bind="filterProps" />
                    </template>
                    <template v-if="$slots.expandIcon" #expandIcon>
                        <slot name="expandIcon" />
                    </template>
                    <template v-if="$slots.emptyContent" #emptyContent>
                        <slot name="emptyContent" />
                    </template>
                </Item>
                <slot name="bottomSlot" />
            </div>
        </template>
    </Popover>
</template>
