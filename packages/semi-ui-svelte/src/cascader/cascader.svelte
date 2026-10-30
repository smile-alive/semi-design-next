<script lang="ts">
    import { tick, untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/cascader/constants';
    import CascaderFoundation, { type BasicCascaderInnerData, type BasicCascaderProps, type BasicValue, type CascaderAdapter } from '@fibrae/semi-foundation/cascader/foundation';
    import { calcMergeType } from '@fibrae/semi-foundation/cascader/util';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { isInnerControlKey, isTextEditor, joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/cascader/cascader.scss';
    import { IconChevronDown, IconClear } from '@fibrae/semi-icons-svelte';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import { type SlotKind, trackSlotKind } from '../_base/slot-kind.js';
    import useClickOutside from '../_base/use-click-outside.svelte.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { useConfig } from '../config-provider/index.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { Input } from '../input/index.js';
    import { useLocale } from '../locale/index.js';
    import { Popover } from '../popover/index.js';
    import { TagInput, type TagInputTagSnippetProps } from '../tag-input/index.js';
    import { Tag, type TagCloseEvent } from '../tag/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import type { CascaderChangeValue, CascaderData, CascaderEntity, CascaderProps, CascaderScrollPanelProps, CascaderTagSnippetProps, CascaderTriggerSnippetProps, CascaderValue } from './interface.js';
    import Item from './item.svelte';

    // the click or key event that opens, selects or closes; the foundation passes it on to focus and blur
    type FoundationEvent = MouseEvent | KeyboardEvent;
    type Foundation = CascaderFoundation<FoundationEvent, Event>;
    type Adapter = CascaderAdapter<FoundationEvent, Event>;

    const defaults = useDefaultProps('Cascader');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        multiple = defaults('multiple', false),
        treeData = defaults('treeData', []),
        keyMaps = defaults('keyMaps'),
        changeOnSelect = defaults('changeOnSelect', false),
        autoMergeValue = defaults('autoMergeValue', true),
        leafOnly = defaults('leafOnly', false),
        checkRelation = defaults('checkRelation', strings.RELATED),
        disableStrictly = defaults('disableStrictly', false),
        max = defaults('max'),
        maxTagCount = defaults('maxTagCount'),
        showRestTagsPopover = defaults('showRestTagsPopover', false),
        restTagsPopoverProps = defaults('restTagsPopoverProps'),
        enableLeafClick = defaults('enableLeafClick', false),
        clickToSelect = defaults('clickToSelect', false),
        showNext = defaults('showNext', strings.SHOW_NEXT_BY_CLICK),
        loadData = defaults('loadData'),
        filterTreeNode = defaults('filterTreeNode', false),
        filterSorter = defaults('filterSorter'),
        filterLeafOnly = defaults('filterLeafOnly', true),
        treeNodeFilterProp = defaults('treeNodeFilterProp', 'label'),
        remote = defaults('remote', false),
        displayProp = defaults('displayProp', 'label'),
        separator = defaults('separator', ' / '),
        onChangeWithObject = defaults('onChangeWithObject', false),
        placeholder = defaults('placeholder'),
        searchPlaceholder = defaults('searchPlaceholder'),
        searchPosition = defaults('searchPosition', strings.SEARCH_POSITION_TRIGGER),
        disabled: disabledProp,
        size: sizeProp,
        borderless = defaults('borderless', false),
        validateStatus = defaults('validateStatus'),
        // no global default: a global id would repeat on every instance
        insetLabelId,
        showClear = defaults('showClear', false),
        defaultOpen = defaults('defaultOpen', false),
        motion = defaults('motion', true),
        autoAdjustOverflow = defaults('autoAdjustOverflow'),
        position = defaults('position'),
        stopPropagation = defaults('stopPropagation', true),
        dropdownClassName = defaults('dropdownClassName'),
        dropdownStyle = defaults('dropdownStyle'),
        preventScroll = defaults('preventScroll'),
        virtualizeInSearch = defaults('virtualizeInSearch'),
        onChange,
        onSelect,
        onSearch,
        onFocus,
        onBlur,
        onDropdownVisibleChange,
        onClear,
        onExceed,
        onLoad,
        onListScroll,
        onKeyDown,
        label,
        display,
        tag,
        filterItem,
        trigger,
        expandIcon,
        arrowIcon,
        clearIcon,
        emptyContent,
        prefix,
        suffix,
        insetLabel,
        topSlot,
        bottomSlot,
        ...rest
    }: CascaderProps = $props();

    const config = useConfig();
    const locale = useLocale('Cascader');

    const uid = $props.id();
    let triggerEl = $state<HTMLDivElement>();
    let contentEl = $state<HTMLDivElement>();
    let item = $state<Item>();
    let searchInput = $state<Input>();
    let tagInput = $state<TagInput>();
    let clearButton = $state<HTMLButtonElement>();
    let prefixKind = $state<SlotKind>();
    let suffixKind = $state<SlotKind>();
    let previous: { data: CascaderData[]; keyMaps: unknown; value: unknown } | undefined;

    // The foundation caches keyEntities by treeData identity, so an in-place change (a `$state` tree) needs a new array;
    // an equal array keeps the old one. Known limit: the snapshot walks the whole tree on every change, so a very large
    // tree wants a replaced treeData rather than in-place edits.
    let treeSource = $state.raw(untrack(() => [...(treeData ?? [])]));
    let treeSnapshot = untrack(() => $state.snapshot(treeData));

    // A key is reported once: in the capture phase if the options may take it, in the bubble phase for inner controls
    const reported = new WeakSet<KeyboardEvent>();
    const comboboxKeys = new Set(['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const nestedPopups = useNestedPopups();

    // an InputGroup supplies size and disabled when the control is given none; the controls inside this one must not read it again
    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled') ?? false);
    const size = $derived(sizeProp ?? group?.size ?? defaults('size', 'default'));
    const popupId = `${uid}-popup`;
    const selectionTextId = `${uid}-selection`;
    const cls = cssClasses.PREFIX;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: BasicCascaderProps = {
        get autoMergeValue() {
            return autoMergeValue;
        },
        get changeOnSelect() {
            return changeOnSelect;
        },
        get checkRelation() {
            return checkRelation;
        },
        get clickToSelect() {
            return clickToSelect;
        },
        get defaultOpen() {
            return defaultOpen;
        },
        get disabled() {
            return disabled;
        },
        get disableStrictly() {
            return disableStrictly;
        },
        get displayProp() {
            return displayProp;
        },
        get enableLeafClick() {
            return enableLeafClick;
        },
        get filterLeafOnly() {
            return filterLeafOnly;
        },
        get filterSorter() {
            return filterSorter;
        },
        get filterTreeNode() {
            return filterTreeNode as BasicCascaderProps['filterTreeNode'];
        },
        get keyMaps() {
            return keyMaps;
        },
        get leafOnly() {
            return leafOnly;
        },
        get loadData() {
            return loadData as BasicCascaderProps['loadData'];
        },
        get max() {
            return max;
        },
        get multiple() {
            return multiple;
        },
        get onChangeWithObject() {
            return onChangeWithObject;
        },
        get remote() {
            return remote;
        },
        get searchPosition() {
            return searchPosition;
        },
        get separator() {
            return separator;
        },
        get treeData() {
            return treeSource;
        },
        get treeNodeFilterProp() {
            return treeNodeFilterProp;
        },
        get value() {
            return value as BasicValue;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, BasicCascaderProps, BasicCascaderInnerData>(
        CascaderFoundation,
        foundationProps,
        (props) => CascaderFoundation.getInitialState(props),
        (base) => ({
            focusCombobox: () => {
                if (searchInput) {
                    searchInput.focus({ preventScroll });
                } else if (tagInput) {
                    // TagInput reads preventScroll from its own prop
                    tagInput.focus();
                } else {
                    triggerEl?.focus({ preventScroll });
                }
            },
            blurCombobox: () => {
                (searchInput ?? tagInput)?.blur();
                triggerEl?.blur();
            },
            updateStates: (next) => base.setState(next as BasicCascaderInnerData),
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next as CascaderValue;
                onChange?.(next as CascaderChangeValue);
            },
            notifySelect: (selected) => onSelect?.(selected),
            notifyOnSearch: (input) => onSearch?.(input),
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            notifyDropdownVisibleChange: (visible) => onDropdownVisibleChange?.(visible),
            notifyLoadData: (selectedOpt, callback, onReject) => {
                if (!loadData) {
                    return;
                }
                const loading = loadData(selectedOpt as CascaderData[]);
                loading.then(undefined, onReject);
                // The rejection stays unhandled here so it reaches the caller; tick runs the callback after the treeData
                // update, otherwise loadingKeys clears first and activeKeys shifts.
                void loading.then(() => tick().then(() => callback()));
            },
            notifyOnLoad: (newLoadedKeys, data) => onLoad?.(newLoadedKeys, data as CascaderData),
            notifyListScroll: (event, panel) => onListScroll?.(event, panel as CascaderScrollPanelProps),
            notifyOnExceed: (data) => onExceed?.(data as CascaderEntity[]),
            notifyClear: () => onClear?.(),
            toggleInputShow: (showInput, callback) => {
                const focusInTrigger = triggerEl?.contains(FocusTrapHandle.getActiveElement(triggerEl));
                base.setState({ showInput }, () => {
                    // unmounting the focused search input would drop focus to the body
                    if (!showInput && focusInTrigger) {
                        triggerEl?.focus({ preventScroll: true });
                    }
                    callback();
                });
            },
            scrollToOption: (key, index) => {
                if (!item?.scrollToItem(index)) {
                    contentEl?.querySelector(`#${CSS.escape(optionId(key))}`)?.scrollIntoView({ block: 'nearest' });
                }
            },
        })
    );

    // controlled values and the multiple-mode tree are derived here, so they reach the DOM in the render that receives them
    const view: BasicCascaderInnerData = $derived(multiple ? { ...states(), ...CascaderFoundation.deriveMultipleState(foundationProps, states()) } : states());
    const renderData = $derived(CascaderFoundation.getRenderData(foundationProps, view));
    const isEmpty = $derived(!renderData.length);
    const mergeType = $derived(calcMergeType(autoMergeValue, leafOnly));
    const realKeys = $derived(mergeType === strings.NONE_MERGE_TYPE || checkRelation === strings.UN_RELATED ? view.checkedKeys : view.resolvedCheckedKeys);
    const keyboardKey = $derived(view.isOpen ? CascaderFoundation.getKeyboardKey(view) : null);
    const triggerSearch = $derived(Boolean(filterTreeNode) && searchPosition === strings.SEARCH_POSITION_TRIGGER);
    const resolvedPosition = $derived(position ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    const inputPlaceholder = $derived(searchPlaceholder || placeholder);
    const tagSize = $derived(size === 'default' ? 'large' : size);

    // multiple mode keeps no selectedKeys beyond the one getInitialState writes; its value also holds controlled paths without tags
    const clearable = $derived(showClear && Boolean(view.inputValue || (multiple ? CascaderFoundation.hasMultipleValue(foundationProps, view) : view.selectedKeys.size)) && !disabled);

    // ARIA 1.2: the search input is the combobox while mounted, otherwise the trigger is a select-only combobox
    const inputIsCombobox = $derived(triggerSearch && !trigger && (multiple || view.showInput));

    // A rendered inset label names the combobox and the popup, so it needs an id even when the caller gives none
    const insetLabelShown = $derived(!trigger && !prefix && Boolean(insetLabel));
    const prefixId = $derived(insetLabelId ?? (insetLabelShown ? `${uid}-inset-label` : undefined));

    // The popup binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const nameAttrs = $derived(comboboxName(rest['aria-labelledby'] ?? undefined, rest['aria-label'] ?? undefined, insetLabelShown ? prefixId : undefined, locale().locale.label));
    const attrs = $derived(splitControlAttrs(rest, (key) => comboboxKeys.has(key)));
    const restPopoverProps = $derived({ autoAdjustOverflow: true, position: 'top' as const, showArrow: true, trigger: 'hover' as const, ...restTagsPopoverProps });
    const trackPrefix = trackSlotKind((kind) => (prefixKind = kind));
    const trackSuffix = trackSlotKind((kind) => (suffixKind = kind));

    setInputGroupContext(undefined);

    // ids are IDREFs for aria-activedescendant, so a key with spaces is encoded
    const optionId = (key: string) => `${popupId}-option-${encodeURIComponent(key)}`;

    const comboboxAttrs = $derived({
        ...attrs.control,
        role: 'combobox',
        'aria-activedescendant': keyboardKey === null ? undefined : optionId(keyboardKey),
        'aria-controls': popupId,
        'aria-expanded': view.isOpen,
        'aria-haspopup': (filterTreeNode && view.isSearching ? 'listbox' : 'tree') as 'listbox' | 'tree',
        ...nameAttrs,
    });

    const rootAttrs = $derived(inputIsCombobox ? attrs.root : { ...attrs.root, ...comboboxAttrs, 'aria-disabled': disabled });

    const searchInputAttrs = $derived({
        ...comboboxAttrs,
        'aria-autocomplete': 'list' as const,
        // the selected text sits beside the input, which is empty until the user types, so the combobox has no value of
        // its own; the text is exposed as the description
        'aria-describedby': joinIds(rest['aria-describedby'], view.inputValue ? undefined : selectionTextId),
        // the trigger draws its own clear button: a global Input default must not add one
        showClear: false,
    });

    const selection = $derived.by(() => {
        const [key] = view.selectedKeys;
        return key === undefined ? undefined : { key, labels: CascaderFoundation.getItemPropPath(key, displayProp, view.keyEntities) as Array<string | number> };
    });

    const triggerSnippetProps: CascaderTriggerSnippetProps = $derived.by(() => {
        const { keyEntities, checkedKeys, resolvedCheckedKeys, selectedKeys } = view;
        // the trigger gets positions; mergeType decides which checked set they come from, whatever checkRelation is
        const keys = mergeType === strings.NONE_MERGE_TYPE ? checkedKeys : resolvedCheckedKeys;
        return {
            value: multiple ? new Set([...keys].map((key) => keyEntities[key]?.pos)) : keyEntities[[...selectedKeys][0]]?.pos,
            inputValue: view.inputValue,
            placeholder: inputPlaceholder,
            disabled,
            onSearch: foundation.handleInputChange,
            onClear: (event) => handleClear(event),
            onRemove: foundation.handleTagRemoveInTrigger,
        };
    });

    const isShownTag = (index: number) => {
        return typeof maxTagCount !== 'number' || maxTagCount >= index + 1;
    };

    const entityOf = (key: string) => {
        return view.keyEntities[key] as CascaderEntity | undefined;
    };

    const isTagDisabled = (key: string) => {
        return Boolean(disabled || entityOf(key)?.data.disabled || (disableStrictly && view.disabledKeys?.has(key)));
    };

    const removeTag = (key: string, event?: TagCloseEvent) => {
        // when the value does not change, the tag must not hide itself
        event?.preventDefault();
        foundation.handleTagRemoveByKey(key);
    };

    const tagSnippetProps = (key: string, index: number): CascaderTagSnippetProps => {
        return { entity: entityOf(key) as CascaderEntity, index, disabled: isTagDisabled(key), onClose: (event) => removeTag(key, event) };
    };

    const handleClear = (event?: MouseEvent) => {
        event?.stopPropagation();
        foundation.handleClear();
    };

    const handleClearClick = (event: MouseEvent) => {
        handleClear(event);
        if (inputIsCombobox) {
            foundation.focus();
        } else {
            triggerEl?.focus();
        }
    };

    // the clear button's own Enter and Space must not reach the combobox's keydown handler
    const stopOwnKeys = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation();
        }
    };

    const report = (event: KeyboardEvent) => {
        if (!reported.has(event)) {
            reported.add(event);
            onKeyDown?.(event);
        }
    };

    // a press would focus the popup, which is hidden on close and drops the focus to body; the focus stays on the
    // trigger. A text field in a snippet still takes the focus.
    const keepFocusOnPress = (event: MouseEvent) => {
        if (!isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    const handleOptionKeyDown = (event: KeyboardEvent) => {
        return foundation.handleOptionKeyDown(event, { editing: isTextEditor(event.target), rtl: config.direction === 'rtl' });
    };

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

    const handleContentKeyDown = (event: KeyboardEvent) => {
        handleOptionKeyDown(event);
        foundation.handleKeyDown(event);
    };

    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleClick(event);
        rest.onclick?.(event);
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleFocusEnter(event);
        rest.onfocusin?.(event);
    };

    // Focus enters the dropdown through a field in a snippet, and the dropdown is not a DOM descendant of the trigger,
    // so containment is checked against its popup layer
    const handleFocusOut = (event: FocusEvent) => {
        const target = event.relatedTarget;
        const inside = target instanceof Node && (Boolean(triggerEl?.contains(target)) || Boolean(contentEl?.closest('[popover]')?.contains(target)));
        if (!inside) {
            foundation.handleFocusLeave(event);
        }
    };

    const handleTriggerFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        handleFocusOut(event);
        rest.onfocusout?.(event);
    };

    $effect.pre(() => {
        const snapshot = $state.snapshot(treeData);
        untrack(() => {
            if (!isEqual(snapshot, treeSnapshot)) {
                treeSnapshot = snapshot;
                treeSource = [...(treeData ?? [])];
            }
        });
    });

    // One effect for the tuple, so options and value changing together only re-collect the options. The values are
    // compared by content: an inline value is a new array on every parent render, and each change resets the search;
    // undefined, a value going back to uncontrolled, clears the selection.
    $effect(() => {
        const next = { data: treeSource, keyMaps: $state.snapshot(keyMaps), value: $state.snapshot(value) };
        const before = previous;
        previous = next;
        if (before) {
            const optionsChanged = next.data !== before.data || !isEqual(next.keyMaps, before.keyMaps);
            const valueChanged = !isEqual(next.value, before.value);
            if (optionsChanged || valueChanged) {
                untrack(() => foundation.handleInputsChange({ optionsChanged, valueChanged }, next.value as BasicValue));
            }
        }
    });

    // The clear button goes with the value. A removed node fires no blur, so a focused button would drop the focus to
    // the body while the Cascader stays focused; this runs before the DOM update removes the button.
    $effect.pre(() => {
        if (!clearable && clearButton && clearButton === FocusTrapHandle.getActiveElement(clearButton)) {
            (inputIsCombobox ? triggerEl?.querySelector('input') : triggerEl)?.focus({ preventScroll });
        }
    });

    useClickOutside(
        [() => triggerEl, () => contentEl],
        (event) => {
            if (contentEl) {
                foundation.handleClickOutside(event);
            }
        },
        () => states().isOpen,
        nestedPopups
    );

    export function open() {
        foundation.open();
    }

    export function close() {
        foundation.close();
    }

    export function focus() {
        foundation.focus();
    }

    export function blur() {
        foundation.blur();
    }

    /** Searches as if `keyword` were typed; needs `filterTreeNode` */
    export function search(keyword: string) {
        foundation.handleInputChange(keyword);
    }
</script>

{#snippet tagNode(key: string, index: number)}
    {@const entity = entityOf(key)}
    {#if entity}
        {#if tag}
            {@render tag(tagSnippetProps(key, index))}
        {:else}
            <Tag class={[`${cls}-selection-tag`, { [`${cls}-selection-tag-disabled`]: isTagDisabled(key) }]} closable={!isTagDisabled(key)} color="white" onClose={(event) => removeTag(key, event)} size={tagSize} tagKey={key}>
                {entity.data[displayProp]}
            </Tag>
        {/if}
    {/if}
{/snippet}

{#snippet tagInputTag({ value: key, index }: TagInputTagSnippetProps)}
    {@render tagNode(key, index)}
{/snippet}

{#snippet restTags()}
    {#each [...realKeys] as key, index (`tag-${key}-${index}`)}
        {#if !isShownTag(index)}
            {@render tagNode(key, index)}
        {/if}
    {/each}
{/snippet}

{#snippet restCount()}
    <span class={[`${cls}-selection-n`, { [`${cls}-selection-n-disabled`]: disabled }]}>+{realKeys.size - (maxTagCount ?? 0)}</span>
{/snippet}

{#snippet selectionText(emptyText?: string, id?: string)}
    <span
        class={{
            [`${cls}-selection-placeholder`]: !selection,
            [`${cls}-selection-text-hide`]: Boolean(view.showInput && view.inputValue),
            [`${cls}-selection-text-inactive`]: Boolean(view.showInput && !view.inputValue),
        }}
        {id}
    >
        {#if !selection}
            {emptyText}
        {:else if display}
            {@render display({ labels: selection.labels, path: CascaderFoundation.getItemPropPath(selection.key, [], view.keyEntities) })}
        {:else}
            {selection.labels.join(separator)}
        {/if}
    </span>
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
    <div class={[`${cls}-selection`, { [`${cls}-selection-multiple`]: multiple && view.checkedKeys.size > 0 }]}>
        {#if triggerSearch && !multiple}
            <div class={[`${cls}-search-wrapper`, { [`${cls}-search-wrapper-${size}`]: size !== 'default' }]}>
                {@render selectionText(inputPlaceholder, selectionTextId)}
                {#if view.showInput}
                    <Input bind:this={searchInput} bind:value={() => view.inputValue, () => {}} {...searchInputAttrs} class={`${cls}-input`} {disabled} onChange={foundation.handleInputChange} {size} />
                {/if}
            </div>
        {:else if triggerSearch}
            <TagInput
                bind:inputValue={() => view.inputValue, () => {}}
                bind:this={tagInput}
                bind:value={() => [...realKeys], () => {}}
                {...comboboxAttrs}
                aria-autocomplete="list"
                class={`${cls}-tagInput-wrapper`}
                {disabled}
                expandRestTagsOnClick={false}
                {maxTagCount}
                onInputChange={foundation.handleInputChange}
                onRemove={foundation.handleTagRemoveByKey}
                placeholder={inputPlaceholder}
                {preventScroll}
                {restTagsPopoverProps}
                {showRestTagsPopover}
                {size}
                tag={tagInputTag}
            />
        {:else if multiple}
            {#if view.checkedKeys.size === 0}
                <span class={`${cls}-selection-placeholder`}>{placeholder}</span>
            {:else}
                {#each [...realKeys] as key, index (`tag-${key}-${index}`)}
                    {#if isShownTag(index)}
                        {@render tagNode(key, index)}
                    {/if}
                {/each}
                {#if !isShownTag(realKeys.size - 1)}
                    {#if showRestTagsPopover}
                        <Popover {...restPopoverProps} content={restTags}>
                            {@render restCount()}
                        </Popover>
                    {:else}
                        {@render restCount()}
                    {/if}
                {/if}
            {/if}
        {:else}
            {@render selectionText(placeholder)}
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
    <!-- the stylesheet shows it in the arrow's place on hover, while open and while focus is inside; its Enter and Space
         stay from the owner's keydown listeners, which listen to the combobox -->
    {#if clearable}
        <button aria-label={locale().locale.clear} bind:this={clearButton} class={`${cls}-clearbtn`} type="button" onclick={handleClearClick} onkeydown={stopOwnKeys}>
            {#if clearIcon}
                {@render clearIcon()}
            {:else}
                <IconClear />
            {/if}
        </button>
    {/if}
    {#if arrowIcon !== null}
        <div class={`${cls}-arrow`} x-semi-prop="arrowIcon">
            {#if arrowIcon}
                {@render arrowIcon()}
            {:else}
                <IconChevronDown />
            {/if}
        </div>
    {/if}
{/snippet}

{#snippet triggerNode({ props }: { props: TooltipTriggerProps })}
    <!-- the combobox is the Tab stop -->
    <div
        bind:this={triggerEl}
        {...props}
        {...rootAttrs}
        class={trigger
            ? rest.class
            : [
                  cls,
                  rest.class,
                  {
                      [`${cls}-borderless`]: borderless,
                      [`${cls}-focus`]: view.isOpen,
                      [`${cls}-disabled`]: disabled,
                      [`${cls}-single`]: true,
                      [`${cls}-filterable`]: Boolean(filterTreeNode),
                      [`${cls}-error`]: validateStatus === 'error',
                      [`${cls}-warning`]: validateStatus === 'warning',
                      [`${cls}-small`]: size === 'small',
                      [`${cls}-large`]: size === 'large',
                      [`${cls}-with-prefix`]: Boolean(prefix || insetLabel),
                      [`${cls}-with-suffix`]: Boolean(suffix),
                  },
              ]}
        tabindex={disabled || inputIsCombobox ? -1 : 0}
        onclick={handleClick}
        onfocusin={handleFocusIn}
        onfocusout={handleTriggerFocusOut}
        onkeydown={handleKeyDown}
        onkeydowncapture={handleKeyDownCapture}
    >
        {#if trigger}
            {@render trigger(triggerSnippetProps)}
        {:else}
            {@render triggerContent()}
        {/if}
    </div>
{/snippet}

{#snippet panel()}
    <div bind:this={contentEl} class={[dropdownClassName, `${cls}-popover`]} style={dropdownStyle} onfocusin={foundation.handleFocusEnter} onfocusout={handleFocusOut} onkeydown={handleContentKeyDown} onmousedown={keepFocusOnPress}>
        {@render topSlot?.()}
        <Item
            activeKeys={view.activeKeys}
            ariaLabel={nameAttrs['aria-label']}
            ariaLabelledby={nameAttrs['aria-labelledby']}
            bind:this={item}
            checkedKeys={view.checkedKeys}
            data={renderData}
            {emptyContent}
            {expandIcon}
            {filterItem}
            halfCheckedKeys={view.halfCheckedKeys}
            hasLoadData={Boolean(loadData)}
            id={popupId}
            {keyboardKey}
            keyword={view.inputValue}
            {label}
            loadedKeys={view.loadedKeys}
            loadingKeys={view.loadingKeys}
            {multiple}
            onItemCheckboxClick={foundation.onItemCheckboxClick}
            onItemClick={foundation.handleItemClick}
            onItemHover={foundation.handleItemHover}
            onListScroll={foundation.handleListScroll}
            {optionId}
            searchable={Boolean(filterTreeNode) && view.isSearching}
            selectedKeys={view.selectedKeys}
            {separator}
            {showNext}
            virtualize={virtualizeInSearch}
        />
        {@render bottomSlot?.()}
    </div>
{/snippet}

<!-- the tree inside is the combobox's popup; an empty list has no columns to size it, so it takes the trigger's width -->
<Popover
    afterClose={foundation.endSearching}
    {autoAdjustOverflow}
    bind:visible={() => view.isOpen, () => undefined}
    child={triggerNode}
    content={panel}
    {motion}
    onOpen={foundation.handlePopoverOpen}
    position={resolvedPosition}
    role="presentation"
    {stopPropagation}
    style={isEmpty ? 'min-width: var(--semi-tooltip-trigger-width)' : undefined}
    trigger="custom"
/>
