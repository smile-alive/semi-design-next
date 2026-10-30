<script lang="ts">
    import { untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/select/constants';
    import SelectFoundation, { type SelectAdapter, type SelectBaseProps, type SelectBaseState } from '@fibrae/semi-foundation/select/foundation';
    import { type BasicOptionProps, type OptionRecord as BaseOptionRecord, getOptionRuns, toOptionRecord } from '@fibrae/semi-foundation/select/option-foundation';
    import { cssClasses as tagCssClasses } from '@fibrae/semi-foundation/tag/constants';
    import { isTextEditor, joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import { centerInScroller, toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
    import '@fibrae/semi-foundation/select/select.scss';
    import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-svelte';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import { type SlotKind, trackSlotKind } from '../_base/slot-kind.js';
    import useClickOutside from '../_base/use-click-outside.svelte.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import VirtualList from '../_base/virtual-list.svelte';
    import { useConfig } from '../config-provider/index.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { Input } from '../input/index.js';
    import { useLocale } from '../locale/index.js';
    import { OverflowList } from '../overflow-list/index.js';
    import { Popover } from '../popover/index.js';
    import { Space } from '../space/index.js';
    import { Spin } from '../spin/index.js';
    import { Tag, type TagCloseEvent, TagGroup } from '../tag/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import { TypographyText } from '../typography/index.js';
    import type { SelectCreateItemSnippetProps, SelectOptionGroup, SelectOptionItemSnippetProps, SelectOptionProps, SelectProps, SelectSelectedItemSnippetProps, SelectTriggerSnippetProps, SelectValue } from './interface.js';
    import Option from './option.svelte';

    interface SelectState extends SelectBaseState {
        isFocusInContainer: boolean;
        overflowItemCount: number;
    }

    type OptionRecord = BaseOptionRecord<SelectOptionProps, SelectOptionGroup>;
    type FoundationProps = SelectBaseProps & { preventScroll?: boolean };
    type Foundation = SelectFoundation<FoundationProps, SelectState, Event>;
    type Adapter = SelectAdapter<FoundationProps, SelectState, Event>;

    const defaults = useDefaultProps('Select');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        multiple = defaults('multiple', false),
        optionList = defaults('optionList'),
        filter = defaults('filter', false),
        remote = defaults('remote', false),
        allowCreate = defaults('allowCreate', false),
        autoClearSearchValue = defaults('autoClearSearchValue', true),
        autofocus = defaults('autofocus', false),
        defaultOpen = defaults('defaultOpen', false),
        clickToHide = defaults('clickToHide', false),
        defaultActiveFirstOption = defaults('defaultActiveFirstOption', true),
        onChangeWithObject = defaults('onChangeWithObject', false),
        max = defaults('max'),
        maxTagCount = defaults('maxTagCount'),
        maxHeight = defaults('maxHeight', numbers.LIST_HEIGHT),
        showRestTagsPopover = defaults('showRestTagsPopover', false),
        restTagsPopoverProps = defaults('restTagsPopoverProps'),
        expandRestTagsOnClick = defaults('expandRestTagsOnClick', false),
        ellipsisTrigger = defaults('ellipsisTrigger', false),
        size: sizeProp,
        disabled: disabledProp,
        borderless = defaults('borderless', false),
        validateStatus = defaults('validateStatus'),
        placeholder = defaults('placeholder'),
        searchPlaceholder = defaults('searchPlaceholder'),
        searchPosition = defaults('searchPosition', 'trigger'),
        loading = defaults('loading', false),
        showArrow = defaults('showArrow', true),
        showClear = defaults('showClear', false),
        // no global default: a global id would repeat on every instance
        insetLabelId,
        inputProps = defaults('inputProps'),
        dropdownClassName = defaults('dropdownClassName'),
        dropdownStyle = defaults('dropdownStyle'),
        dropdownMatchSelectWidth = defaults('dropdownMatchSelectWidth', true),
        position = defaults('position'),
        spacing = defaults('spacing'),
        motion = defaults('motion', true),
        autoAdjustOverflow = defaults('autoAdjustOverflow', true),
        stopPropagation = defaults('stopPropagation', true),
        virtualize = defaults('virtualize'),
        preventScroll = defaults('preventScroll'),
        // a global id would repeat on every instance, and aria-controls and aria-activedescendant would point elsewhere
        id,
        onChange,
        onDropdownVisibleChange,
        onSearch,
        onSelect,
        onDeselect,
        onExceed,
        onCreate,
        onClear,
        onFocus,
        onBlur,
        onListScroll,
        prefix,
        suffix,
        insetLabel,
        arrowIcon,
        clearIcon,
        emptyContent,
        outerTopSlot,
        innerTopSlot,
        outerBottomSlot,
        innerBottomSlot,
        optionItem,
        optionLabel,
        groupLabel,
        createItem,
        selectedItem,
        tag,
        trigger,
        ...rest
    }: SelectProps = $props();

    const config = useConfig();
    const locale = useLocale('Select');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let popover = $state<Popover>();
    let triggerInput = $state<Input>();
    let dropdownInput = $state<Input>();
    let clearButton = $state<HTMLButtonElement>();
    let optionContainer = $state<HTMLDivElement>();
    let virtualList = $state<VirtualList>();
    let prefixKind = $state<SlotKind>();
    let suffixKind = $state<SlotKind>();
    let previous: { options: OptionRecord[]; value: SelectValue } | undefined;
    const comboboxKeys = new Set(['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const nestedPopups = useNestedPopups();

    // an InputGroup supplies size and disabled when the control is given none; the controls inside this one must not read it again
    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled') ?? false);
    const size = $derived(sizeProp ?? group?.size ?? defaults('size', 'default'));
    const cls = cssClasses.PREFIX;

    // the foundation filters by the group label and the list renders runs of one group through the record's group
    const collectedOptions: OptionRecord[] = $derived((optionList ?? []).map((item, index) => toOptionRecord(item, index, item.group)));

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: FoundationProps = {
        get allowCreate() {
            return allowCreate;
        },
        get autoClearSearchValue() {
            return autoClearSearchValue;
        },
        get autoFocus() {
            return autofocus;
        },
        get clickToHide() {
            return clickToHide;
        },
        get defaultActiveFirstOption() {
            return defaultActiveFirstOption;
        },
        get defaultOpen() {
            return defaultOpen;
        },
        get disabled() {
            return disabled;
        },
        get ellipsisTrigger() {
            return ellipsisTrigger;
        },
        get filter() {
            return filter as SelectBaseProps['filter'];
        },
        get loading() {
            return loading;
        },
        get maxTagCount() {
            return maxTagCount;
        },
        get multiple() {
            return multiple;
        },
        get onChangeWithObject() {
            return onChangeWithObject;
        },
        get preventScroll() {
            return preventScroll;
        },
        get remote() {
            return remote;
        },
        get searchPosition() {
            return searchPosition;
        },
        get value() {
            return value;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, FoundationProps, SelectState>(
        SelectFoundation,
        foundationProps,
        (view) => ({
            isOpen: false,
            isFocus: false,
            inputValue: '',
            showInput: false,
            isFocusInContainer: false,
            isFullTags: false,
            ...SelectFoundation.getInitialState(view, collectedOptions as BaseOptionRecord[]),
        }),
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleInputShow: (showInput, cb) => base.setState({ showInput }, cb),
            focusInput: () => triggerInput?.focus({ preventScroll }),
            focusDropdownInput: () => dropdownInput?.focus({ preventScroll }),
            notifyMaxLimit: (option) => onExceed?.(option as SelectOptionProps),
            getMaxLimit: () => max as number,
            notifyDeselect: (deselected, option) => onDeselect?.(deselected as string | number, option as SelectOptionProps),
            getOptionsFromChildren: () => collectedOptions as BaseOptionRecord[],
            updateOptions: (options) => base.setState({ options }),
            openMenu: (cb) => base.setState({ isOpen: true }, cb),
            closeMenu: () => base.setState({ isOpen: false }),
            updateSelection: (selections) => base.setState({ selections }),
            getSelections: () => new Map(base.getState('selections')),
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next as SelectValue;
                onChange?.(next as SelectValue);
            },
            notifySelect: (selected, option) => onSelect?.(selected as string | number, option as SelectOptionProps),
            notifyDropdownVisibleChange: (visible) => onDropdownVisibleChange?.(visible),
            notifySearch: (inputValue, event) => onSearch?.(inputValue, event),
            notifyCreate: (option) => onCreate?.(option as SelectOptionProps),
            // mouseenter and mouseleave reach the root as native listeners through the rest props
            notifyMouseEnter: () => undefined,
            notifyMouseLeave: () => undefined,
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            notifyClear: () => onClear?.(),
            notifyListScroll: (event) => onListScroll?.(event),
            updateFocusState: (isFocus) => base.setState({ isFocus }),
            updateOverflowItemCount: (overflowItemCount) => base.setState({ overflowItemCount }),
            focusTrigger: () => root?.focus({ preventScroll }),
            getOptionList: () => optionContainer,
            setIsFocusInContainer: (isFocusInContainer) => base.setState({ isFocusInContainer }),
            getIsFocusInContainer: () => base.getState('isFocusInContainer'),
            updateScrollTop: (index) => {
                if (index !== undefined && virtualList) {
                    // only the rows in view are rendered, so the target may not be in the DOM yet
                    virtualList.scrollToItem(index);
                    return;
                }
                const custom = optionItem ? '-custom' : '';
                // document.getElementById misses a list rendered inside a ShadowRoot
                const destNode = optionContainer?.querySelector<HTMLElement>(index === undefined ? `.${cls}-option${custom}-selected` : `#${CSS.escape(optionId(index))}`);
                const listbox = destNode?.closest<HTMLElement>('[role="listbox"]');
                if (destNode && listbox) {
                    centerInScroller(destNode, listbox);
                }
            },
        })
    );

    const selectId = $derived(id || uid);
    const listboxId = $derived(`${uid}-listbox`);
    const selectionTextId = $derived(`${uid}-selection`);
    const filterable = $derived(Boolean(filter));
    const searchInTrigger = $derived(searchPosition === strings.SEARCH_POSITION_TRIGGER);
    const resolvedPosition = $derived(position ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const visibleOptions = $derived((states().options as OptionRecord[]).filter((option) => option.show));
    const selectedItems = $derived([...states().selections.values()] as SelectOptionProps[]);
    const optionRuns = $derived(getOptionRuns(visibleOptions));

    // while loading the list shows a spinner instead of the options
    const activeDescendant = $derived.by(() => {
        const { isOpen, focusIndex } = states();
        return isOpen && !loading && focusIndex !== -1 && focusIndex < visibleOptions.length ? optionId(focusIndex) : undefined;
    });

    const clearable = $derived(showClear && Boolean(states().selections.size || states().inputValue) && !disabled);
    const inputId = $derived((inputProps?.id as string | undefined) ?? `${selectId}-input`);

    // ARIA 1.2: while the search input is in the trigger it is the combobox, otherwise the trigger is a select-only
    // combobox. The single-select input mounts only while searching, so the closed trigger exposes the selected text
    const inputIsCombobox = $derived(filterable && searchInTrigger && !trigger && (multiple || states().showInput));

    // A rendered inset label names the combobox and the listbox, so it needs an id even when the caller gives none
    const insetLabelShown = $derived(!trigger && !prefix && Boolean(insetLabel));
    const prefixId = $derived(insetLabelId ?? (insetLabelShown ? `${selectId}-inset-label` : undefined));

    // The listbox binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const nameAttrs = $derived(comboboxName(rest['aria-labelledby'] ?? undefined, rest['aria-label'] ?? undefined, insetLabelShown ? prefixId : undefined, locale().locale.label));
    const attrs = $derived(splitControlAttrs(rest, (key) => comboboxKeys.has(key)));

    const comboboxAttrs = $derived({
        ...attrs.control,
        role: 'combobox',
        'aria-activedescendant': activeDescendant,
        'aria-controls': listboxId,
        'aria-expanded': states().isOpen,
        'aria-haspopup': 'listbox' as const,
        ...nameAttrs,
    });

    const rootAttrs = $derived(inputIsCombobox ? attrs.root : { ...attrs.root, ...comboboxAttrs, 'aria-disabled': disabled });
    const emptyHidden = $derived(emptyContent === null);
    const singleItem = $derived(selectedItems[0] as SelectOptionProps | undefined);
    const hasSingleContent = $derived(Boolean(singleItem && (selectedItem || singleItem.label || singleItem.label === 0)));

    // the same size mapping as TreeSelect, Cascader and TagInput: a default-size trigger holds large tags
    const tagSize = $derived(size === 'small' ? 'small' : 'large');
    const tagLimit = $derived(maxTagCount ?? 0);
    const collapsedTags = $derived(selectedItems.length > tagLimit ? selectedItems.slice(0, tagLimit) : selectedItems);
    const groupTags = $derived(showRestTagsPopover && states().isFullTags ? selectedItems : selectedItems.slice(0, tagLimit));
    const groupMaxTagCount = $derived(selectedItems.length > tagLimit ? maxTagCount : undefined);
    const groupRestCount = $derived(showRestTagsPopover && states().isFullTags ? undefined : selectedItems.length - tagLimit);
    const restPopoverProps = $derived({ autoAdjustOverflow: true, position: 'top' as const, showArrow: true, trigger: 'hover' as const, ...restTagsPopoverProps });

    const triggerSnippetProps: SelectTriggerSnippetProps = $derived({
        value: selectedItems,
        inputValue: states().inputValue,
        placeholder,
        disabled,
        onSearch: (keyword) => handleInputChange(keyword),
        // bound to a click inside the trigger: stopped so the trigger does not reopen the list
        onClear: (event) => handleClear(event),
        onRemove: (option) => foundation.removeTag(option as BasicOptionProps),
    });

    const trackPrefix = trackSlotKind((kind) => (prefixKind = kind));
    const trackSuffix = trackSlotKind((kind) => (suffixKind = kind));

    setInputGroupContext(undefined);

    const optionId = (index: number) => {
        return `${selectId}-option-${index}`;
    };

    // the record's index, not the visible index: a row that filtering moves up keeps its node
    const rowKey = ({ data, childKey, index }: OptionRecord) => {
        return String(data.key ?? childKey ?? `${data.label}${data.value}${index}`);
    };

    // a group needs a title for its accessible name, so a group without a label renders its options bare
    const hasTitle = (group?: SelectOptionGroup): group is SelectOptionGroup => {
        return Boolean(group && (group.label || group.label === 0));
    };

    const runKey = ({ group, rows }: (typeof optionRuns)[number]) => {
        return `${group?.key ?? ''}:${rowKey(rows[0].option)}`;
    };

    const joinStyles = (...styles: (string | undefined)[]) => {
        return styles.filter(Boolean).join('; ') || undefined;
    };

    const handleInputChange = (keyword: string, event?: Event) => {
        foundation.handleInputChange(keyword, event);
    };

    const handleClear = (event?: MouseEvent) => {
        event?.stopImmediatePropagation();
        foundation.handleClearClick(event);
    };

    // the option as kept in state, the same object Enter selects
    const handleSelect = (option: OptionRecord, index: number, event: MouseEvent) => {
        foundation.onSelect(option as BaseOptionRecord, index, event);
    };

    const isTriggerInput = (target: EventTarget | null) => {
        return Boolean(target) && target === triggerInput?.getInput();
    };

    // The search input is inside the trigger, so its keys bubble here. The Select handles a key before the listener
    const handleKeyDown = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleKeyDown(event);
        rest.onkeydown?.(event);
    };

    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleClick(event);
        rest.onclick?.(event);
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        if (isTriggerInput(event.target)) {
            foundation.handleInputFocus(event);
        } else {
            foundation.handleTriggerFocus(event);
        }
        rest.onfocusin?.(event);
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        if (isTriggerInput(event.target)) {
            foundation.handleInputBlur();
        }
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
            foundation.handleTriggerBlur(event);
        }
        rest.onfocusout?.(event);
    };

    // A press would move the focus to the popup container, where the keys never reach the combobox; it stays on the
    // trigger or the dropdown search input. A text field in a snippet still takes the focus.
    const keepFocusOnPress = (event: MouseEvent) => {
        if (!isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    const stopOwnKeys = (event: KeyboardEvent) => {
        // the button's own Enter and Space must not reach the combobox's keydown handler
        if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation();
        }
    };

    const scrollToSelection = () => {
        if (virtualize && states().focusIndex !== -1) {
            virtualList?.scrollToItem(states().focusIndex, 'center');
        } else if (virtualize) {
            const first = states().options.find((option) => option.selected && option.index >= 0);
            if (first) {
                virtualList?.scrollToItem(first.index, 'center');
            }
        } else {
            foundation.updateScrollTop();
        }
    };

    const optionItemProps = (option: OptionRecord, index: number, rowStyle?: string): SelectOptionItemSnippetProps => {
        const { key: _key, class: className, style, label, value: optionValue, disabled: optionDisabled, showTick: _showTick, ...others } = option.data;
        const { selected } = option;
        return {
            ...others,
            id: optionId(index),
            disabled: optionDisabled,
            focused: index === states().focusIndex,
            selected,
            style: joinStyles(rowStyle, style),
            label,
            value: optionValue,
            inputValue: states().inputValue,
            onmouseenter: () => foundation.handleOptionMouseEnter(index),
            onclick: (event: MouseEvent) => {
                if (!optionDisabled) {
                    handleSelect(option, index, event);
                }
            },
            class: [className, `${cls}-option-custom`, { [`${cls}-option-custom-selected`]: selected }],
        };
    };

    const optionRowProps = (record: OptionRecord, index: number, rowStyle?: string) => {
        const option = record.data;
        return {
            id: optionId(index),
            class: option.class,
            dataAttrs: getDataAttr(option),
            disabled: option.disabled,
            focused: index === states().focusIndex,
            inputValue: states().inputValue,
            label: option.label,
            selected: record.selected,
            showTick: option.showTick ?? true,
            style: joinStyles(rowStyle, option.style),
            onMouseEnter: () => foundation.handleOptionMouseEnter(index),
            onSelect: (event: MouseEvent) => handleSelect(record, index, event),
        };
    };

    const createItemProps = (option: OptionRecord, index: number, rowStyle?: string): SelectCreateItemSnippetProps => {
        return { inputValue: String(option.data.value), focus: index === states().focusIndex, style: rowStyle };
    };

    const removeTag = (option: SelectOptionProps, event?: TagCloseEvent) => {
        // keeps the Tag from hiding itself in controlled mode
        event?.preventDefault();
        // as with the clear button, a tag going while it has the focus hands the focus to the combobox
        const target = event?.currentTarget instanceof Element ? event.currentTarget.closest(`.${tagCssClasses.PREFIX}`) : null;
        if (target && target === FocusTrapHandle.getActiveElement(target)) {
            foundation.focus(undefined, false);
        }
        foundation.removeTag(option as BasicOptionProps);
    };

    const selectedItemProps = (option: SelectOptionProps, index: number): SelectSelectedItemSnippetProps => {
        return { option, index, disabled: Boolean(option.disabled || disabled), onClose: (event) => removeTag(option, event) };
    };

    // OverflowList shows the first overflowed item collapsed, so every other one is hidden; [] means all fit
    const handleOverflow = (items: SelectOptionProps[]) => {
        const { size: count } = states().selections;
        const hidden = count - Math.min(count, tagLimit) + Math.max(items.length - 1, 0);
        if (states().overflowItemCount !== hidden) {
            foundation.updateOverflowItemCount(count, hidden);
        }
    };

    useClickOutside([() => root, () => optionContainer], foundation.handleClickOutside, () => states().isOpen, nestedPopups);

    // An option list or value change re-resolves the selection; the first run records the values the initial state read
    $effect(() => {
        const next = { options: collectedOptions, value };
        const before = previous;
        previous = next;
        if (before) {
            const changed = { optionsChanged: !isEqual(before.options, next.options), valueChanged: !isEqual(before.value, next.value) };
            untrack(() => foundation.handleInputsChange(changed, next.value as Parameters<typeof foundation.handleInputsChange>[1]));
        }
    });

    // The clear button goes with the value. A removed node fires no blur, so a focused button would drop the focus to
    // the body while the Select stays focused; this runs before the DOM update removes the button.
    $effect.pre(() => {
        if (!clearable && clearButton && clearButton === FocusTrapHandle.getActiveElement(clearButton)) {
            (triggerInput ?? root)?.focus({ preventScroll });
        }
    });

    export function close() {
        foundation.close();
    }

    export function open() {
        foundation.open();
    }

    /** Focuses the trigger, or the search input when filterable; the dropdown opens only when filterable */
    export function focus() {
        foundation.focus();
    }

    export function clearInput() {
        foundation.clearInput();
    }

    /** Selects every shown, enabled option (multiple only) */
    export function selectAll() {
        foundation.selectAll();
    }

    export function deselectAll() {
        foundation.clearSelected();
    }

    /** Searches as if `keyword` were typed into the search input */
    export function search(keyword: string, event?: Event) {
        foundation.handleInputChange(keyword, event);
    }

    /** Repositions the open dropdown at once; it already follows scrolling, resizing and trigger moves */
    export function rePosition() {
        popover?.rePosition();
    }
</script>

{#snippet searchIcon()}
    <IconSearch />
{/snippet}

{#snippet triggerSearch()}
    <Input
        bind:this={triggerInput}
        {...comboboxAttrs}
        aria-autocomplete="list"
        aria-describedby={joinIds(rest['aria-describedby'], multiple || states().inputValue ? undefined : selectionTextId)}
        {disabled}
        id={inputId}
        onChange={handleInputChange}
        showClear={false}
        {size}
        value={states().inputValue}
        {...inputProps}
        class={[`${cls}-input`, multiple ? `${cls}-input-multiple` : `${cls}-input-single`, inputProps?.class]}
        style={multiple ? `width: ${states().inputValue ? `${states().inputValue.length * 16}px` : '2px'}` : inputProps?.style}
    />
{/snippet}

{#snippet tagContent(item: SelectOptionProps, index: number, ellipsis: boolean)}
    {#if selectedItem}
        {@render selectedItem(selectedItemProps(item, index))}
    {:else if ellipsis}
        <TypographyText ellipsis={{ rows: 1, showTooltip: { type: 'popover', opts: { style: 'width: auto; font-size: 12px' } } }} size="small">{item.label}</TypographyText>
    {:else}
        {item.label}
    {/if}
{/snippet}

{#snippet tagItem(item: SelectOptionProps, index: number, inGroup = false, ellipsis = false)}
    {#if tag}
        {@render tag(selectedItemProps(item, index))}
    {:else}
        <Tag closable={!selectedItemProps(item, index).disabled} color="white" onClose={(event) => removeTag(item, event)} size={tagSize} style={inGroup ? undefined : 'max-width: 100%'} tabindex={inGroup ? -1 : undefined}>
            {@render tagContent(item, index, ellipsis)}
        </Tag>
    {/if}
{/snippet}

{#snippet restTagsCount()}
    <Tag class={`${cls}-content-wrapper-collapse-tag`} closable={false} color="grey" size={tagSize} style="margin-right: 0; flex-shrink: 0">+{states().overflowItemCount}</Tag>
{/snippet}

{#snippet restTags()}
    <Space spacing={2} style="max-width: 400px" wrap>
        {#each selectedItems.slice(selectedItems.length - states().overflowItemCount) as item, index (item.value)}
            {@render tagItem(item, index)}
        {/each}
    </Space>
{/snippet}

{#snippet multipleContent()}
    {#if !maxTagCount || (expandRestTagsOnClick && states().isOpen)}
        {#each selectedItems as item, index (item.value)}
            {@render tagItem(item, index)}
        {/each}
    {:else if ellipsisTrigger}
        <div class={`${cls}-content-wrapper-collapse`}>
            <OverflowList itemKey="value" items={collapsedTags} onOverflow={(items) => handleOverflow(items as SelectOptionProps[])}>
                {#snippet item({ item, index }: { item: SelectOptionProps; index: number })}
                    {@render tagItem(item, index)}
                {/snippet}
                {#snippet overflow({ items }: { items: SelectOptionProps[] })}
                    {#each items.slice(0, 1) as item (item.value)}
                        {@render tagItem(item, collapsedTags.indexOf(item), false, true)}
                    {/each}
                {/snippet}
            </OverflowList>
            {#if states().overflowItemCount > 0}
                {#if showRestTagsPopover}
                    <Popover {...restPopoverProps} content={restTags}>
                        {@render restTagsCount()}
                    </Popover>
                {:else}
                    {@render restTagsCount()}
                {/if}
            {/if}
        </div>
    {:else}
        <TagGroup maxTagCount={groupMaxTagCount} onPlusNMouseEnter={foundation.updateIsFullTags} popoverProps={showRestTagsPopover ? restTagsPopoverProps : undefined} restCount={groupRestCount} showPopover={showRestTagsPopover} size={tagSize} tagList={groupTags.map((item) => ({ tagKey: item.value }))}>
            {#snippet tag({ index }: { index: number })}
                {@render tagItem(selectedItems[index], index, true)}
            {/snippet}
        </TagGroup>
    {/if}
{/snippet}

{#snippet triggerContent()}
    {#if prefix || insetLabel}
        <div
            {@attach trackPrefix}
            class={[
                `${cls}-prefix`,
                {
                    [`${cls}-inset-label`]: !prefix,
                    [`${cls}-prefix-text`]: prefixKind === 'text',
                    [`${cls}-prefix-icon`]: prefixKind === 'icon',
                },
            ]}
            id={prefixId}
            x-semi-prop="prefix,insetLabel"
        >
            {#if prefix}
                {@render prefix()}
            {:else}
                {@render insetLabel?.()}
            {/if}
        </div>
    {/if}
    <div class={`${cls}-selection`}>
        {#if multiple}
            <div
                class={[
                    `${cls}-content-wrapper`,
                    {
                        [`${cls}-content-wrapper-one-line`]: maxTagCount && !states().isOpen,
                        [`${cls}-content-wrapper-empty`]: !selectedItems.length,
                    },
                ]}
            >
                {#if selectedItems.length}
                    {@render multipleContent()}
                {:else if placeholder && !states().inputValue}
                    <span class={[`${cls}-selection-text`, `${cls}-selection-placeholder`]}>{placeholder}</span>
                {/if}
                {#if filterable && searchInTrigger}
                    {@render triggerSearch()}
                {/if}
            </div>
        {:else}
            <div class={`${cls}-content-wrapper`}>
                <span
                    class={[
                        `${cls}-selection-text`,
                        {
                            [`${cls}-selection-placeholder`]: !hasSingleContent,
                            [`${cls}-selection-text-hide`]: Boolean(states().inputValue) && states().showInput && searchInTrigger,
                            [`${cls}-selection-text-inactive`]: !states().inputValue && states().showInput && searchInTrigger,
                        },
                    ]}
                    id={selectionTextId}
                    x-semi-prop="placeholder"
                >
                    {#if singleItem && hasSingleContent}
                        {#if selectedItem}
                            {@render selectedItem({ option: singleItem, index: 0, disabled, onClose: () => handleClear() })}
                        {:else}
                            {singleItem.label}
                        {/if}
                    {:else}
                        {placeholder}
                    {/if}
                </span>
                {#if filterable && states().showInput && searchInTrigger}
                    {@render triggerSearch()}
                {/if}
            </div>
        {/if}
    </div>
    {#if suffix}
        <div
            {@attach trackSuffix}
            class={[
                `${cls}-suffix`,
                {
                    [`${cls}-suffix-text`]: suffixKind === 'text',
                    [`${cls}-suffix-icon`]: suffixKind === 'icon',
                },
            ]}
            x-semi-prop="suffix"
        >
            {@render suffix()}
        </div>
    {/if}
{/snippet}

{#snippet triggerNode({ props }: { props: TooltipTriggerProps })}
    <div
        bind:this={root}
        {...props}
        {...rootAttrs}
        class={trigger
            ? rest.class
            : [
                  cls,
                  rest.class,
                  {
                      [`${cls}-borderless`]: borderless,
                      [`${cls}-open`]: states().isOpen,
                      [`${cls}-focus`]: states().isFocus,
                      [`${cls}-disabled`]: disabled,
                      [`${cls}-single`]: !multiple,
                      [`${cls}-multiple`]: multiple,
                      [`${cls}-filterable`]: filterable,
                      [`${cls}-small`]: size === 'small',
                      [`${cls}-large`]: size === 'large',
                      [`${cls}-error`]: validateStatus === 'error',
                      [`${cls}-warning`]: validateStatus === 'warning',
                      [`${cls}-no-arrow`]: !showArrow,
                      [`${cls}-with-prefix`]: Boolean(prefix || insetLabel),
                      [`${cls}-with-suffix`]: Boolean(suffix),
                  },
              ]}
        id={selectId}
        tabindex={disabled || inputIsCombobox ? -1 : 0}
        onclick={handleClick}
        onfocusin={handleFocusIn}
        onfocusout={handleFocusOut}
        onkeydown={handleKeyDown}
    >
        {#if trigger}
            {@render trigger(triggerSnippetProps)}
        {:else}
            {@render triggerContent()}
            {#if clearable}
                <button aria-label={locale().locale.clear} bind:this={clearButton} class={`${cls}-clear`} type="button" onclick={handleClear} onkeydown={stopOwnKeys}>
                    {#if clearIcon}
                        {@render clearIcon()}
                    {:else}
                        <IconClear />
                    {/if}
                </button>
            {/if}
            {#if showArrow}
                <div class={`${cls}-arrow`} x-semi-prop="arrowIcon">
                    {#if arrowIcon}
                        {@render arrowIcon()}
                    {:else}
                        <IconChevronDown />
                    {/if}
                </div>
            {:else}
                <div class={`${cls}-arrow-empty`}></div>
            {/if}
        {/if}
    </div>
{/snippet}

{#snippet row(option: OptionRecord, index: number, rowStyle?: string)}
    {#if option.create && createItem}
        <div aria-selected="false" id={optionId(index)} role="option" onclick={(event) => handleSelect(option, index, event)}>
            {@render createItem(createItemProps(option, index, rowStyle))}
        </div>
    {:else if !option.create && optionItem}
        {@render optionItem(optionItemProps(option, index, rowStyle))}
    {:else if option.create}
        <Option {...optionRowProps(option, index, rowStyle)}>
            <span class={`${cls}-create-tips`}>{locale().locale.createText}</span>{option.data.value}
        </Option>
    {:else if optionLabel}
        <Option {...optionRowProps(option, index, rowStyle)}>
            <div class={`${cssClasses.PREFIX_OPTION}-text`} x-semi-prop="optionLabel">
                {@render optionLabel({ option: option.data })}
            </div>
        </Option>
    {:else}
        <Option {...optionRowProps(option, index, rowStyle)} />
    {/if}
{/snippet}

{#snippet runRows(rows: { option: OptionRecord; index: number }[])}
    {#each rows as { option, index } (rowKey(option))}
        {@render row(option, index)}
    {/each}
{/snippet}

{#snippet panel()}
    <div bind:this={optionContainer} class={[{ [`${cls}-option-list-wrapper`]: !(visibleOptions.length === 0 && emptyHidden) }, dropdownClassName]} style={dropdownStyle} onkeydown={foundation.handleContainerKeyDown} onmousedown={keepFocusOnPress}>
        {#if outerTopSlot}
            <div class={`${cls}-option-list-outer-top-slot`} onmouseenter={foundation.handleSlotMouseEnter}>
                {@render outerTopSlot()}
            </div>
        {/if}
        {#if !searchInTrigger && filterable}
            <div class={`${cls}-dropdown-search-wrapper`}>
                <Input
                    aria-activedescendant={activeDescendant}
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    bind:this={dropdownInput}
                    {...nameAttrs}
                    {disabled}
                    onChange={handleInputChange}
                    placeholder={searchPlaceholder}
                    prefix={searchIcon}
                    showClear
                    value={states().inputValue}
                    {...inputProps}
                    class={[`${cls}-dropdown-input`, multiple ? `${cls}-dropdown-input-multiple` : `${cls}-dropdown-input-single`, inputProps?.class]}
                    onKeyDown={(event) => {
                        inputProps?.onKeyDown?.(event);
                        // the popup is not a DOM descendant of the trigger, so the key does not bubble to it
                        foundation.handleKeyDown(event);
                    }}
                />
            </div>
        {/if}
        <div id={listboxId} {...nameAttrs} aria-multiselectable={multiple} class={[`${cls}-option-list`, { [`${cls}-option-list-chosen`]: states().selections.size }]} role="listbox" style:max-height={toCssLength(maxHeight)} onscrollcapture={foundation.handleListScroll}>
            {#if innerTopSlot}
                <div class={`${cls}-option-list-inner-top-slot`} onmouseenter={foundation.handleSlotMouseEnter}>
                    {@render innerTopSlot()}
                </div>
            {/if}
            {#if loading}
                <div class={`${cls}-loading-wrapper`}>
                    <Spin />
                </div>
            {:else if visibleOptions.length === 0}
                {#if !emptyHidden}
                    <Option empty>
                        {#if emptyContent}
                            {@render emptyContent()}
                        {:else}
                            {locale().locale.emptyText}
                        {/if}
                    </Option>
                {/if}
            {:else if virtualize}
                <VirtualList bind:this={virtualList} height={virtualize.height || numbers.LIST_HEIGHT} itemCount={visibleOptions.length} itemSize={virtualize.itemSize} style={config.direction ? `direction: ${config.direction}` : undefined} tabindex={-1} width={virtualize.width || '100%'}>
                    {#snippet children({ index, style }: { index: number; style: string })}
                        {@render row(visibleOptions[index], index, style)}
                    {/snippet}
                </VirtualList>
            {:else}
                {#each optionRuns as run (runKey(run))}
                    {#if hasTitle(run.group)}
                        {@const titleId = `${selectId}-group-${run.first}`}
                        <div aria-labelledby={titleId} class={`${cls}-group-wrapper`} role="group">
                            <div class={cssClasses.PREFIX_GROUP} id={titleId} x-semi-prop="groupLabel">
                                {#if groupLabel}
                                    {@render groupLabel({ group: run.group })}
                                {:else}
                                    {run.group.label}
                                {/if}
                            </div>
                            {@render runRows(run.rows)}
                        </div>
                    {:else}
                        {@render runRows(run.rows)}
                    {/if}
                {/each}
            {/if}
            {#if innerBottomSlot}
                <div class={`${cls}-option-list-inner-bottom-slot`} onmouseenter={foundation.handleSlotMouseEnter}>
                    {@render innerBottomSlot()}
                </div>
            {/if}
        </div>
        {#if outerBottomSlot}
            <div class={`${cls}-option-list-outer-bottom-slot`} onmouseenter={foundation.handleSlotMouseEnter}>
                {@render outerBottomSlot()}
            </div>
        {/if}
    </div>
{/snippet}

<Popover
    afterClose={foundation.handlePopoverClose}
    {autoAdjustOverflow}
    bind:this={popover}
    bind:visible={() => states().isOpen, () => undefined}
    child={triggerNode}
    content={panel}
    disableArrowKeyDown
    {motion}
    onOpen={scrollToSelection}
    position={resolvedPosition}
    role="presentation"
    {spacing}
    {stopPropagation}
    style={dropdownMatchSelectWidth ? 'min-width: var(--semi-tooltip-trigger-width)' : undefined}
    trigger="custom"
/>
