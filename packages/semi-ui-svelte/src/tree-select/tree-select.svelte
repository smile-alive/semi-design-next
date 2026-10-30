<script lang="ts">
    import { isEqual } from 'es-toolkit';
    import { get } from 'es-toolkit/compat';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { cssClasses } from '@fibrae/semi-foundation/tree-select/constants';
    import TreeSelectFoundation, { type BasicTreeSelectInnerData, type BasicTreeSelectProps, type TreeSelectAdapter } from '@fibrae/semi-foundation/tree-select/foundation';
    import { buildRowProps, nodeId } from '@fibrae/semi-foundation/tree/shared';
    import { isInnerControlKey, isTextEditor, joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/tree/tree.scss';
    import '@fibrae/semi-foundation/tree-select/tree-select.scss';
    import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-svelte';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import { type SlotKind, trackSlotKind } from '../_base/slot-kind.js';
    import useClickOutside from '../_base/use-click-outside.svelte.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { useConfig } from '../config-provider/index.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { Input } from '../input/index.js';
    import { useLocale } from '../locale/index.js';
    import { Popover } from '../popover/index.js';
    import { TagInput } from '../tag-input/index.js';
    import { Tag, type TagCloseEvent, TagGroup } from '../tag/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import { setTreeContext } from '../tree/context.js';
    import type { FlattenNode, TreeNodeData, TreeRowProps } from '../tree/interface.js';
    import NodeList from '../tree/node-list.svelte';
    import TreeNode from '../tree/tree-node.svelte';
    import useTreeKeyboard from '../tree/use-tree-keyboard.svelte.js';
    import type { TreeSelectChangeEvent, TreeSelectProps, TreeSelectSearchSnippetProps, TreeSelectSelectedItemSnippetProps, TreeSelectTriggerSnippetProps, TreeSelectValue } from './interface.js';

    type FoundationEvent = MouseEvent | KeyboardEvent;
    type Foundation = TreeSelectFoundation<BasicTreeSelectProps, BasicTreeSelectInnerData, FoundationEvent | null>;
    type Adapter = TreeSelectAdapter<BasicTreeSelectProps, BasicTreeSelectInnerData, FoundationEvent | null>;
    type Bindable = 'value' | 'expandedKeys' | 'loadedKeys';

    interface TagEntry {
        key: string;
        props: TreeSelectSelectedItemSnippetProps;
        text?: unknown;
    }

    const defaults = useDefaultProps('TreeSelect');

    // No fallback on the bindable props: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        expandedKeys = $bindable(),
        loadedKeys = $bindable(),
        multiple = defaults('multiple', false),
        treeData = defaults('treeData', []),
        keyMaps = defaults('keyMaps'),
        treeNodeLabelProp = defaults('treeNodeLabelProp', 'label'),
        treeNodeFilterProp = defaults('treeNodeFilterProp', 'label'),
        filterTreeNode = defaults('filterTreeNode', false),
        showFilteredOnly = defaults('showFilteredOnly', false),
        searchPosition = defaults('searchPosition', 'dropdown'),
        searchPlaceholder = defaults('searchPlaceholder'),
        searchAutoFocus = defaults('searchAutoFocus', false),
        showSearchClear = defaults('showSearchClear', true),
        remote = defaults('remote', false),
        expandAll = defaults('expandAll', false),
        defaultExpandAll = defaults('defaultExpandAll', false),
        autoExpandParent = defaults('autoExpandParent', false),
        expandAction = defaults('expandAction', false),
        motionExpand = defaults('motionExpand', true),
        loadData = defaults('loadData'),
        leafOnly = defaults('leafOnly', false),
        checkRelation = defaults('checkRelation', 'related'),
        disableStrictly = defaults('disableStrictly', false),
        autoMergeValue = defaults('autoMergeValue', true),
        onChangeWithObject = defaults('onChangeWithObject', false),
        maxTagCount = defaults('maxTagCount'),
        showRestTagsPopover = defaults('showRestTagsPopover', false),
        restTagsPopoverProps = defaults('restTagsPopoverProps'),
        labelEllipsis = defaults('labelEllipsis'),
        showLine = defaults('showLine', false),
        virtualize = defaults('virtualize'),
        placeholder = defaults('placeholder'),
        disabled: disabledProp,
        size: sizeProp,
        borderless = defaults('borderless', false),
        validateStatus = defaults('validateStatus'),
        // no global default: a global id would repeat on every instance
        insetLabelId,
        showClear = defaults('showClear', false),
        clickToHide = defaults('clickToHide', true),
        clickTriggerToHide = defaults('clickTriggerToHide', true),
        defaultOpen = defaults('defaultOpen', false),
        motion = defaults('motion', true),
        autoAdjustOverflow = defaults('autoAdjustOverflow', true),
        position = defaults('position'),
        stopPropagation = defaults('stopPropagation', true),
        dropdownClassName = defaults('dropdownClassName'),
        dropdownStyle = defaults('dropdownStyle'),
        dropdownMatchSelectWidth = defaults('dropdownMatchSelectWidth', true),
        optionListStyle = defaults('optionListStyle'),
        preventScroll = defaults('preventScroll'),
        triggerTagWrap = defaults('triggerTagWrap', false),
        onChange,
        onExpand,
        onLoad,
        onSelect,
        onSearch,
        onVisibleChange,
        onFocus,
        onBlur,
        onClear,
        label,
        icon,
        expandIcon,
        fullLabel,
        selectedItem,
        tag,
        trigger,
        search: searchBox,
        prefix,
        suffix,
        insetLabel,
        arrowIcon,
        clearIcon,
        emptyContent,
        outerTopSlot,
        outerBottomSlot,
        ...rest
    }: TreeSelectProps = $props();

    const config = useConfig();
    const locale = useLocale('TreeSelect');
    const treeLocale = useLocale('Tree');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let content = $state<HTMLDivElement>();
    let searchWrapper = $state<HTMLDivElement>();
    let nodeList = $state<ReturnType<typeof NodeList>>();
    let tagInput = $state<ReturnType<typeof TagInput>>();
    let clearButton = $state<HTMLButtonElement>();
    let prefixKind = $state<SlotKind>();
    let suffixKind = $state<SlotKind>();
    const comboboxKeys = new Set(['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const nestedPopups = useNestedPopups();

    // an InputGroup supplies size and disabled when the control is given none; the controls inside this one must not read it again
    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled') ?? false);
    const size = $derived(sizeProp ?? group?.size ?? defaults('size', 'default'));

    // What the TreeSelect wrote back to a bindable prop while the prop was undefined, that is while it owned the state.
    // Not reactive on purpose: it changes only together with the prop it describes
    const echoes: Partial<Record<Bindable, { value: unknown }>> = {};
    const cls = cssClasses.PREFIX;
    const treeCls = cssClasses.PREFIX_TREE;
    const treeId = `${uid}-tree`;
    const singleSearchTextId = `${uid}-single-text`;
    const tagSize = $derived(size === 'small' ? 'small' : 'large');
    const virtualized = $derived(Boolean(virtualize && Object.keys(virtualize).length));
    const triggerSearch = $derived(Boolean(filterTreeNode) && searchPosition === 'trigger');

    // ARIA 1.2: a search input on the trigger is the combobox; otherwise the trigger is a select-only combobox. A hidden
    // search box leaves the single mode without an input, and a trigger snippet replaces it
    const inputIsCombobox = $derived(triggerSearch && !trigger && (multiple || searchBox !== false));

    // A rendered inset label names the combobox and the tree, so it needs an id even without insetLabelId
    const insetLabelShown = $derived(!trigger && !prefix && Boolean(insetLabel));
    const prefixId = $derived(insetLabelId ?? (insetLabelShown ? `${uid}-inset-label` : undefined));

    // The tree binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const nameAttrs = $derived(comboboxName(rest['aria-labelledby'] ?? undefined, rest['aria-label'] ?? undefined, insetLabelShown ? prefixId : undefined, locale().locale.label));
    const attrs = $derived(splitControlAttrs(rest, (key) => comboboxKeys.has(key)));
    const emptyHidden = $derived(emptyContent === null);
    const trackPrefix = trackSlotKind((kind) => (prefixKind = kind));
    const trackSuffix = trackSlotKind((kind) => (suffixKind = kind));

    setInputGroupContext(undefined);

    /**
     * The TreeSelect writes every change back to its bindable props, bound or not. Its own write must not turn an
     * uncontrolled TreeSelect controlled: the foundation already updated its state, and deriving it again from the prop
     * would redo the expansion without its animation, or keep the search's expansion after the search clears. So the
     * foundation reads `undefined` for its own echo until the parent passes something else.
     */
    const controlled = <T>(name: Bindable, current?: T) => (current !== undefined && echoes[name] && isEqual(current, echoes[name].value) ? undefined : current);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: BasicTreeSelectProps = {
        get value() {
            return controlled('value', value) as BasicTreeSelectProps['value'];
        },
        get expandedKeys() {
            return controlled('expandedKeys', expandedKeys);
        },
        get loadedKeys() {
            return controlled('loadedKeys', loadedKeys);
        },
        get multiple() {
            return multiple;
        },
        get treeData() {
            return treeData;
        },
        get keyMaps() {
            return keyMaps;
        },
        get treeNodeLabelProp() {
            return treeNodeLabelProp;
        },
        get treeNodeFilterProp() {
            return treeNodeFilterProp;
        },
        get filterTreeNode() {
            return filterTreeNode as BasicTreeSelectProps['filterTreeNode'];
        },
        get showFilteredOnly() {
            return showFilteredOnly;
        },
        get searchPosition() {
            return searchPosition;
        },
        get searchAutoFocus() {
            return searchAutoFocus;
        },
        get remote() {
            return remote;
        },
        get expandAll() {
            return expandAll;
        },
        get defaultExpandAll() {
            return defaultExpandAll;
        },
        get autoExpandParent() {
            return autoExpandParent;
        },
        get expandAction() {
            return expandAction;
        },
        get motionExpand() {
            return motionExpand;
        },
        get loadData() {
            return loadData as BasicTreeSelectProps['loadData'];
        },
        get leafOnly() {
            return leafOnly;
        },
        get checkRelation() {
            return checkRelation;
        },
        get disableStrictly() {
            return disableStrictly;
        },
        get autoMergeValue() {
            return autoMergeValue;
        },
        get onChangeWithObject() {
            return onChangeWithObject;
        },
        get disabled() {
            return disabled;
        },
        get clickToHide() {
            return clickToHide;
        },
        get clickTriggerToHide() {
            return clickTriggerToHide;
        },
        get defaultOpen() {
            return defaultOpen;
        },
        get motion() {
            return motion;
        },
    };

    /** Remembers whether the TreeSelect owned the prop when writing it back */
    const echo = (name: Bindable, next: unknown) => {
        echoes[name] = foundationProps[name] === undefined ? { value: next } : undefined;
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, BasicTreeSelectProps, BasicTreeSelectInnerData>(
        TreeSelectFoundation,
        foundationProps,
        (initialProps) => TreeSelectFoundation.getInitialState(initialProps),
        (base) => ({
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateState: (partial) => base.setState(partial as BasicTreeSelectInnerData),
            notifySelect: (selectedKey, selected, node) => onSelect?.(selectedKey, selected, node as TreeNodeData),
            notifySearch: (input, filteredExpandedKeys, filteredNodes) => onSearch?.(input, filteredExpandedKeys, filteredNodes as TreeNodeData[]),
            setCachedFlattenNodes: (cachedFlattenNodes) => base.setState({ cachedFlattenNodes }),
            notifyLoad: (keys, node) => {
                const next = [...keys];
                echo('loadedKeys', next);
                loadedKeys = next;
                onLoad?.(keys, node as TreeNodeData);
            },
            notifyClear: (event) => onClear?.(event as TreeSelectChangeEvent),
            openMenu: () => base.setState({ isOpen: true }),
            closeMenu: () => {
                keyboard.reset();
                base.setState({ isOpen: false });
            },
            notifyVisibleChange: (visible) => onVisibleChange?.(visible),
            notifyChange: (next, node, event) => {
                echo('value', next);
                value = next as TreeSelectValue;
                onChange?.(next as TreeSelectValue, node as TreeNodeData | TreeNodeData[], event as TreeSelectChangeEvent);
            },
            notifyChangeWithObject: (node, event) => {
                echo('value', node);
                value = node as TreeSelectValue;
                onChange?.(node as TreeSelectValue, node as TreeNodeData | TreeNodeData[], event as TreeSelectChangeEvent);
            },
            notifyExpand: (keys, info) => {
                const next = [...keys];
                echo('expandedKeys', next);
                expandedKeys = next;
                onExpand?.([...keys], { expanded: info.expanded, node: info.node as TreeNodeData });
            },
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event as FoundationEvent | FocusEvent),
            focusInput: () => {
                searchField()?.focus({ preventScroll });
                tagInput?.focus();
            },
            focusTrigger: () => {
                if (root?.getAttribute('role') === 'combobox') {
                    root.focus({ preventScroll });
                } else {
                    (searchField() ?? tagInput)?.focus();
                }
            },
            updateIsFocus: (isFocus) => base.setState({ isFocus }),
            isInTrigger: (node) => node instanceof Node && Boolean(root?.contains(node)),
        })
    );

    // State implied by new props renders with them; the pre-effect writes it back for the handlers before render.
    // Not named `derived`: a local of that name turns the `$derived` rune into a store subscription
    const implied = $derived(TreeSelectFoundation.deriveState(foundationProps, states()));
    const view = $derived<BasicTreeSelectInnerData>(implied ? { ...states(), ...implied } : states());

    const reveal = (index: number, key: string) => {
        if (!nodeList?.scrollToItem(index)) {
            // inside the dropdown, not the document: one in a ShadowRoot is out of document.getElementById's reach
            content?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
        }
    };

    const keyboard = useTreeKeyboard({
        rows: () => view.flattenNodes as FlattenNode[],
        // an APG combobox opens without an active option
        defaultIndex: () => -1,
        rowProps: (node) => rowProps(node),
        hasLoadData: () => Boolean(loadData),
        rtl: () => config.direction === 'rtl',
        editing: (event) => isTextEditor(event.target),
        select: foundation.handleNodeSelect,
        expand: foundation.handleNodeExpand,
        reveal,
    });

    const selectionKeys = $derived(TreeSelectFoundation.getTriggerKeys(foundationProps, view));
    const hasValue = $derived(TreeSelectFoundation.hasValue(foundationProps, view));
    const clearable = $derived(showClear && (hasValue || (searchPosition === 'trigger' && Boolean(view.inputValue))) && !disabled);
    const activeDescendant = $derived(keyboard.activeKey === undefined ? undefined : nodeId(treeId, keyboard.activeKey));

    const comboboxAttrs = $derived({
        ...attrs.control,
        role: 'combobox' as const,
        'aria-activedescendant': activeDescendant,
        'aria-controls': treeId,
        'aria-expanded': view.isOpen,
        'aria-haspopup': 'tree' as const,
        ...nameAttrs,
    });

    const rootAttrs = $derived(inputIsCombobox ? attrs.root : { ...attrs.root, ...comboboxAttrs, 'aria-disabled': disabled });

    const dropdownSearchProps = $derived<TreeSelectSearchSnippetProps>({
        class: `${treeCls}-input`,
        value: view.inputValue,
        placeholder: searchPlaceholder || locale().locale.searchPlaceholder,
        showClear: showSearchClear,
        preventScroll,
        'aria-activedescendant': activeDescendant,
        'aria-autocomplete': 'list',
        'aria-controls': treeId,
        'aria-label': locale().locale.filter,
        onChange: foundation.search,
    });

    // the selected text sits beside the input, which is empty until the user types, so the combobox has no value of its
    // own; the text is exposed as the description
    const triggerSearchProps = $derived<TreeSelectSearchSnippetProps>({
        ...(comboboxAttrs as Partial<TreeSelectSearchSnippetProps>),
        class: `${cls}-inputTrigger`,
        value: view.inputValue,
        placeholder: '',
        showClear: false,
        preventScroll,
        autofocus: searchAutoFocus,
        disabled,
        'aria-autocomplete': 'list',
        'aria-controls': treeId,
        'aria-describedby': joinIds(rest['aria-describedby'], view.inputValue ? undefined : singleSearchTextId),
        onChange: foundation.search,
        onFocus: foundation.handleInputTriggerFocus,
        onBlur: foundation.handleInputTriggerBlur,
    });

    const singleKey = $derived(view.selectedKeys[0]);
    const noData = $derived(view.flattenNodes.length === 0 || (showFilteredOnly && Boolean(view.inputValue) && !view.filteredKeys.size));
    const listClass = $derived([`${treeCls}-option-list`, `${treeCls}-option-list-block`, { [`${treeCls}-option-list-hidden`]: emptyHidden && noData }]);

    // With expandedKeys controlled, a search hit renders without the animated group
    const searchTargetIsDeep = $derived(foundationProps.expandedKeys !== undefined && motionExpand && view.motionKeys.size === 0 && view.filteredKeys.size > 0);

    setTreeContext({
        get treeDisabled() {
            return disabled;
        },
        get multiple() {
            return multiple;
        },
        draggable: false,
        directory: false,
        get expandAction() {
            return expandAction;
        },
        get hasLoadData() {
            return Boolean(loadData);
        },
        get labelEllipsis() {
            return labelEllipsis ?? virtualized;
        },
        dragOverNodeKey: null,
        dropPosition: null,
        onNodeExpand: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeExpand(event, row);
        },
        onNodeSelect: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeSelect(event, row);
        },
        onNodeCheck: (event, row) => {
            keyboard.activate(row.key);
            foundation.handleNodeSelect(event, row);
        },
    });

    const getNodeData = (key: string) => TreeSelectFoundation.getNodeData(key, view.keyEntities, foundationProps) as TreeNodeData | undefined;

    const singleItem = $derived(singleKey === undefined ? undefined : getNodeData(singleKey));

    const triggerSnippetProps = $derived<TreeSelectTriggerSnippetProps>({
        value: selectionKeys.map(getNodeData).filter((node): node is TreeNodeData => Boolean(node)),
        inputValue: view.inputValue,
        placeholder,
        disabled,
        componentProps: { value, multiple, treeData, placeholder, disabled, size } as TreeSelectProps,
        onSearch: foundation.search,
        onClear: (event) => handleClear(event),
        onRemove: foundation.removeTag,
    });

    const labelOf = (item: TreeNodeData): unknown => get(item, keyMaps?.label ?? treeNodeLabelProp, null);

    const singleText = $derived(singleItem ? labelOf(singleItem) : undefined);

    // a number label 0 is text too
    const singleShown = $derived(Boolean(singleItem) && (Boolean(selectedItem) || (singleText != null && singleText !== '')));
    const tagEntries = $derived(selectionKeys.map((key, index) => tagEntry(key, index)).filter((entry): entry is TagEntry => entry !== null));

    const rowProps = (node: FlattenNode) => {
        return buildRowProps(node, view, foundationProps) as TreeRowProps | null;
    };

    // the search box is whatever the `search` snippet renders, so the text field is found by its tag
    const searchField = () => {
        return searchWrapper?.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]');
    };

    const isTagDisabled = (key: string, item: TreeNodeData) => {
        return Boolean(disabled || item[keyMaps?.disabled ?? 'disabled'] || (disableStrictly && view.disabledKeys.has(key)));
    };

    const removeTag = (key: string, event?: TagCloseEvent) => {
        // when the value does not change, the tag must not hide itself
        event?.preventDefault();
        foundation.removeTag(key);
    };

    const tagEntry = (key: string, index: number): TagEntry | null => {
        const item = getNodeData(key);
        if (!item) {
            return null;
        }
        const props: TreeSelectSelectedItemSnippetProps = {
            item,
            index,
            disabled: isTagDisabled(key, item),
            onClose: (event) => removeTag(key, event),
        };
        if (tag || selectedItem) {
            return { key, props };
        }
        const text = labelOf(item);
        return text == null ? null : { key, props, text };
    };

    const handleClear = (event?: MouseEvent | KeyboardEvent) => {
        event?.stopPropagation();
        foundation.handleClear(event ?? null);
    };

    const renderedInputIsCombobox = () => {
        return root?.getAttribute('role') !== 'combobox';
    };

    const handleClearClick = (event: MouseEvent) => {
        handleClear(event);
        if (renderedInputIsCombobox()) {
            (searchField() ?? tagInput)?.focus();
        } else {
            root?.focus();
        }
    };

    // the button's own Enter and Space must not reach the combobox's keydown handler
    const stopOwnKeys = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation();
        }
    };

    const handleTreeKeyDown = (event: KeyboardEvent) => view.isOpen && keyboard.handleKeyDown(event);

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        rest.onkeydown?.(event);
        if (!isInnerControlKey(event) && !handleTreeKeyDown(event)) {
            const wasOpen = view.isOpen;
            foundation.handleSelectionKeyDown(event);
            if (!wasOpen && view.isOpen && (event.key === 'Home' || event.key === 'End')) {
                keyboard.handleKeyDown(event);
            }
        }
        foundation.handleKeyDown(event);
    };

    // The popup is not a DOM descendant of the trigger, so its keys arrive here
    const handleContentKeyDown = (event: KeyboardEvent) => {
        handleTreeKeyDown(event);
        foundation.handleKeyDown(event);
    };

    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleClick(event);
        rest.onclick?.(event);
    };

    // Focus enters the dropdown through its search input or a field in a snippet, and the dropdown is not a DOM
    // descendant of the trigger, so containment is checked against its popup layer
    const isInside = (target: EventTarget | null) => {
        return target instanceof Node && (Boolean(root?.contains(target)) || Boolean(content?.closest('[popover]')?.contains(target)));
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleTriggerFocus(event);
        rest.onfocusin?.(event);
    };

    const handleFocusOut = (event: FocusEvent) => {
        if (!isInside(event.relatedTarget)) {
            foundation.handleFocusLeave(event);
        }
    };

    const handleRootFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        handleFocusOut(event);
        rest.onfocusout?.(event);
    };

    // a press elsewhere on the trigger keeps focus in the search input, which clears its text when it is focused again
    const handleMouseDown = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        if (renderedInputIsCombobox() && !isTextEditor(event.target)) {
            event.preventDefault();
        }
        rest.onmousedown?.(event);
    };

    // a press would focus the popup, which is hidden on close and drops the focus to body; the focus stays on the trigger
    // or the search input. A text field in a snippet still takes the focus.
    const keepFocusOnPress = (event: MouseEvent) => {
        if (!isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    // a key that opens the popup sets the row before the list mounts, so opening scrolls to it again
    const handleOpen = () => {
        foundation.handlePopoverOpen();
        if (keyboard.activeKey !== undefined) {
            reveal(keyboard.activeIndex, keyboard.activeKey);
        }
    };

    $effect.pre(() => {
        if (implied) {
            foundation.syncDerivedState(implied);
        }
    });

    // once the parent passes a value of its own, an earlier echo no longer describes the prop
    watch(
        () => [value, expandedKeys, loadedKeys] as const,
        (current) => {
            // The foundation never saw its own echo as the prop, so clearing the prop back to undefined is no change to
            // it: the selection is emptied here, as handleClear does
            if (current[0] === undefined && echoes.value && echoes.value.value !== undefined) {
                foundation.syncDerivedState({ selectedKeys: [], checkedKeys: new Set(), halfCheckedKeys: new Set(), realCheckedKeys: new Set() });
            }
            (['value', 'expandedKeys', 'loadedKeys'] as const).forEach((name, i) => {
                if (echoes[name] && !isEqual(current[i], echoes[name].value)) {
                    echoes[name] = undefined;
                }
            });
        }
    );

    // The owner may clear the value while the clear button holds focus; the combobox takes it back. A removed node
    // fires no blur, so this runs before the DOM update removes the button.
    $effect.pre(() => {
        if (!clearable && clearButton && clearButton === FocusTrapHandle.getActiveElement(clearButton)) {
            (renderedInputIsCombobox() ? root?.querySelector('input') : root)?.focus({ preventScroll });
        }
    });

    // blur comes from a click outside, so it is listened to while focused, not only while open
    useClickOutside([() => root, () => content], foundation.handleClickOutside, () => view.isOpen || view.isFocus, nestedPopups);

    /** Searches as if `value` were typed, opening the dropdown first; needs `filterTreeNode` */
    export function search(input: string) {
        foundation.search(input);
    }

    export function close() {
        foundation.close();
    }
</script>

{#snippet searchIcon()}
    <IconSearch />
{/snippet}

{#snippet searchBoxContent(props: TreeSelectSearchSnippetProps, withIcon: boolean)}
    {#if searchBox}
        {@render searchBox(props)}
    {:else if withIcon}
        <Input {...props} prefix={searchIcon} />
    {:else}
        <Input {...props} />
    {/if}
{/snippet}

{#snippet tagView(entry: TagEntry, inInput: boolean)}
    {#if tag}
        {@render tag(entry.props)}
    {:else}
        <Tag class={inInput ? [`${cls}-selection-tag`, { [`${cls}-selection-tag-disabled`]: disabled }] : undefined} closable={!entry.props.disabled} color="white" onClose={(event) => entry.props.onClose(event)} size={tagSize} tagKey={entry.key}>
            {#if selectedItem}
                {@render selectedItem(entry.props)}
            {:else}
                {entry.text}
            {/if}
        </Tag>
    {/if}
{/snippet}

{#snippet tagInputTag({ value: key, index }: { value: string; index: number })}
    <!-- close via the TreeSelect only: TagInput's onClose would remove the tag again -->
    {@const entry = tagEntry(key, index)}
    {#if entry}
        {@render tagView(entry, true)}
    {/if}
{/snippet}

{#snippet tagGroupTag({ index }: { index: number })}
    {@const entry = tagEntries[index]}
    {#if entry}
        {@render tagView(entry, false)}
    {/if}
{/snippet}

{#snippet singleText_()}
    {#if !singleShown}
        {placeholder}
    {:else if selectedItem && singleItem}
        {@render selectedItem({ item: singleItem, index: 0, disabled, onClose: handleClear })}
    {:else}
        {singleText}
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
        {#if triggerSearch && multiple}
            <TagInput
                bind:inputValue={() => view.inputValue, () => undefined}
                bind:this={tagInput}
                bind:value={() => selectionKeys, () => undefined}
                {...comboboxAttrs}
                aria-autocomplete="list"
                autofocus={searchAutoFocus}
                {disabled}
                expandRestTagsOnClick={false}
                {maxTagCount}
                onInputChange={foundation.search}
                onRemove={foundation.removeTag}
                {placeholder}
                {preventScroll}
                {restTagsPopoverProps}
                {showRestTagsPopover}
                {size}
                tag={tagInputTag}
            />
        {:else if triggerSearch}
            {#if searchBox !== false}
                <div bind:this={searchWrapper} class={[`${cls}-triggerSingleSearch-wrapper`, { [`${cls}-triggerSingleSearch-upper`]: view.inputTriggerFocus }]}>
                    {@render searchBoxContent(triggerSearchProps, false)}
                </div>
            {/if}
            {#if !view.inputValue}
                <span
                    class={[
                        `${cls}-selection-TriggerSearchItem`,
                        {
                            [`${cls}-selection-TriggerSearchItem-placeholder`]: (view.inputTriggerFocus || !singleShown) && !disabled,
                            [`${cls}-selection-TriggerSearchItem-disabled`]: disabled,
                        },
                    ]}
                    id={singleSearchTextId}
                    onclick={foundation.onClickSingleTriggerSearchItem}
                >
                    {@render singleText_()}
                </span>
            {/if}
        {:else if !multiple || !hasValue}
            <span class={[`${cls}-selection-content`, { [`${cls}-selection-placeholder`]: !singleShown }]}>
                {@render singleText_()}
            </span>
        {:else}
            <TagGroup {maxTagCount} popoverProps={restTagsPopoverProps} showPopover={showRestTagsPopover} size={tagSize} tag={tagGroupTag} tagList={tagEntries.map((entry) => ({ tagKey: entry.key }))} />
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
                      [`${cls}-focus`]: view.isFocus,
                      [`${cls}-disabled`]: disabled,
                      [`${cls}-single`]: !multiple,
                      [`${cls}-multiple`]: multiple,
                      [`${cls}-multiple-tagInput-empty`]: multiple && triggerSearch && view.checkedKeys.size === 0,
                      [`${cls}-multiple-tagInput-notEmpty`]: multiple && triggerSearch && view.checkedKeys.size > 0,
                      [`${cls}-filterable`]: Boolean(filterTreeNode),
                      [`${cls}-error`]: validateStatus === 'error',
                      [`${cls}-warning`]: validateStatus === 'warning',
                      [`${cls}-small`]: size === 'small',
                      [`${cls}-large`]: size === 'large',
                      [`${cls}-with-prefix`]: Boolean(prefix || insetLabel),
                      [`${cls}-with-suffix`]: Boolean(suffix),
                      [`${cls}-triggerTagWrap`]: triggerTagWrap && multiple && triggerSearch,
                  },
              ]}
        tabindex={disabled || inputIsCombobox ? -1 : 0}
        onclick={handleClick}
        onfocusin={handleFocusIn}
        onfocusout={handleRootFocusOut}
        onkeydown={handleKeyDown}
        onmousedown={handleMouseDown}
    >
        {#if trigger}
            {@render trigger(triggerSnippetProps)}
        {:else}
            {@render triggerContent()}
        {/if}
    </div>
{/snippet}

{#snippet panel()}
    <div bind:this={content} class={[dropdownClassName, `${cls}-popover`]} style={dropdownStyle} onfocusin={foundation.handleTriggerFocus} onfocusout={handleFocusOut} onkeydown={handleContentKeyDown} onmousedown={keepFocusOnPress}>
        <div class={`${treeCls}-wrapper`}>
            {#if outerTopSlot}
                {@render outerTopSlot()}
            {:else if filterTreeNode && !triggerSearch && searchBox !== false}
                <div bind:this={searchWrapper} class={`${treeCls}-search-wrapper`}>
                    {@render searchBoxContent(dropdownSearchProps, true)}
                </div>
            {/if}
            {#if noData}
                <!-- the combobox's aria-controls needs an element while there is no tree -->
                <div class={listClass} id={treeId} role="none" style={optionListStyle}>
                    {#if !emptyHidden}
                        <ul class={[`${treeCls}-option`, `${treeCls}-option-empty`]}>
                            <li class={[`${treeCls}-option-label`, `${treeCls}-option-label-empty`]} x-semi-prop="emptyContent">
                                {#if emptyContent}
                                    {@render emptyContent()}
                                {:else}
                                    {treeLocale().locale.emptyText}
                                {/if}
                            </li>
                        </ul>
                    {/if}
                </div>
            {:else}
                <ul id={treeId} {...nameAttrs} aria-multiselectable={multiple} class={listClass} role="tree" style={optionListStyle}>
                    <NodeList bind:this={nodeList} flattenList={view.cachedFlattenNodes as FlattenNode[] | undefined} flattenNodes={view.flattenNodes as FlattenNode[]} motion={motionExpand} motionKeys={view.motionKeys} motionType={view.motionType} {searchTargetIsDeep} {virtualize}>
                        {#snippet children({ node, style })}
                            {@const row = rowProps(node)}
                            {#if row}
                                <TreeNode {expandIcon} focused={row.key === keyboard.activeKey} {fullLabel} {icon} id={nodeId(treeId, row.key)} {label} {row} rowStyle={style} {showLine} />
                            {/if}
                        {/snippet}
                    </NodeList>
                </ul>
            {/if}
            {#if outerBottomSlot}
                {@render outerBottomSlot()}
            {/if}
        </div>
    </div>
{/snippet}

<Popover
    afterClose={foundation.handleAfterClose}
    {autoAdjustOverflow}
    bind:visible={() => states().isOpen, () => undefined}
    child={triggerNode}
    content={panel}
    disableArrowKeyDown
    {motion}
    onOpen={handleOpen}
    position={position ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft')}
    role="presentation"
    {stopPropagation}
    style={dropdownMatchSelectWidth ? 'min-width: var(--semi-tooltip-trigger-width)' : undefined}
    trigger="custom"
/>
