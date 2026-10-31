<script setup lang="ts" generic="T = TreeSelectValue, Multiple extends boolean | undefined = undefined">
    import { computed, onDeactivated, shallowRef, useAttrs, useId, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
    import { get } from 'es-toolkit/compat';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { cssClasses } from '@fibrae/semi-foundation/tree-select/constants';
    import TreeSelectFoundation, { type BasicTreeSelectInnerData, type BasicTreeSelectProps, type TreeSelectAdapter } from '@fibrae/semi-foundation/tree-select/foundation';
    import { buildRowProps, nodeId } from '@fibrae/semi-foundation/tree/shared';
    import { isInnerControlKey, isTextEditor, joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/tree/tree.scss';
    import '@fibrae/semi-foundation/tree-select/tree-select.scss';
    import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-vue';
    import { splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import slotKind from '../_base/slot-kind';
    import slotNodes, { hasSlotContent, type KeyedNode } from '../_base/slot-nodes';
    import useClickOutside from '../_base/use-click-outside';
    import useFocusHandover from '../_base/use-focus-handover';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import Input from '../input';
    import { provideInputGroupContext } from '../input/context';
    import useGroupLooks from '../input/use-group-looks';
    import useLocale from '../locale/use-locale';
    import Popover from '../popover';
    import Tag, { TagGroup, type TagCloseEvent } from '../tag';
    import TagInput from '../tag-input';
    import { useNestedPopups } from '../tooltip/context';
    import { provideTreeContext, type TreeContextValue } from '../tree/context';
    import type { FlattenNode, TreeNodeData, TreeRowProps } from '../tree/interface';
    import NodeList from '../tree/node-list.vue';
    import TreeNode from '../tree/tree-node.vue';
    import useTreeKeyboard from '../tree/use-tree-keyboard';
    import type { TreeSelectChangeNode, TreeSelectChangeValue, TreeSelectEmits, TreeSelectHandle, TreeSelectProps, TreeSelectSearchSlotProps, TreeSelectSelectedItemSlotProps, TreeSelectSlots, TreeSelectTriggerSlotProps, TreeSelectValue } from './interface';

    type FoundationEvent = MouseEvent | KeyboardEvent;
    type Foundation = TreeSelectFoundation<BasicTreeSelectProps, BasicTreeSelectInnerData, FoundationEvent | null>;
    type Adapter = TreeSelectAdapter<BasicTreeSelectProps, BasicTreeSelectInnerData, FoundationEvent | null>;

    /** The built-in Input's handle, or what a `search` slot binds `inputRef` to */
    type Focusable = { focus: (options?: FocusOptions) => void };

    interface TagEntry {
        key: string;
        slotProps: TreeSelectSelectedItemSlotProps;
        /** The tag slot replaces the whole tag */
        whole: boolean;
        nodes?: KeyedNode[];
        text?: unknown;
    }

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TreeSelectProps<T, Multiple> & /* @vue-ignore */ ElementProps<'div', keyof TreeSelectProps<T, Multiple> | EmitHandlers<TreeSelectEmits<T, Multiple>>>>(), {
        modelValue: undefined,
        defaultValue: semiGlobalDefault('TreeSelect', 'defaultValue'),
        // a default other than undefined would break the inference of Multiple, so the global config cannot set it
        multiple: undefined,
        treeData: () => semiDefault('TreeSelect', 'treeData', []),
        keyMaps: semiGlobalDefault('TreeSelect', 'keyMaps'),
        treeNodeLabelProp: () => semiDefault('TreeSelect', 'treeNodeLabelProp', 'label'),

        treeNodeFilterProp: () => semiDefault('TreeSelect', 'treeNodeFilterProp', 'label'),
        filterTreeNode: undefined,
        showFilteredOnly: () => semiDefault('TreeSelect', 'showFilteredOnly', false),
        searchPosition: () => semiDefault('TreeSelect', 'searchPosition', 'dropdown'),
        searchPlaceholder: semiGlobalDefault('TreeSelect', 'searchPlaceholder'),
        searchAutoFocus: () => semiDefault('TreeSelect', 'searchAutoFocus', false),
        showSearchClear: () => semiDefault('TreeSelect', 'showSearchClear', true),
        remote: () => semiDefault('TreeSelect', 'remote', false),

        expandAll: () => semiDefault('TreeSelect', 'expandAll', false),
        defaultExpandAll: () => semiDefault('TreeSelect', 'defaultExpandAll', false),
        defaultExpandedKeys: semiGlobalDefault('TreeSelect', 'defaultExpandedKeys'),
        expandedKeys: semiGlobalDefault('TreeSelect', 'expandedKeys'),
        autoExpandParent: () => semiDefault('TreeSelect', 'autoExpandParent', false),
        expandAction: () => semiDefault('TreeSelect', 'expandAction', false),
        motionExpand: () => semiDefault('TreeSelect', 'motionExpand', true),
        loadData: undefined,
        loadedKeys: semiGlobalDefault('TreeSelect', 'loadedKeys'),
        leafOnly: () => semiDefault('TreeSelect', 'leafOnly', false),
        checkRelation: () => semiDefault('TreeSelect', 'checkRelation', 'related'),
        disableStrictly: () => semiDefault('TreeSelect', 'disableStrictly', false),
        autoMergeValue: () => semiDefault('TreeSelect', 'autoMergeValue', true),
        changeWithObject: () => semiDefault('TreeSelect', 'changeWithObject', false),

        maxTagCount: semiGlobalDefault('TreeSelect', 'maxTagCount'),
        showRestTagsPopover: () => semiDefault('TreeSelect', 'showRestTagsPopover', false),
        restTagsPopoverProps: semiGlobalDefault('TreeSelect', 'restTagsPopoverProps'),
        labelEllipsis: semiGlobalDefault('TreeSelect', 'labelEllipsis'),
        showLine: () => semiDefault('TreeSelect', 'showLine', false),
        virtualize: semiGlobalDefault('TreeSelect', 'virtualize'),
        placeholder: semiGlobalDefault('TreeSelect', 'placeholder'),
        // size and disabled resolve own value -> InputGroup -> global default in useGroupLooks
        disabled: undefined,
        size: undefined,
        borderless: () => semiDefault('TreeSelect', 'borderless', false),
        validateStatus: semiGlobalDefault('TreeSelect', 'validateStatus'),
        // A global id would repeat on every instance.
        insetLabelId: undefined,
        showClear: () => semiDefault('TreeSelect', 'showClear', false),

        clickToHide: () => semiDefault('TreeSelect', 'clickToHide', true),
        clickTriggerToHide: () => semiDefault('TreeSelect', 'clickTriggerToHide', true),
        defaultOpen: () => semiDefault('TreeSelect', 'defaultOpen', false),
        motion: () => semiDefault('TreeSelect', 'motion', true),
        autoAdjustOverflow: () => semiDefault('TreeSelect', 'autoAdjustOverflow', true),
        position: semiGlobalDefault('TreeSelect', 'position'),
        stopPropagation: () => semiDefault('TreeSelect', 'stopPropagation', true),
        dropdownClassName: semiGlobalDefault('TreeSelect', 'dropdownClassName'),
        dropdownStyle: semiGlobalDefault('TreeSelect', 'dropdownStyle'),
        dropdownMatchSelectWidth: () => semiDefault('TreeSelect', 'dropdownMatchSelectWidth', true),
        optionListStyle: semiGlobalDefault('TreeSelect', 'optionListStyle'),
        preventScroll: semiGlobalDefault('TreeSelect', 'preventScroll'),
        triggerTagWrap: () => semiDefault('TreeSelect', 'triggerTagWrap', false),
    });

    const emit = defineEmits<TreeSelectEmits<T, Multiple>>();
    const slots = defineSlots<TreeSelectSlots<T, Multiple>>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const config = useConfig();
    const locale = useLocale('TreeSelect');
    const treeLocale = useLocale('Tree');

    const treeId = useId();
    const singleSearchTextId = useId();
    const insetLabelFallbackId = useId();
    const content = useTemplateRef('content');
    const nodeList = useTemplateRef('nodeList');

    // refs inside the v-for are arrays; annotated because the adapter's isInTrigger reads it, so inference is circular (TS7022)
    const triggers = useTemplateRef<HTMLDivElement[]>('trigger');
    const tagInputs = useTemplateRef('tagInput');

    // A function ref: the `search` slot hands it to the consumer's Input as `inputRef`, which a string ref cannot be
    const searchInput = shallowRef<Focusable | null>(null);
    const comboboxKeys = new Set(['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-required']);

    const looks = useGroupLooks('TreeSelect', props, { size: 'default', disabled: false });

    const prefix = cssClasses.PREFIX;
    const prefixTree = cssClasses.PREFIX_TREE;

    // The generic Multiple has no runtime type, so Vue does not cast a valueless `multiple` to true: it arrives as ''
    const multiple = computed(() => (props.multiple as unknown) === '' || Boolean(props.multiple));
    const loadData = computed(() => props.loadData ?? readSemiDefault(semi, 'TreeSelect', 'loadData'));
    const filterTreeNode = computed(() => props.filterTreeNode ?? readSemiDefault(semi, 'TreeSelect', 'filterTreeNode', false));
    const virtualized = computed(() => Boolean(props.virtualize && Object.keys(props.virtualize).length));
    const triggerSearch = computed(() => Boolean(filterTreeNode.value) && props.searchPosition === 'trigger');

    // the Input and TagInput inside are parts of this control, not members of the group
    provideInputGroupContext(undefined);

    const setSearchInput = (element: Element | ComponentPublicInstance | null) => {
        searchInput.value = element as Focusable | null;
    };

    const rows = () => view.value.flattenNodes as FlattenNode[];

    const cachedRows = () => view.value.cachedFlattenNodes as FlattenNode[] | undefined;

    const rowProps = (node: FlattenNode) => buildRowProps(node, view.value as Parameters<typeof buildRowProps>[1], props) as TreeRowProps | null;

    const reveal = (index: number, key: string) => {
        if (!nodeList.value?.scrollToItem(index)) {
            // inside the dropdown, not the document: one in a ShadowRoot is out of document.getElementById's reach
            content.value?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
        }
    };

    const {
        keyboardKey,
        activeIndex,
        activeKey,
        handleKeyDown: handleRowKeyDown,
    } = useTreeKeyboard({
        rows,
        // an APG combobox opens without an active option
        defaultIndex: () => -1,
        rowProps,
        hasLoadData: () => Boolean(loadData.value),
        rtl: () => config.value.direction === 'rtl',
        editing: (event) => isTextEditor(event.target),
        select: (event, row) => foundation.handleNodeSelect(event, row),
        expand: (event, row) => foundation.handleNodeExpand(event, row),
        reveal,
    });

    const { foundation, state } = useFoundation<Foundation, Adapter, BasicTreeSelectProps, BasicTreeSelectInnerData>(
        TreeSelectFoundation,
        // The value type T is an unconstrained generic, so TS cannot prove it fits the foundation's BasicValue
        props as unknown as Readonly<Partial<BasicTreeSelectProps>>,
        (foundationProps) => TreeSelectFoundation.getInitialState(foundationProps),
        (base) => ({
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateState: (states) => base.setState(states as BasicTreeSelectInnerData),
            notifySelect: (selectedKey, selected, node) => emit('select', selectedKey, selected, node as TreeNodeData),
            notifySearch: (input, filteredExpandedKeys, filteredNodes) => emit('search', input, filteredExpandedKeys, filteredNodes as TreeNodeData[]),
            setCachedFlattenNodes: (cachedFlattenNodes) => base.setState({ cachedFlattenNodes }),
            notifyLoad: (loadedKeys, node) => {
                emit('update:loadedKeys', [...loadedKeys]);
                emit('load', loadedKeys, node as TreeNodeData);
            },
            notifyClear: (event) => emit('clear', event as FoundationEvent | null),
            openMenu: () => base.setState({ isOpen: true }),
            closeMenu: () => {
                keyboardKey.value = null;
                base.setState({ isOpen: false });
            },
            notifyVisibleChange: (visible) => emit('dropdownVisibleChange', visible),
            notifyChange: (value, node, event) => {
                const changed = value as TreeSelectChangeValue<T, Multiple>;
                emit('update:modelValue', changed);
                emit('change', changed, node as TreeSelectChangeNode<Multiple>, event as FoundationEvent | null);
            },
            notifyChangeWithObject: (node, event) => {
                emit('update:modelValue', node as TreeSelectChangeValue<T, Multiple>);
                emit('change', node as TreeSelectChangeValue<T, Multiple>, node as TreeSelectChangeNode<Multiple>, event as FoundationEvent | null);
            },
            notifyExpand: (expandedKeys, { expanded, node }) => {
                emit('update:expandedKeys', [...expandedKeys]);
                emit('expand', [...expandedKeys], { expanded, node: node as TreeNodeData });
            },
            notifyFocus: (event) => emit('focus', event),
            notifyBlur: (event) => emit('blur', event as FoundationEvent | FocusEvent),
            focusInput: () => {
                searchInput.value?.focus({ preventScroll: props.preventScroll });
                tagInputs.value?.[0]?.focus();
            },
            focusTrigger: () => {
                const trigger = triggers.value?.[0];
                if (trigger?.getAttribute('role') === 'combobox') {
                    trigger.focus();
                } else {
                    (searchInput.value ?? tagInputs.value?.[0])?.focus();
                }
            },
            updateIsFocus: (isFocus) => base.setState({ isFocus }),
            isInTrigger: (node) => node instanceof Node && Boolean(triggers.value?.[0]?.contains(node)),
        }),
        {
            props: {
                size: () => looks.size,
                disabled: () => looks.disabled,
                value: () => props.modelValue as BasicTreeSelectProps['value'],
                onChangeWithObject: () => props.changeWithObject,
                multiple: () => multiple.value,
                loadData: () => loadData.value as BasicTreeSelectProps['loadData'],
                filterTreeNode: () => filterTreeNode.value as BasicTreeSelectProps['filterTreeNode'],
            },
        }
    );

    // State implied by new props renders with them; the pre-flush watcher writes it back for the handlers before the
    // render. treeData is compared by the foundation, so only a new array is seen.
    const foundationProps = computed(() => foundation.getProps());
    const derived = computed(() => TreeSelectFoundation.deriveState(foundationProps.value, state.value));
    const view = computed(() => (derived.value ? { ...state.value, ...derived.value } : state.value));

    const context: TreeContextValue = {
        view: computed(() => ({
            treeDisabled: looks.disabled,
            multiple: multiple.value,
            draggable: false,
            directory: false,
            expandAction: props.expandAction,
            hasLoadData: Boolean(loadData.value),
            labelEllipsis: props.labelEllipsis ?? virtualized.value,
            dragOverNodeKey: null,
            dropPosition: null,
        })),
        onNodeExpand: (event, row) => {
            keyboardKey.value = row.key;
            foundation.handleNodeExpand(event, row);
        },
        onNodeSelect: (event, row) => {
            keyboardKey.value = row.key;
            foundation.handleNodeSelect(event, row);
        },
        onNodeCheck: (event, row) => {
            keyboardKey.value = row.key;
            foundation.handleNodeSelect(event, row);
        },
    };

    const selectionKeys = computed(() => TreeSelectFoundation.getTriggerKeys(foundationProps.value, view.value));
    const hasValue = computed(() => TreeSelectFoundation.hasValue(foundationProps.value, view.value));
    const clearable = computed(() => props.showClear && (hasValue.value || (props.searchPosition === 'trigger' && Boolean(view.value.inputValue))) && !looks.disabled);

    provideTreeContext(context);

    const handleTreeKeyDown = (event: KeyboardEvent) => view.value.isOpen && handleRowKeyDown(event);

    const activeDescendant = () => (activeKey.value === undefined ? undefined : nodeId(treeId, activeKey.value));

    const search = (value: string) => foundation.search(value);

    const getNodeData = (key: string) => TreeSelectFoundation.getNodeData(key, view.value.keyEntities, foundationProps.value) as TreeNodeData | undefined;

    const labelOf = (item: TreeNodeData): unknown => get(item, props.keyMaps?.label ?? props.treeNodeLabelProp, null);

    const isComboboxKey = (key: string) => comboboxKeys.has(key);

    // A rendered inset label names the combobox and the tree, so it needs an id even without insetLabelId
    const insetLabelShown = () => !slots.trigger && !slotKind(slots.prefix) && Boolean(slotKind(slots.insetLabel));

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? insetLabelFallbackId : undefined);

    // The tree binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const nameAttrs = () => comboboxName(attrs['aria-labelledby'] as string | undefined, attrs['aria-label'] as string | undefined, insetLabelShown() ? prefixId() : undefined, locale.value.locale.label);

    const comboboxAttrs = () => ({
        ...splitControlAttrs(attrs, isComboboxKey).control,
        role: 'combobox' as const,
        'aria-activedescendant': activeDescendant(),
        'aria-controls': treeId,
        'aria-expanded': view.value.isOpen,
        'aria-haspopup': 'tree' as const,
        ...nameAttrs(),
    });

    const kinds = () => ({
        prefix: slotKind(slots.prefix),
        insetLabel: slotKind(slots.insetLabel),
        suffix: slotKind(slots.suffix),
    });

    const searchSlotProps = (): TreeSelectSearchSlotProps => {
        const base = {
            inputRef: setSearchInput,
            modelValue: view.value.inputValue,
            preventScroll: props.preventScroll,
            onChange: search,
        };
        if (!triggerSearch.value) {
            return {
                ...base,
                class: `${prefixTree}-input`,
                placeholder: props.searchPlaceholder || locale.value.locale.searchPlaceholder,
                showClear: props.showSearchClear,
                'aria-activedescendant': activeDescendant(),
                'aria-autocomplete': 'list',
                'aria-controls': treeId,
                'aria-label': locale.value.locale.filter,
            };
        }
        return {
            ...base,
            ...(comboboxAttrs() as Partial<TreeSelectSearchSlotProps>),
            'aria-autocomplete': 'list',
            'aria-controls': treeId,
            // the selected text sits beside the input, which is empty until the user types, so the combobox has no
            // value of its own; the text is exposed as the description
            'aria-describedby': joinIds(attrs['aria-describedby'], view.value.inputValue ? undefined : singleSearchTextId),
            class: `${prefix}-inputTrigger`,
            placeholder: '',
            showClear: false,
            autofocus: props.searchAutoFocus,
            disabled: looks.disabled,
            onFocus: foundation.handleInputTriggerFocus,
            onBlur: foundation.handleInputTriggerBlur,
        };
    };

    const inputBindings = () => {
        const { inputRef: _inputRef, ...bindings } = searchSlotProps();
        return bindings;
    };

    const searchNodes = (): KeyedNode[] | null => {
        if (!slots.search) {
            return null;
        }
        const nodes = slots.search(searchSlotProps());
        return hasSlotContent(() => nodes) ? slotNodes(nodes) : [];
    };

    const triggerParts = () => {
        const customTrigger = Boolean(slots.trigger);
        const nodes = triggerSearch.value && !multiple.value && !customTrigger ? searchNodes() : null;
        return {
            trigger: customTrigger ? triggerSlotProps() : undefined,
            kinds: kinds(),
            searchNodes: nodes,
            // ARIA 1.2: a search input on the trigger is the combobox; otherwise the trigger is a select-only combobox.
            // An empty search slot leaves the single mode without an input, and a trigger slot replaces it
            inputIsCombobox: triggerSearch.value && !customTrigger && (multiple.value || nodes?.length !== 0),
        };
    };

    const renderedInputIsCombobox = () => triggers.value?.[0]?.getAttribute('role') !== 'combobox';

    const rootAttrs = (inputIsCombobox: boolean) => ({
        ...splitControlAttrs(attrs, isComboboxKey).root,
        ...(inputIsCombobox ? {} : { ...comboboxAttrs(), 'aria-disabled': looks.disabled }),
    });

    const rootClass = (k: ReturnType<typeof kinds>) =>
        slots.trigger
            ? []
            : [
                  prefix,
                  {
                      [`${prefix}-borderless`]: props.borderless,
                      [`${prefix}-focus`]: view.value.isFocus,
                      [`${prefix}-disabled`]: looks.disabled,
                      [`${prefix}-single`]: !multiple.value,
                      [`${prefix}-multiple`]: multiple.value,
                      [`${prefix}-multiple-tagInput-empty`]: multiple.value && triggerSearch.value && view.value.checkedKeys.size === 0,
                      [`${prefix}-multiple-tagInput-notEmpty`]: multiple.value && triggerSearch.value && view.value.checkedKeys.size > 0,
                      [`${prefix}-filterable`]: Boolean(filterTreeNode.value),
                      [`${prefix}-error`]: props.validateStatus === 'error',
                      [`${prefix}-warning`]: props.validateStatus === 'warning',
                      [`${prefix}-small`]: looks.size === 'small',
                      [`${prefix}-large`]: looks.size === 'large',
                      [`${prefix}-with-prefix`]: Boolean(k.prefix || k.insetLabel),
                      [`${prefix}-with-suffix`]: Boolean(k.suffix),
                      [`${prefix}-triggerTagWrap`]: props.triggerTagWrap && multiple.value && triggerSearch.value,
                  },
              ];

    const singleContent = (): { shown: boolean; nodes?: KeyedNode[]; text?: unknown } => {
        const [key] = view.value.selectedKeys;
        const item = key === undefined ? undefined : getNodeData(key);
        if (!item) {
            return { shown: false };
        }
        if (slots.selectedItem) {
            const nodes = slots.selectedItem({
                item,
                index: 0,
                disabled: looks.disabled,
                onClose: (event) => handleClear(event),
            });
            return { shown: hasSlotContent(() => nodes), nodes: slotNodes(nodes) };
        }
        const text = labelOf(item);
        // a number label 0 is text too
        return { shown: text != null && text !== '', text };
    };

    const tagSize = () => (looks.size === 'small' ? 'small' : 'large');

    const isTagDisabled = (key: string, item: TreeNodeData) => Boolean(looks.disabled || item[props.keyMaps?.disabled ?? 'disabled'] || (props.disableStrictly && view.value.disabledKeys.has(key)));

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
        const slotProps: TreeSelectSelectedItemSlotProps = {
            item,
            index,
            disabled: isTagDisabled(key, item),
            onClose: (event) => removeTag(key, event),
        };
        const slot = slots.tag ?? slots.selectedItem;
        if (slot) {
            const nodes = slot(slotProps);
            return hasSlotContent(() => nodes) ? { key, slotProps, whole: Boolean(slots.tag), nodes: slotNodes(nodes) } : null;
        }
        const text = labelOf(item);
        return text == null ? null : { key, slotProps, whole: false, text };
    };

    const tagEntries = () => selectionKeys.value.map((key, index) => tagEntry(key, index)).filter((entry): entry is TagEntry => entry !== null);

    const triggerSlotProps = (): TreeSelectTriggerSlotProps<T, Multiple> => ({
        value: selectionKeys.value.map(getNodeData).filter((node): node is TreeNodeData => Boolean(node)),
        inputValue: view.value.inputValue,
        placeholder: props.placeholder,
        disabled: looks.disabled,
        componentProps: { ...props, ...looks } as TreeSelectProps<T, Multiple>,
        onSearch: search,
        onClear: (event) => handleClear(event),
        onRemove: foundation.removeTag,
    });

    const handleClear = (event?: MouseEvent | KeyboardEvent) => {
        event?.stopPropagation();
        foundation.handleClear(event ?? null);
    };

    const handleClearClick = (event: MouseEvent) => {
        handleClear(event);
        if (renderedInputIsCombobox()) {
            (searchInput.value ?? tagInputs.value?.[0])?.focus();
        } else {
            triggers.value?.[0]?.focus();
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        emit('keydown', event);
        if (!isInnerControlKey(event) && !handleTreeKeyDown(event)) {
            const wasOpen = view.value.isOpen;
            foundation.handleSelectionKeyDown(event);
            if (!wasOpen && view.value.isOpen && (event.key === 'Home' || event.key === 'End')) {
                handleRowKeyDown(event);
            }
        }
        foundation.handleKeyDown(event);
    };

    // The popup is not a DOM descendant of the trigger, so its keys arrive here
    const handleContentKeyDown = (event: KeyboardEvent) => {
        handleTreeKeyDown(event);
        foundation.handleKeyDown(event);
    };

    // Focus enters the dropdown through its search input or a field in a slot, and the dropdown is not a DOM descendant
    // of the trigger, so containment is checked against its popup layer
    const isInside = (target: EventTarget | null) => target instanceof Node && (Boolean(triggers.value?.[0]?.contains(target)) || Boolean(content.value?.closest('[popover]')?.contains(target)));

    const handleFocusOut = (event: FocusEvent) => {
        if (!isInside(event.relatedTarget)) {
            foundation.handleFocusLeave(event);
        }
    };

    // a press elsewhere on the trigger keeps focus in the search input, which clears its text when it is focused again
    const handleMouseDown = (event: MouseEvent) => {
        if (renderedInputIsCombobox() && !isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    // a press would focus the popup, which is hidden on close and drops the focus to body; the focus stays on the trigger
    // or the search input. A text field in a slot still takes the focus.
    const keepFocusOnPress = (event: MouseEvent) => {
        if (!isTextEditor(event.target)) {
            event.preventDefault();
        }
    };

    // a key that opens the popup sets the row before the list mounts, so opening scrolls to it again
    const handleOpen = () => {
        foundation.handlePopoverOpen();
        if (activeKey.value !== undefined) {
            reveal(activeIndex.value, activeKey.value);
        }
    };

    const noData = () => {
        const { inputValue, filteredKeys } = view.value;
        return rows().length === 0 || (props.showFilteredOnly && Boolean(inputValue) && !filteredKeys.size);
    };

    const emptyHidden = () => Boolean(slots.emptyContent) && !hasSlotContent(slots.emptyContent);

    const listClass = () => [`${prefixTree}-option-list`, `${prefixTree}-option-list-block`, { [`${prefixTree}-option-list-hidden`]: emptyHidden() && noData() }];

    // With expandedKeys controlled, a search hit renders without the animated group
    const searchTargetIsDeep = () => props.expandedKeys !== undefined && props.motionExpand && view.value.motionKeys.size === 0 && view.value.filteredKeys.size > 0;

    watch(derived, (value) => {
        if (value) {
            foundation.syncDerivedState(value);
        }
    });

    // blur comes from a click outside, so it is listened to while focused, not only while open
    useClickOutside([() => triggers.value?.[0], content], foundation.handleClickOutside, () => view.value.isOpen || view.value.isFocus, useNestedPopups());

    // A cached KeepAlive subtree would keep the dropdown open; close() neither blurs nor moves focus
    onDeactivated(() => {
        if (state.value.isOpen) {
            foundation.close();
        }
    });

    // the owner may clear the value while the clear button holds focus; the combobox takes it back
    const clearHandover = useFocusHandover(() => (renderedInputIsCombobox() ? triggers.value?.[0]?.querySelector('input') : triggers.value?.[0]));

    defineExpose<TreeSelectHandle>({
        search: foundation.search,
        close: foundation.close,
    });
</script>

<template>
    <Popover
        :autoAdjustOverflow="props.autoAdjustOverflow"
        :motion="props.motion"
        :position="props.position ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft')"
        role="presentation"
        :stopPropagation="props.stopPropagation"
        :style="props.dropdownMatchSelectWidth ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined"
        trigger="custom"
        :visible="view.isOpen"
        @afterClose="foundation.handleAfterClose"
        @open="handleOpen"
    >
        <template v-for="(parts, p) in [triggerParts()]" :key="p">
            <div ref="trigger" v-bind="rootAttrs(parts.inputIsCombobox)" :class="rootClass(parts.kinds)" :tabindex="looks.disabled || parts.inputIsCombobox ? -1 : 0" @click="foundation.handleClick" @focusin="foundation.handleTriggerFocus" @focusout="handleFocusOut" @keydown="handleKeyDown" @mousedown="handleMouseDown">
                <slot
                    v-if="parts.trigger"
                    :componentProps="parts.trigger.componentProps"
                    :disabled="parts.trigger.disabled"
                    :inputValue="parts.trigger.inputValue"
                    name="trigger"
                    :onClear="parts.trigger.onClear"
                    :onRemove="parts.trigger.onRemove"
                    :onSearch="parts.trigger.onSearch"
                    :placeholder="parts.trigger.placeholder"
                    :value="parts.trigger.value"
                />
                <template v-else>
                    <div
                        v-if="parts.kinds.prefix || parts.kinds.insetLabel"
                        :id="prefixId()"
                        :class="[`${prefix}-prefix`, { [`${prefix}-inset-label`]: Boolean(parts.kinds.insetLabel), [`${prefix}-prefix-text`]: (parts.kinds.prefix ?? parts.kinds.insetLabel) === 'text', [`${prefix}-prefix-icon`]: (parts.kinds.prefix ?? parts.kinds.insetLabel) === 'icon' }]"
                        x-semi-prop="prefix,insetLabel"
                    >
                        <slot v-if="parts.kinds.prefix" name="prefix" />
                        <slot v-else name="insetLabel" />
                    </div>
                    <div :class="`${prefix}-selection`">
                        <TagInput
                            v-if="triggerSearch && multiple"
                            ref="tagInput"
                            v-bind="comboboxAttrs()"
                            aria-autocomplete="list"
                            :autofocus="props.searchAutoFocus"
                            :disabled="looks.disabled"
                            :expandRestTagsOnClick="false"
                            :inputValue="view.inputValue"
                            :maxTagCount="props.maxTagCount"
                            :modelValue="selectionKeys"
                            :placeholder="props.placeholder"
                            :preventScroll="props.preventScroll"
                            :restTagsPopoverProps="props.restTagsPopoverProps"
                            :showRestTagsPopover="props.showRestTagsPopover"
                            :size="looks.size"
                            @inputChange="search($event)"
                            @remove="foundation.removeTag"
                        >
                            <template #tag="{ value: key, index }">
                                <!-- close via the TreeSelect only: TagInput's onClose would remove the tag again -->
                                <template v-for="(entry, e) in [tagEntry(key, index)]" :key="e">
                                    <template v-if="entry && entry.whole">
                                        <component :is="node" v-for="[node, nodeKey] in entry.nodes" :key="nodeKey" />
                                    </template>
                                    <Tag v-else-if="entry" :class="[`${prefix}-selection-tag`, { [`${prefix}-selection-tag-disabled`]: looks.disabled }]" :closable="!entry.slotProps.disabled" color="white" :size="tagSize()" :tagKey="key" @close="entry.slotProps.onClose($event)">
                                        <template v-if="entry.nodes">
                                            <component :is="node" v-for="[node, nodeKey] in entry.nodes" :key="nodeKey" />
                                        </template>
                                        <template v-else>{{ entry.text }}</template>
                                    </Tag>
                                </template>
                            </template>
                        </TagInput>
                        <template v-else-if="triggerSearch">
                            <div v-if="!parts.searchNodes || parts.searchNodes.length" :class="[`${prefix}-triggerSingleSearch-wrapper`, { [`${prefix}-triggerSingleSearch-upper`]: view.inputTriggerFocus }]">
                                <template v-if="parts.searchNodes">
                                    <component :is="node" v-for="[node, key] in parts.searchNodes" :key="key" />
                                </template>
                                <Input v-else :ref="setSearchInput" v-bind="inputBindings()" />
                            </div>
                            <template v-for="(single, s) in view.inputValue ? [] : [singleContent()]" :key="s">
                                <span
                                    :id="singleSearchTextId"
                                    :class="[`${prefix}-selection-TriggerSearchItem`, { [`${prefix}-selection-TriggerSearchItem-placeholder`]: (view.inputTriggerFocus || !single.shown) && !looks.disabled, [`${prefix}-selection-TriggerSearchItem-disabled`]: looks.disabled }]"
                                    @click="foundation.onClickSingleTriggerSearchItem"
                                >
                                    <template v-if="!single.shown">{{ props.placeholder }}</template>
                                    <template v-else-if="single.nodes">
                                        <component :is="node" v-for="[node, key] in single.nodes" :key="key" />
                                    </template>
                                    <template v-else>{{ single.text }}</template>
                                </span>
                            </template>
                        </template>
                        <template v-for="(single, s) in [singleContent()]" v-else-if="!multiple || !hasValue" :key="s">
                            <span :class="[`${prefix}-selection-content`, { [`${prefix}-selection-placeholder`]: !single.shown }]">
                                <template v-if="!single.shown">{{ props.placeholder }}</template>
                                <template v-else-if="single.nodes">
                                    <component :is="node" v-for="[node, key] in single.nodes" :key="key" />
                                </template>
                                <template v-else>{{ single.text }}</template>
                            </span>
                        </template>
                        <template v-for="(entries, e) in [tagEntries()]" v-else :key="e">
                            <TagGroup :maxTagCount="props.maxTagCount" :popoverProps="props.restTagsPopoverProps" :showPopover="props.showRestTagsPopover" :size="tagSize()" :tagList="entries.map((entry) => ({ tagKey: entry.key }))">
                                <template #tag="{ index }">
                                    <template v-for="entry in [entries[index]]" :key="entry.key">
                                        <template v-if="entry.whole">
                                            <component :is="node" v-for="[node, nodeKey] in entry.nodes" :key="nodeKey" />
                                        </template>
                                        <Tag v-else :closable="!entry.slotProps.disabled" color="white" :size="tagSize()" :tagKey="entry.key" @close="entry.slotProps.onClose($event)">
                                            <template v-if="entry.nodes">
                                                <component :is="node" v-for="[node, nodeKey] in entry.nodes" :key="nodeKey" />
                                            </template>
                                            <template v-else>{{ entry.text }}</template>
                                        </Tag>
                                    </template>
                                </template>
                            </TagGroup>
                        </template>
                    </div>
                    <div v-if="parts.kinds.suffix" :class="[`${prefix}-suffix`, { [`${prefix}-suffix-text`]: parts.kinds.suffix === 'text', [`${prefix}-suffix-icon`]: parts.kinds.suffix === 'icon' }]" x-semi-prop="suffix">
                        <slot name="suffix" />
                    </div>
                    <!-- .stop keeps the button's own Enter and Space from the owner's keydown listeners on the combobox -->
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
        </template>
        <template #content>
            <div ref="content" :class="[props.dropdownClassName, `${prefix}-popover`]" :style="props.dropdownStyle" @focusin="foundation.handleTriggerFocus" @focusout="handleFocusOut" @keydown="handleContentKeyDown" @mousedown="keepFocusOnPress">
                <div :class="`${prefixTree}-wrapper`">
                    <slot name="outerTopSlot" />
                    <template v-if="!$slots.outerTopSlot && filterTreeNode && !triggerSearch">
                        <template v-for="(nodes, n) in [searchNodes()]" :key="n">
                            <div v-if="!nodes || nodes.length" :class="`${prefixTree}-search-wrapper`">
                                <template v-if="nodes">
                                    <component :is="node" v-for="[node, key] in nodes" :key="key" />
                                </template>
                                <Input v-else :ref="setSearchInput" v-bind="inputBindings()">
                                    <template #prefix>
                                        <IconSearch />
                                    </template>
                                </Input>
                            </div>
                        </template>
                    </template>
                    <!-- the combobox's aria-controls needs an element while there is no tree -->
                    <div v-if="noData()" :id="treeId" :class="listClass()" role="none" :style="props.optionListStyle">
                        <ul v-if="!emptyHidden()" :class="[`${prefixTree}-option`, `${prefixTree}-option-empty`]">
                            <li :class="[`${prefixTree}-option-label`, `${prefixTree}-option-label-empty`]" x-semi-prop="emptyContent">
                                <slot name="emptyContent">{{ treeLocale.locale.emptyText }}</slot>
                            </li>
                        </ul>
                    </div>
                    <ul v-else :id="treeId" v-bind="nameAttrs()" :aria-multiselectable="multiple" :class="listClass()" role="tree" :style="props.optionListStyle">
                        <NodeList ref="nodeList" :flattenList="cachedRows()" :flattenNodes="rows()" :motion="props.motionExpand" :motionKeys="view.motionKeys" :motionType="view.motionType" :searchTargetIsDeep="searchTargetIsDeep()" :virtualize="props.virtualize">
                            <template #default="{ node, style }">
                                <template v-for="(row, r) in [rowProps(node)]" :key="r">
                                    <TreeNode v-if="row" :id="nodeId(treeId, row.key)" :focused="row.key === activeKey" :row="row" :rowStyle="style" :showLine="props.showLine">
                                        <template v-if="$slots.label" #label="p">
                                            <slot :item="p.item" :label="p.label" name="label" :searchWord="p.searchWord" />
                                        </template>
                                        <template v-if="$slots.icon" #icon="p">
                                            <slot :checked="p.checked" :expanded="p.expanded" :halfChecked="p.halfChecked" :isLeaf="p.isLeaf" :item="p.item" :level="p.level" :loading="p.loading" name="icon" :selected="p.selected" />
                                        </template>
                                        <template v-if="$slots.expandIcon" #expandIcon="p">
                                            <slot :class="p.class" :expanded="p.expanded" name="expandIcon" :onClick="p.onClick" />
                                        </template>
                                        <template v-if="$slots.fullLabel" #fullLabel="p">
                                            <slot
                                                :checkStatus="p.checkStatus"
                                                :class="p.class"
                                                :data="p.data"
                                                :expandIcon="p.expandIcon"
                                                :expandStatus="p.expandStatus"
                                                :filtered="p.filtered"
                                                :level="p.level"
                                                name="fullLabel"
                                                :onCheck="p.onCheck"
                                                :onClick="p.onClick"
                                                :onContextmenu="p.onContextmenu"
                                                :onDblclick="p.onDblclick"
                                                :onExpand="p.onExpand"
                                                :searchWord="p.searchWord"
                                            />
                                        </template>
                                    </TreeNode>
                                </template>
                            </template>
                        </NodeList>
                    </ul>
                    <slot name="outerBottomSlot" />
                </div>
            </div>
        </template>
    </Popover>
</template>
