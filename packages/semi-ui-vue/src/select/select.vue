<script setup lang="ts" generic="T = BasicSelectValue, Multiple extends boolean | undefined = undefined">
    import { computed, isRef, mergeProps, onDeactivated, onMounted, shallowRef, useAttrs, useId, useTemplateRef, watch, type ShallowRef, type StyleValue } from 'vue';
    import { isEqual, isEqualWith, omit } from 'es-toolkit';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/select/constants';
    import SelectFoundation, { type SelectAdapter, type SelectBaseProps, type SelectBaseState } from '@fibrae/semi-foundation/select/foundation';
    import { getOptionRuns, type BasicOptionProps } from '@fibrae/semi-foundation/select/option-foundation';
    import { cssClasses as tagCssClasses } from '@fibrae/semi-foundation/tag/constants';
    import { isTextEditor, joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import { centerInScroller, toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/select/select.scss';
    import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-vue';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import SlotFragment from '../_base/slot-fragment';
    import slotKind from '../_base/slot-kind';
    import { hasSlotContent } from '../_base/slot-nodes';
    import useClickOutside from '../_base/use-click-outside';
    import useFoundation from '../_base/use-foundation';
    import useSlotVersion from '../_base/use-slot-version';
    import VirtualList from '../_base/virtual-list.vue';
    import useConfig from '../config-provider/use-config';
    import Input, { type InputHandle } from '../input';
    import useLocale from '../locale/use-locale';
    import OverflowList from '../overflow-list';
    import Popover from '../popover';
    import Space from '../space';
    import Spin from '../spin';
    import Tag, { TagGroup, type TagCloseEvent } from '../tag';
    import { useNestedPopups } from '../tooltip/context';
    import { TypographyText } from '../typography';
    import type { BasicSelectValue, SelectChangeValue, SelectCreateItemSlotProps, SelectEmits, SelectHandle, SelectOptionItemSlotProps, SelectOptionProps, SelectProps, SelectSelectedItemSlotProps, SelectSlots, SelectTriggerSlotProps } from './interface';
    import SelectOptGroup from './option-group.vue';
    import SelectOption from './option.vue';
    import { readOptions, type GroupRecord, type OptionRecord } from './utils';

    interface SelectState extends SelectBaseState {
        isFocusInContainer: boolean;
        overflowItemCount: number;
    }

    type FoundationProps = SelectBaseProps & { preventScroll?: boolean };
    type Foundation = SelectFoundation<FoundationProps, SelectState, Event>;
    type Adapter = SelectAdapter<FoundationProps, SelectState, Event>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<SelectProps<T, Multiple> & /* @vue-ignore */ ElementProps<'div', keyof SelectProps<T, Multiple> | EmitHandlers<SelectEmits<T, Multiple>>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('Select', 'defaultValue'),
        // a default other than undefined would break the inference of Multiple, so the global config cannot set it
        multiple: undefined,
        optionList: semiGlobalDefault('Select', 'optionList'),
        filter: undefined,
        remote: () => semiDefault('Select', 'remote', false),
        allowCreate: () => semiDefault('Select', 'allowCreate', false),
        autoClearSearchValue: () => semiDefault('Select', 'autoClearSearchValue', true),
        autofocus: () => semiDefault('Select', 'autofocus', false),
        defaultOpen: () => semiDefault('Select', 'defaultOpen', false),
        clickToHide: () => semiDefault('Select', 'clickToHide', false),
        defaultActiveFirstOption: () => semiDefault('Select', 'defaultActiveFirstOption', true),
        changeWithObject: () => semiDefault('Select', 'changeWithObject', false),
        max: semiGlobalDefault('Select', 'max'),
        maxTagCount: semiGlobalDefault('Select', 'maxTagCount'),
        maxHeight: () => semiDefault('Select', 'maxHeight', numbers.LIST_HEIGHT),
        showRestTagsPopover: () => semiDefault('Select', 'showRestTagsPopover', false),
        restTagsPopoverProps: semiGlobalDefault('Select', 'restTagsPopoverProps'),
        expandRestTagsOnClick: () => semiDefault('Select', 'expandRestTagsOnClick', false),
        ellipsisTrigger: () => semiDefault('Select', 'ellipsisTrigger', false),
        size: semiGlobalDefault('Select', 'size'),
        disabled: () => semiDefault('Select', 'disabled', false),
        borderless: () => semiDefault('Select', 'borderless', false),
        validateStatus: semiGlobalDefault('Select', 'validateStatus'),
        placeholder: semiGlobalDefault('Select', 'placeholder'),
        searchPlaceholder: semiGlobalDefault('Select', 'searchPlaceholder'),
        searchPosition: () => semiDefault('Select', 'searchPosition', 'trigger'),
        loading: () => semiDefault('Select', 'loading', false),
        showArrow: () => semiDefault('Select', 'showArrow', true),
        showClear: () => semiDefault('Select', 'showClear', false),
        // no global default: a global id would repeat on every instance
        insetLabelId: undefined,
        inputProps: semiGlobalDefault('Select', 'inputProps'),
        dropdownClassName: semiGlobalDefault('Select', 'dropdownClassName'),
        dropdownStyle: semiGlobalDefault('Select', 'dropdownStyle'),
        dropdownMatchSelectWidth: () => semiDefault('Select', 'dropdownMatchSelectWidth', true),
        position: semiGlobalDefault('Select', 'position'),
        spacing: semiGlobalDefault('Select', 'spacing'),
        motion: () => semiDefault('Select', 'motion', true),
        autoAdjustOverflow: () => semiDefault('Select', 'autoAdjustOverflow', true),
        stopPropagation: () => semiDefault('Select', 'stopPropagation', true),
        virtualize: semiGlobalDefault('Select', 'virtualize'),
        preventScroll: semiGlobalDefault('Select', 'preventScroll'),
        // A global id would repeat on every instance, and aria-controls and aria-activedescendant would point elsewhere.
        id: undefined,
    });

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
    const optionContainer = useTemplateRef('optionContainer');
    const virtualList = useTemplateRef('virtualList');
    const generatedId = useId();
    const listboxId = useId();
    const selectionTextId = useId();
    const comboboxKeys = new Set(['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const slotVersion = useSlotVersion(slots);

    const prefix = cssClasses.PREFIX;
    const filter = computed(() => props.filter ?? readSemiDefault(semi, 'Select', 'filter', false));
    const filterable = computed(() => Boolean(filter.value));

    const collectedOptions = computed(() => {
        void slotVersion.value;
        return readOptions(slots.default?.() ?? [], props.optionList);
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, SelectState>(
        SelectFoundation,
        props as Readonly<Partial<FoundationProps>>,
        // Known limitation: this reads the default slot during setup, where options passed with h() or JSX make Vue
        // warn once in development (template slots never do). SSR runs no mounted hook, so the first render needs the
        // selection resolved here. Upgrade when options can be collected without calling the slot outside render.
        (view) => ({
            isOpen: false,
            isFocus: false,
            inputValue: '',
            showInput: false,
            isFocusInContainer: false,
            isFullTags: false,
            ...SelectFoundation.getInitialState(view, collectedOptions.value as BasicOptionProps[]),
        }),
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleInputShow: (showInput, cb) => base.setState({ showInput }, cb),
            focusInput: () => triggerInput.value?.focus({ preventScroll: props.preventScroll }),
            focusDropdownInput: () => dropdownInput.value?.focus({ preventScroll: props.preventScroll }),
            notifyMaxLimit: (option) => emit('exceed', plain(option)),
            getMaxLimit: () => props.max as number,
            notifyDeselect: (value, option) => emit('deselect', value as string | number, plain(option)),
            getOptionsFromChildren: () => collectedOptions.value as BasicOptionProps[],
            updateOptions: (options) => base.setState({ options }),
            openMenu: (cb) => base.setState({ isOpen: true }, cb),
            closeMenu: () => base.setState({ isOpen: false }),
            updateSelection: (selections) => base.setState({ selections }),
            getSelections: () => new Map(base.getState('selections')),
            notifyChange: (value) => {
                const object = (option: string | BasicOptionProps) => (typeof option === 'object' ? plain(option) : option);
                const payload = (props.changeWithObject ? (Array.isArray(value) ? value.map(object) : value && object(value)) : value) as SelectChangeValue<T, Multiple>;
                emit('update:modelValue', payload);
                emit('change', payload);
            },
            notifySelect: (value, option) => emit('select', value as string | number, plain(option)),
            notifyDropdownVisibleChange: (visible) => emit('dropdownVisibleChange', visible),
            notifySearch: (inputValue, event) => emit('search', inputValue, event),
            notifyCreate: (option) => emit('create', plain(option)),
            // mouseenter and mouseleave reach the root as native listeners through the attrs
            notifyMouseEnter: () => undefined,
            notifyMouseLeave: () => undefined,
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event),
            notifyClear: () => emit('clear'),
            notifyListScroll: (event) => emit('listScroll', event),
            updateFocusState: (isFocus) => base.setState({ isFocus }),
            updateOverflowItemCount: (overflowItemCount) => base.setState({ overflowItemCount }),
            focusTrigger: () => trigger.value?.focus({ preventScroll: props.preventScroll }),
            getOptionList: () => optionContainer.value,
            setIsFocusInContainer: (isFocusInContainer) => base.setState({ isFocusInContainer }),
            getIsFocusInContainer: () => base.getState('isFocusInContainer'),
            updateScrollTop: (index) => {
                if (index !== undefined && virtualList.value) {
                    // only the rows in view are rendered, so the target may not be in the DOM yet
                    virtualList.value.scrollToItem(index);
                    return;
                }
                const custom = slots.optionItem ? '-custom' : '';
                // document.getElementById misses a list rendered inside a ShadowRoot
                const destNode = optionContainer.value?.querySelector<HTMLElement>(index === undefined ? `.${prefix}-option${custom}-selected` : `#${CSS.escape(optionId(index))}`);
                // an option in a group is one level deeper
                const listbox = destNode?.closest<HTMLElement>('[role="listbox"]');
                if (destNode && listbox) {
                    centerInScroller(destNode, listbox);
                }
            },
        }),
        {
            props: {
                value: () => props.modelValue,
                onChangeWithObject: () => props.changeWithObject,
                autoFocus: () => props.autofocus,
                filter: () => filter.value as SelectBaseProps['filter'],
            },
        }
    );

    const position = computed(() => props.position ?? (config.value.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const searchInTrigger = computed(() => props.searchPosition === strings.SEARCH_POSITION_TRIGGER);

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

    const plain = (option: BasicOptionProps | SelectOptionProps) => {
        const { _slot, ...rest } = option;
        return rest as SelectOptionProps;
    };

    const selectId = () => props.id || generatedId;

    const optionId = (index: number) => `${selectId()}-option-${index}`;

    const visibleOptions = computed(() => (state.value.options as OptionRecord[]).filter((option) => option._show));
    const selectedItems = computed((): OptionRecord[] => [...state.value.selections.values()]);

    const activeDescendant = computed(() => {
        const { isOpen, focusIndex } = state.value;
        // while loading the list shows a spinner instead of the options
        return isOpen && !props.loading && focusIndex !== -1 && focusIndex < visibleOptions.value.length ? optionId(focusIndex) : undefined;
    });

    const clearable = computed(() => props.showClear && Boolean(state.value.selections.size || state.value.inputValue) && !props.disabled);
    const optionRuns = computed(() => getOptionRuns(visibleOptions.value));

    const inputId = () => (props.inputProps?.id as string | undefined) ?? `${selectId()}-input`;

    const isComboboxKey = (key: string) => comboboxKeys.has(key);

    // ARIA 1.2: while the search input is in the trigger it is the combobox, otherwise the trigger is a select-only
    // combobox. The single-select input mounts only while searching, so the closed trigger exposes the selected text
    const inputIsCombobox = () => filterable.value && searchInTrigger.value && !slots.trigger && (Boolean(props.multiple) || state.value.showInput);

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
        ...(inputIsCombobox() ? {} : { ...comboboxAttrs(), 'aria-disabled': props.disabled }),
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
                      [`${prefix}-disabled`]: props.disabled,
                      [`${prefix}-single`]: !props.multiple,
                      [`${prefix}-multiple`]: props.multiple,
                      [`${prefix}-filterable`]: filterable.value,
                      [`${prefix}-small`]: props.size === 'small',
                      [`${prefix}-large`]: props.size === 'large',
                      [`${prefix}-error`]: props.validateStatus === 'error',
                      [`${prefix}-warning`]: props.validateStatus === 'warning',
                      [`${prefix}-no-arrow`]: !props.showArrow,
                      [`${prefix}-with-prefix`]: Boolean(k.prefix || k.insetLabel),
                      [`${prefix}-with-suffix`]: Boolean(k.suffix),
                  },
              ];

    const handleInputChange = (value: string, event?: Event) => foundation.handleInputChange(value, event);

    const handleClear = (event?: MouseEvent) => {
        event?.stopImmediatePropagation();
        foundation.handleClearClick(event);
    };

    // The search input is inside the trigger, so its keys bubble here. The Select handles a key before the listeners
    const handleKeyDown = (event: KeyboardEvent) => {
        foundation.handleKeyDown(event);
        emit('keydown', event);
    };

    const isTriggerInput = (target: EventTarget | null) => Boolean(target) && target === triggerInput.value?.input;

    const handleFocusIn = (event: FocusEvent) => {
        if (isTriggerInput(event.target)) {
            foundation.handleInputFocus(event);
        } else {
            foundation.handleTriggerFocus(event);
        }
    };

    const handleFocusOut = (event: FocusEvent) => {
        if (isTriggerInput(event.target)) {
            foundation.handleInputBlur();
        }
        if (!(event.currentTarget as Node).contains(event.relatedTarget as Node | null)) {
            foundation.handleTriggerBlur(event);
        }
    };

    // A press would move the focus to the popup container, where the keys never reach the combobox; it stays on the
    // trigger or the dropdown search input. A text field in a slot still takes the focus.
    const keepFocusOnPress = (event: MouseEvent) => {
        if (!isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    const scrollToSelection = () => {
        if (props.virtualize && state.value.focusIndex !== -1) {
            virtualList.value?.scrollToItem(state.value.focusIndex, 'center');
        } else if (props.virtualize) {
            const indexes = selectedItems.value.map((option) => option._scrollIndex).filter((index): index is number => typeof index === 'number' && index >= 0);
            if (indexes.length) {
                virtualList.value?.scrollToItem(Math.min(...indexes), 'center');
            }
        } else {
            foundation.updateScrollTop();
        }
    };

    const triggerInputBindings = () => ({
        ...comboboxAttrs(),
        id: inputId(),
        'aria-autocomplete': 'list' as const,
        // the single-select text sits beside the input, which is empty until the user types, so the combobox has no
        // value of its own; the text is exposed as the description
        'aria-describedby': joinIds(attrs['aria-describedby'], props.multiple || state.value.inputValue ? undefined : selectionTextId),
        size: props.size,
        modelValue: state.value.inputValue,
        disabled: props.disabled,
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
                disabled: props.disabled,
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
    const handleSelect = (option: OptionRecord, index: number, event: MouseEvent) => foundation.onSelect(option as BasicOptionProps, index, event);

    const optionRowProps = (option: OptionRecord, index: number, rowStyle?: StyleValue) => {
        // a `key` field would become the vnode key; the events read the option from state, which keeps it
        const { key: _key, style, ...rest } = option;
        return {
            showTick: true,
            ...rest,
            style: [rowStyle, style] as StyleValue,
            focused: index === state.value.focusIndex,
            inputValue: state.value.inputValue,
            selected: Boolean(option._selected),
            semiOptionId: optionId(index),
        };
    };

    const optionItemProps = (option: OptionRecord, index: number, rowStyle?: StyleValue): SelectOptionItemSlotProps => {
        const { key: _key, class: className, style, label, value, disabled, showTick: _showTick, ...rest } = option;
        const selected = Boolean(option._selected);
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
        inputValue: String(option.value),
        focus: index === state.value.focusIndex,
        style: rowStyle,
    });

    // _scrollIndex, not the visible index: a row that filtering moves up keeps its node
    const rowKey = (option: OptionRecord) => String(option.key ?? option._keyInJsx ?? `${option.label}${option.value}${option._scrollIndex}`);

    const hasTitle = (group?: GroupRecord): group is GroupRecord => Boolean(group && (group._labelSlot || group.label || group.label === 0));

    const groupTitleId = (group: GroupRecord, first: number) => (group.id as string | undefined) ?? `${selectId()}-group-${first}`;

    const groupWrapperAttrs = (group: GroupRecord | undefined, first: number) => (hasTitle(group) ? { 'aria-labelledby': groupTitleId(group, first), class: `${prefix}-group-wrapper`, role: 'group' } : {});

    const groupTitleProps = (group: GroupRecord) => {
        const { key: _key, _labelSlot, ...rest } = group;
        return rest;
    };

    const emptyHidden = () => Boolean(slots.emptyContent) && !hasSlotContent(slots.emptyContent);

    const singleItem = () => selectedItems.value[0] as OptionRecord | undefined;

    const hasSingleContent = (option?: OptionRecord): option is OptionRecord => Boolean(option && (slots.selectedItem || option._slot || option.label || option.label === 0));

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

    const removeTag = (option: OptionRecord, event?: TagCloseEvent) => {
        // keeps the Tag from hiding itself in controlled mode
        event?.preventDefault();
        // as with the clear button, a tag going while it has the focus hands the focus to the combobox
        const tag = event?.currentTarget instanceof Element ? event.currentTarget.closest(`.${tagCssClasses.PREFIX}`) : null;
        if (tag && tag === FocusTrapHandle.getActiveElement(tag)) {
            foundation.focus(undefined, false);
        }
        foundation.removeTag(option as BasicOptionProps);
    };

    const selectedItemProps = (option: OptionRecord, index: number): SelectSelectedItemSlotProps => ({
        option,
        index,
        disabled: Boolean(option.disabled || props.disabled),
        onClose: (event) => removeTag(option, event),
    });

    // the same size mapping as TreeSelect, Cascader and TagInput: a default-size trigger holds large tags
    const tagSize = () => (props.size === 'small' ? 'small' : 'large');

    const collapsedTags = () => {
        const count = props.maxTagCount ?? 0;
        return selectedItems.value.length > count ? selectedItems.value.slice(0, count) : selectedItems.value;
    };

    // OverflowList shows the first overflowed item collapsed, so every other one is hidden; [] means all fit
    const handleOverflow = (items: OptionRecord[]) => {
        const { size } = state.value.selections;
        const hiddenByMaxTagCount = size - Math.min(size, props.maxTagCount ?? 0);
        const count = hiddenByMaxTagCount + Math.max(items.length - 1, 0);
        if (state.value.overflowItemCount !== count) {
            foundation.updateOverflowItemCount(size, count);
        }
    };

    const groupTags = () => {
        const count = props.maxTagCount ?? 0;
        const full = props.showRestTagsPopover && state.value.isFullTags;
        return full ? selectedItems.value : selectedItems.value.slice(0, count);
    };

    const groupMaxTagCount = () => (selectedItems.value.length > (props.maxTagCount ?? 0) ? props.maxTagCount : undefined);

    const groupRestCount = () => (props.showRestTagsPopover && state.value.isFullTags ? undefined : selectedItems.value.length - (props.maxTagCount ?? 0));

    const restPopoverBindings = () => ({
        autoAdjustOverflow: true,
        position: 'top' as const,
        showArrow: true,
        trigger: 'hover' as const,
        ...props.restTagsPopoverProps,
    });

    const triggerSlotProps = (): SelectTriggerSlotProps => ({
        value: selectedItems.value.map(plain),
        inputValue: state.value.inputValue,
        placeholder: props.placeholder,
        disabled: props.disabled,
        componentProps: { ...props },
        onSearch: (value) => handleInputChange(value),
        // bound to a click inside the trigger: stopped so the trigger does not reopen the list
        onClear: (event) => handleClear(event),
        onRemove: (option) => foundation.removeTag(option as BasicOptionProps),
    });

    onMounted(() => {
        // Registered on mount, so its first run reads the options cached by setup instead of calling the slot in a
        // hook. An option list change also re-resolves the selection, which keeps labels of earlier options
        watch(
            () => [collectedOptions.value, props.modelValue] as const,
            ([options, value], [prevOptions, prevValue]) => {
                const changed = { optionsChanged: !sameOptions(prevOptions, options), valueChanged: !isEqual(prevValue, value) };
                foundation.handleInputsChange(changed, value as Parameters<typeof foundation.handleInputsChange>[1]);
            },
            { flush: 'post' }
        );
    });

    useClickOutside(
        [trigger, optionContainer],
        (event) => foundation.handleClickOutside(event),
        () => state.value.isOpen,
        useNestedPopups()
    );

    // The clear button goes with the value. A removed node fires no blur, so a focused button would drop the focus to
    // the body while the Select stays focused; this pre-flush watcher runs before the patch removes the button.
    watch(clearable, (allowed) => {
        if (!allowed && clearButton.value && clearButton.value === FocusTrapHandle.getActiveElement(clearButton.value)) {
            (triggerInput.value ?? trigger.value)?.focus({ preventScroll: props.preventScroll });
        }
    });

    // The dropdown follows the foundation state, which a cached KeepAlive subtree would keep open
    onDeactivated(() => foundation.close({ returnFocus: false }));

    defineExpose<SelectHandle>({
        close: () => foundation.close(),
        open: () => foundation.open(),
        focus: () => foundation.focus(),
        clearInput: () => foundation.clearInput(),
        selectAll: () => foundation.selectAll(),
        deselectAll: () => foundation.clearSelected(),
        search: (value, event) => foundation.handleInputChange(value, event),
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
        @afterClose="foundation.handlePopoverClose()"
        @open="scrollToSelection"
    >
        <div :id="selectId()" ref="trigger" v-bind="rootAttrs()" :class="rootClass(kinds())" :tabindex="props.disabled || inputIsCombobox() ? -1 : 0" @click="foundation.handleClick($event)" @focusin="handleFocusIn" @focusout="handleFocusOut" @keydown="handleKeyDown">
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
                            <template v-if="!props.maxTagCount || (props.expandRestTagsOnClick && state.isOpen)">
                                <template v-for="(item, index) in selectedItems" :key="item.value">
                                    <slot v-if="$slots.tag" name="tag" v-bind="selectedItemProps(item, index)" />
                                    <Tag v-else :closable="!selectedItemProps(item, index).disabled" color="white" :size="tagSize()" :style="{ maxWidth: '100%' }" @close="removeTag(item, $event)">
                                        <slot v-if="$slots.selectedItem" name="selectedItem" v-bind="selectedItemProps(item, index)" />
                                        <component :is="item._slot" v-else-if="item._slot" />
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
                                            <component :is="item._slot" v-else-if="item._slot" />
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
                                                    <component :is="item._slot" v-if="item._slot" />
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
                                                    <component :is="item._slot" v-else-if="item._slot" />
                                                    <template v-else>{{ item.label }}</template>
                                                </Tag>
                                            </template>
                                        </Space>
                                    </template>
                                </component>
                            </div>
                            <TagGroup
                                v-else
                                :maxTagCount="groupMaxTagCount()"
                                :popoverProps="props.showRestTagsPopover ? props.restTagsPopoverProps : undefined"
                                :restCount="groupRestCount()"
                                :showPopover="props.showRestTagsPopover"
                                :size="tagSize()"
                                :tagList="groupTags().map((item) => ({ tagKey: item.value }))"
                                @plusNMouseEnter="foundation.updateIsFullTags()"
                            >
                                <template #tag="{ index }">
                                    <template v-for="item in [selectedItems[index]]" :key="item.value">
                                        <slot v-if="$slots.tag" name="tag" v-bind="selectedItemProps(item, index)" />
                                        <Tag v-else :closable="!selectedItemProps(item, index).disabled" color="white" :size="tagSize()" :tabindex="-1" @close="removeTag(item, $event)">
                                            <slot v-if="$slots.selectedItem" name="selectedItem" v-bind="selectedItemProps(item, index)" />
                                            <component :is="item._slot" v-else-if="item._slot" />
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
                                    <slot v-if="$slots.selectedItem" :disabled="props.disabled" :index="0" name="selectedItem" :onClose="() => handleClear()" :option="option" />
                                    <component :is="option._slot" v-else-if="option._slot" />
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
            <button v-if="!$slots.trigger && clearable" ref="clearButton" :aria-label="locale.locale.clear" :class="`${prefix}-clear`" type="button" @click="handleClear" @keydown.enter.space.stop>
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
                @keydown="foundation.handleContainerKeyDown($event)"
                @mousedown="keepFocusOnPress"
            >
                <div v-if="$slots.outerTopSlot" :class="`${prefix}-option-list-outer-top-slot`" @mouseenter="foundation.handleSlotMouseEnter()">
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
                <div :id="listboxId" v-bind="nameAttrs()" :aria-multiselectable="props.multiple" :class="[`${prefix}-option-list`, { [`${prefix}-option-list-chosen`]: state.selections.size }]" role="listbox" :style="{ maxHeight: toCssLength(props.maxHeight) }" @scroll.capture="foundation.handleListScroll($event)">
                    <div v-if="$slots.innerTopSlot" :class="`${prefix}-option-list-inner-top-slot`" @mouseenter="foundation.handleSlotMouseEnter()">
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
                                <div v-if="option._inputCreateOnly && $slots.createItem" :id="optionId(index)" aria-selected="false" role="option" @click="handleSelect(option, index, $event)">
                                    <slot name="createItem" v-bind="createItemProps(option, index, rowStyle)" />
                                </div>
                                <slot v-else-if="!option._inputCreateOnly && $slots.optionItem" name="optionItem" v-bind="optionItemProps(option, index, rowStyle)" />
                                <SelectOption v-else v-bind="optionRowProps(option, index, rowStyle)" @mouseenter="foundation.handleOptionMouseEnter(index)" @select="(_, event) => handleSelect(option, index, event)">
                                    <template v-if="option._inputCreateOnly">
                                        <span :class="`${prefix}-create-tips`">{{ locale.locale.createText }}</span
                                        >{{ option.value }}
                                    </template>
                                    <component :is="option._slot" v-else-if="option._slot" />
                                    <template v-else>{{ option.label }}</template>
                                </SelectOption>
                            </template>
                        </template>
                    </VirtualList>
                    <template v-for="run in optionRuns" v-else :key="run.group?.key ?? `.${run.first}`">
                        <component :is="hasTitle(run.group) ? 'div' : SlotFragment" v-bind="groupWrapperAttrs(run.group, run.first)">
                            <SelectOptGroup v-if="hasTitle(run.group)" v-bind="groupTitleProps(run.group)" :id="groupTitleId(run.group, run.first)">
                                <template v-if="run.group._labelSlot" #label>
                                    <component :is="run.group._labelSlot" />
                                </template>
                            </SelectOptGroup>
                            <template v-for="{ option, index } in run.rows" :key="rowKey(option)">
                                <div v-if="option._inputCreateOnly && $slots.createItem" :id="optionId(index)" aria-selected="false" role="option" @click="handleSelect(option, index, $event)">
                                    <slot name="createItem" v-bind="createItemProps(option, index)" />
                                </div>
                                <slot v-else-if="!option._inputCreateOnly && $slots.optionItem" name="optionItem" v-bind="optionItemProps(option, index)" />
                                <SelectOption v-else v-bind="optionRowProps(option, index)" @mouseenter="foundation.handleOptionMouseEnter(index)" @select="(_, event) => handleSelect(option, index, event)">
                                    <template v-if="option._inputCreateOnly">
                                        <span :class="`${prefix}-create-tips`">{{ locale.locale.createText }}</span
                                        >{{ option.value }}
                                    </template>
                                    <component :is="option._slot" v-else-if="option._slot" />
                                    <template v-else>{{ option.label }}</template>
                                </SelectOption>
                            </template>
                        </component>
                    </template>
                    <div v-if="$slots.innerBottomSlot" :class="`${prefix}-option-list-inner-bottom-slot`" @mouseenter="foundation.handleSlotMouseEnter()">
                        <slot name="innerBottomSlot" />
                    </div>
                </div>
                <div v-if="$slots.outerBottomSlot" :class="`${prefix}-option-list-outer-bottom-slot`" @mouseenter="foundation.handleSlotMouseEnter()">
                    <slot name="outerBottomSlot" />
                </div>
            </div>
        </template>
    </Popover>
</template>
