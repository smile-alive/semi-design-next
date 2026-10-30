import React, { Fragment, useDeferredValue, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
// compat get: the label prop name comes from keyMaps/treeNodeLabelProp and is resolved as a path
import { get } from 'es-toolkit/compat';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { cssClasses, strings } from '@fibrae/semi-foundation/tree-select/constants';
import TreeSelectFoundation, { type Size, type BasicTriggerRenderProps, type BasicTreeSelectProps, type BasicTreeSelectInnerData, type TreeSelectAdapter } from '@fibrae/semi-foundation/tree-select/foundation';
import { buildRowProps, nodeId } from '@fibrae/semi-foundation/tree/shared';
import { getValueOrKey, normalizeKeyList } from '@fibrae/semi-foundation/tree/tree-util';
import { isInnerControlKey, isTextEditor, joinIds, stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/tree/tree.scss';
import '@fibrae/semi-foundation/tree-select/tree-select.scss';
import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-react';
import type { Bivariant, ByMultiple, ElementProps } from '../_base/base';
import type { ValidateStatus } from '../_base/base-component';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import VirtualList, { type VirtualListHandle } from '../_base/virtual-list';
import { hasContent, renderTriggerPrefix, renderTriggerSuffix } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import { InputGroupContext, useInputGroupInScope, withInputGroup } from '../input/context';
import Input, { type InputProps, type InputHandle } from '../input/index';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverProps } from '../popover/index';
import VirtualRow from '../select/virtual-row';
import TagInput, { type TagInputHandle } from '../tag-input';
import TagGroup from '../tag/group';
import Tag, { type TagProps } from '../tag/index';
import AutoSizer from '../tree/auto-sizer';
import type { TreeProps, TreeState, FlattenNode, TreeNodeData, TreeNodeProps } from '../tree/interface';
import NodeList from '../tree/node-list';
import { TreeContext, type TreeContextValue } from '../tree/tree-context';
import TreeNode from '../tree/tree-node';
import useTreeKeyboard from '../tree/use-tree-keyboard';
import Trigger from '../trigger';

export type SearchInputElement = InputHandle | HTMLInputElement | HTMLTextAreaElement;

export type ExpandAction = false | 'click' | 'doubleClick';

export interface TriggerRenderProps extends Omit<BasicTriggerRenderProps, 'componentProps'> {
    componentProps: TreeSelectProps<TreeSelectNodeValue, boolean, boolean>;
    value: TreeNodeData[];
    onClear: (e: React.MouseEvent) => void;
}

/** The value of a tree node */
export type TreeSelectNodeValue = string | number;

type ChangeEvent = React.MouseEvent | React.KeyboardEvent | null;

/**
 * The arguments of `onChange`: `onChangeWithObject` drops the value argument, `multiple` makes each one an array.
 * Clearing a single selection passes `undefined`.
 */
export type OnChangeArgs<T, Multiple, WithObject> = WithObject extends unknown
    ? true extends WithObject
        ? [node: ByMultiple<Multiple, TreeNodeData | undefined, TreeNodeData[]>, e: ChangeEvent]
        : [value: ByMultiple<Multiple, T | undefined, T[]>, node: ByMultiple<Multiple, TreeNodeData | undefined, TreeNodeData[]>, e: ChangeEvent]
    : never;

export type RenderSelectedItemInSingle = (treeNode: TreeNodeData) => React.ReactNode;

export type RenderSelectedItemInMultiple = (
    treeNode: TreeNodeData,
    otherProps: {
        index: number | string;
        onClose: (tagContent: any, e: React.MouseEvent | React.KeyboardEvent) => void;
    }
) => {
    isRenderInTag: boolean;
    content: React.ReactNode;
};

export type RenderSelectedItem = RenderSelectedItemInSingle | RenderSelectedItemInMultiple;

export type OverrideCommonProps = 'renderFullLabel' | 'renderLabel' | 'emptyContent' | 'filterTreeNode' | 'style' | 'treeData' | 'onExpand' | 'keyMaps' | 'showLine';

/** The methods on a TreeSelect ref */
export interface TreeSelectHandle {
    /** Searches as if `value` were typed, opening the dropdown first; needs `filterTreeNode` */
    search: (value: string) => void;
    /** Closes the dropdown */
    close: () => void;
}

/** One node value, or in multiple mode also a list of them; nodes instead with `onChangeWithObject` */
type ModeValue<T, Multiple> = ByMultiple<Multiple, T | TreeNodeData, T | TreeNodeData | Array<T | TreeNodeData>>;

/**
 * `T` is the type of the node values the caller stores. `Multiple` follows the `multiple` prop and `WithObject` the
 * `onChangeWithObject` prop, so that `value`, `onChange` and `renderSelectedItem` take the shapes of the mode in use
 */
export interface TreeSelectProps<T extends TreeSelectNodeValue = TreeSelectNodeValue, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined>
    extends
        Omit<BasicTreeSelectProps, OverrideCommonProps | 'validateStatus' | 'searchRender' | 'multiple' | 'onChangeWithObject' | 'value' | 'defaultValue' | 'onChange' | 'renderSelectedItem'>,
        Pick<TreeProps, OverrideCommonProps>,
        ElementProps<'div', 'prefix' | 'defaultValue' | 'onChange' | 'onSelect' | 'onLoad' | 'onBlur' | 'onFocus'> {
    multiple?: Multiple;
    onChangeWithObject?: WithObject;
    value?: ModeValue<T, Multiple>;
    defaultValue?: ModeValue<T, Multiple>;
    motion?: boolean;
    arrowIcon?: React.ReactNode;
    autoAdjustOverflow?: boolean;
    clickToHide?: boolean;
    clearIcon?: React.ReactNode;
    defaultOpen?: boolean;
    dropdownClassName?: string;
    dropdownMatchSelectWidth?: boolean;
    dropdownStyle?: React.CSSProperties;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    maxTagCount?: number;
    motionExpand?: boolean;
    optionListStyle?: React.CSSProperties;
    outerBottomSlot?: React.ReactNode;
    outerTopSlot?: React.ReactNode;
    placeholder?: string;
    prefix?: React.ReactNode;
    position?: PopoverProps['position'];
    searchAutoFocus?: boolean;
    searchPlaceholder?: string;
    showSearchClear?: boolean;
    size?: Size;
    suffix?: React.ReactNode;
    treeNodeLabelProp?: string;
    validateStatus?: ValidateStatus;
    searchPosition?: typeof strings.SEARCH_POSITION_DROPDOWN | typeof strings.SEARCH_POSITION_TRIGGER;
    stopPropagation?: boolean | string;
    restTagsPopoverProps?: PopoverProps;
    expandIcon?: React.ReactNode | ((props: { onClick: (e: React.MouseEvent) => void; className: string; expanded: boolean }) => React.ReactNode);
    searchRender?: boolean | ((inputProps: InputProps & { ref: (el: SearchInputElement | null) => void }) => React.ReactNode);
    onSelect?: (selectedKey: string, selected: boolean, selectedNode: TreeNodeData) => void;
    renderSelectedItem?: ByMultiple<Multiple, RenderSelectedItemInSingle, RenderSelectedItemInMultiple>;
    triggerRender?: (props: TriggerRenderProps) => React.ReactNode;
    /**
     * Once per onFocus: the mousedown outside (native), the click or key that selects and closes, or the native
     * focusout that leaves the trigger and the dropdown
     */
    onBlur?: (e: React.MouseEvent | React.KeyboardEvent | globalThis.MouseEvent | globalThis.FocusEvent) => void;
    onChange?: (...args: OnChangeArgs<T, Multiple, WithObject>) => void;
    /**
     * Focus entering the trigger or the dropdown from outside (native focusin); moving within them does not report
     * again. A click or key that reopens after a pick closed it, and `searchAutoFocus` on mount (`null`), report it too
     */
    onFocus?: (e: React.MouseEvent | React.KeyboardEvent | globalThis.FocusEvent | null) => void;
    /** Called when the dropdown opens or closes; Select, Cascader and AutoComplete call it `onDropdownVisibleChange` */
    onVisibleChange?: (isVisible: boolean) => void;
    onClear?: (e: React.MouseEvent) => void;
    /**
     * Lets selected tags wrap onto multiple lines in the trigger (multiple + searchPosition="trigger")
     */
    triggerTagWrap?: boolean;
    /** Imperative handle */
    ref?: React.Ref<TreeSelectHandle>;
}

interface TreeSelectBodyProps extends Omit<TreeSelectProps<TreeSelectNodeValue, boolean, boolean>, 'onChange'> {
    onChange?: Bivariant<OnChangeArgs<TreeSelectNodeValue, boolean, boolean>>;
}

export type OverrideCommonState = 'keyEntities' | 'treeData' | 'disabledKeys' | 'flattenNodes';

export interface TreeSelectState extends Omit<BasicTreeSelectInnerData, OverrideCommonState | 'prevProps'>, Pick<TreeState, OverrideCommonState> {
    prevProps: TreeSelectBodyProps;
}

const prefixcls = cssClasses.PREFIX;
const prefixTree = cssClasses.PREFIX_TREE;

const defaultProps = {
    borderless: false,
    searchPosition: strings.SEARCH_POSITION_DROPDOWN,
    arrowIcon: <IconChevronDown />,
    autoExpandParent: false,
    autoAdjustOverflow: true,
    stopPropagation: true,
    motion: true,
    motionExpand: true,
    expandAll: false,
    disableStrictly: false,
    multiple: false,
    remote: false,
    filterTreeNode: false,
    size: 'default',
    treeNodeFilterProp: 'label',
    onChangeWithObject: false,
    treeNodeLabelProp: 'label',
    dropdownMatchSelectWidth: true,
    defaultOpen: false,
    showSearchClear: true,
    showClear: false,
    onVisibleChange: noop,
    expandAction: false,
    clickToHide: true,
    searchAutoFocus: false,
    checkRelation: 'related',
    showRestTagsPopover: false,
    restTagsPopoverProps: {},
    clickTriggerToHide: true,
    autoMergeValue: true,
    triggerTagWrap: false,
} satisfies Partial<TreeSelectBodyProps>;

function getVirtualItemKey(index: number, data: Record<string, any>) {
    return data.visibleOptions[index].key;
}

const NO_MOTION_KEYS: Set<string> = new Set();

export default function TreeSelect<T extends TreeSelectNodeValue = TreeSelectNodeValue, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined>(rawProps: TreeSelectProps<T, Multiple, WithObject>) {
    const bodyProps: TreeSelectBodyProps = rawProps;
    const props = useDefaultProps('TreeSelect', withInputGroup(bodyProps, useInputGroupInScope()), defaultProps);

    const {
        ref,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        'aria-label': ariaLabel,
        motion,
        arrowIcon,
        autoAdjustOverflow,
        clickToHide,
        clearIcon,
        defaultOpen,
        dropdownClassName,
        dropdownMatchSelectWidth,
        dropdownStyle,
        insetLabel,
        insetLabelId,
        maxTagCount,
        motionExpand,
        optionListStyle,
        outerBottomSlot,
        outerTopSlot,
        placeholder,
        prefix,
        position,
        searchAutoFocus,
        searchPlaceholder,
        showSearchClear,
        size,
        suffix,
        treeNodeLabelProp,
        validateStatus,
        searchPosition,
        stopPropagation,
        restTagsPopoverProps,
        expandIcon,
        searchRender,
        onSelect,
        renderSelectedItem: propRenderSelectedItem,
        triggerRender,
        onBlur,
        onChange,
        onFocus,
        onVisibleChange,
        onClear,
        autoMergeValue,
        triggerTagWrap,
        renderFullLabel,
        renderLabel,
        defaultValue,
        emptyContent,
        filterTreeNode,
        style,
        treeData,
        value,
        onExpand,
        keyMaps,
        showLine,
        virtualize,
        autoExpandParent,
        className,
        defaultExpandAll,
        defaultExpandedKeys,
        disabled,
        expandAction,
        expandedKeys,
        labelEllipsis,
        leafOnly,
        multiple,
        onChangeWithObject,
        showClear,
        showFilteredOnly,
        treeNodeFilterProp,
        expandAll,
        disableStrictly,
        checkRelation,
        preventScroll,
        borderless,
        remote,
        loadedKeys,
        showRestTagsPopover,
        clickTriggerToHide,
        loadData,
        onSearch,
        onLoad,
        ...rest
    } = props;

    const { direction } = useConfigContext();
    const { locale } = useLocale('TreeSelect');
    const { locale: treeLocale } = useLocale('Tree');

    const triggerRef = useRef<HTMLDivElement>(null);
    const optionContainerEl = useRef<HTMLDivElement>(null);
    const inputRef = useRef<SearchInputElement | null>(null);
    const tagInputRef = useRef<TagInputHandle>(null);
    const listRef = useRef<VirtualListHandle>(null);
    const treeId = useId();
    const singleSearchTextId = useId();

    const [foundation, state] = useFoundation<TreeSelectFoundation<TreeSelectBodyProps, TreeSelectState, React.MouseEvent | React.KeyboardEvent>, TreeSelectAdapter<TreeSelectBodyProps, TreeSelectState, React.MouseEvent | React.KeyboardEvent>, TreeSelectBodyProps, TreeSelectState>(
        TreeSelectFoundation,
        props,
        () => TreeSelectFoundation.getInitialState(props) as TreeSelectState,
        (base) => ({
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateState: (states) => base.setState({ ...states } as TreeSelectState),
            notifySelect: (selectKey, bool, node) => base.getProps().onSelect?.(selectKey, bool, node),
            notifySearch: (input, filteredExpandedKeys, filteredNodes) => base.getProps().onSearch?.(input, filteredExpandedKeys, filteredNodes),
            setCachedFlattenNodes: (cachedFlattenNodes) => base.setState({ cachedFlattenNodes }),
            notifyLoad: (newLoadedKeys, data) => base.getProps().onLoad?.(newLoadedKeys, data),
            notifyClear: (e) => base.getProps().onClear?.(e),
            openMenu: () => base.setState({ isOpen: true }),
            closeMenu: () => base.setState({ isOpen: false }),
            notifyVisibleChange: (visible) => base.getProps().onVisibleChange?.(visible),
            notifyChange: (value, node, e) => base.getProps().onChange?.(value, node, e),
            notifyChangeWithObject: (node, e) => base.getProps().onChange?.(node, e),
            notifyExpand: (expandedKeys, { expanded, node }) => base.getProps().onExpand?.([...expandedKeys], { expanded, node }),
            notifyFocus: (e) => base.getProps().onFocus?.(e),
            notifyBlur: (e) => base.getProps().onBlur?.(e),
            focusInput: () => {
                inputRef.current?.focus({ preventScroll: base.getProps().preventScroll });
                tagInputRef.current?.focus();
            },
            focusTrigger: () => {
                if (triggerRef.current?.getAttribute('role') === 'combobox') {
                    triggerRef.current.focus();
                } else {
                    (inputRef.current ?? tagInputRef.current)?.focus();
                }
            },
            updateIsFocus: (isFocus) => base.setState({ isFocus }),
            isInTrigger: (node) => node instanceof Node && Boolean(triggerRef.current?.contains(node)),
        })
    );

    // derived in render so new props reach the DOM in one commit; written back for the handlers, which settles
    const derived = TreeSelectFoundation.deriveState(props, state);
    const view = derived ? { ...state, ...derived } : state;

    // only a keyword change is deferred; clicks, expansion and arrow keys paint with the live state
    const deferredView = useDeferredValue(view);
    const listView = deferredView.inputValue === view.inputValue ? view : deferredView;
    const { isOpen, isFocus } = view;
    const { inputValue, inputTriggerFocus, keyEntities, disabledKeys, checkedKeys } = view;
    const { flattenNodes, filteredKeys, motionKeys, motionType, inputValue: listInputValue } = listView;
    const realLabelName = keyMaps?.label ?? treeNodeLabelProp;
    const isTriggerPositionSearch = Boolean(filterTreeNode) && searchPosition === strings.SEARCH_POSITION_TRIGGER;
    const isDropdownPositionSearch = searchPosition === strings.SEARCH_POSITION_DROPDOWN;

    // a callback, so passing it to a user searchRender is not a ref access during render
    const setInputRef = (el: SearchInputElement | null) => {
        inputRef.current = el;
    };

    const renderedIndexOf = (key: string) => flattenNodes.findIndex((node) => node.key === key);

    /** The props a row renders with; the key handler reads them from the live state */
    const getNodeProps = (treeNode: FlattenNode, from: TreeSelectState = listView): TreeNodeProps | null => {
        const rowProps = buildRowProps(treeNode, from, props);
        // Node data may carry "empty", which TreeNode renders as the empty-content row
        return rowProps && ({ ...rowProps, empty: false } as TreeNodeProps);
    };

    // a key that opens the popup sets the row before the list mounts, so opening scrolls to it again
    const scrollToRow = (key: string) => {
        if (listRef.current) {
            // shortcut: a row not rendered yet is not scrolled to; revisit if virtual-list arrow keys get lost
            const rendered = renderedIndexOf(key);
            if (rendered !== -1) {
                listRef.current.scrollToItem(rendered);
            }
        } else {
            // inside the dropdown, not the document: one in a ShadowRoot is out of document.getElementById's reach
            optionContainerEl.current?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
        }
    };

    useLayoutEffect(() => {
        if (derived) {
            foundation.syncDerivedState(derived);
        }
    }, [derived, foundation]);

    // blur comes from a click outside, so it is listened to while focused, not only while open
    const markPressInside = useClickOutside([triggerRef, optionContainerEl], foundation.handleClickOutside, isOpen || isFocus);

    const {
        keyboardKey,
        setKeyboardKey,
        activeKey,
        handleKeyDown: handleRowKeyDown,
    } = useTreeKeyboard({
        // keys act on the live rows, so Enter never picks a row the keyword already filtered out
        rows: view.flattenNodes,
        // an APG combobox opens without an active option
        defaultIndex: -1,
        rowProps: (node) => getNodeProps(node, view),
        hasLoadData: Boolean(loadData),
        rtl: direction === 'rtl',
        editing: (event) => isTextEditor(event.target),
        select: foundation.handleNodeSelect,
        expand: foundation.handleNodeExpand,
        reveal: scrollToRow,
    });

    useImperativeHandle(
        props.ref,
        () => ({
            search: (value: string) => foundation.search(value),
            close: foundation.close,
        }),
        [foundation]
    );

    // closing drops the row too, so a reopened popup starts without one
    if (!isOpen && keyboardKey !== null) {
        setKeyboardKey(null);
    }

    const activeRendered = activeKey !== undefined && (listView === view || renderedIndexOf(activeKey) !== -1);
    const activeDescendant = activeRendered ? nodeId(treeId, activeKey) : undefined;

    // ARIA 1.2: a search input on the trigger is the combobox (`searchRender={false}` leaves single mode without
    // one, and a triggerRender replaces it); otherwise the trigger is a select-only combobox
    const inputIsCombobox = isTriggerPositionSearch && typeof triggerRender !== 'function' && (multiple || searchRender !== false);

    // the owner may clear the value while the clear button holds focus; the combobox takes it back
    const clearHandover = useFocusHandover<HTMLButtonElement>(() => (inputIsCombobox ? triggerRef.current?.querySelector('input') : triggerRef.current));

    const hasPrefix = hasContent(prefix) || hasContent(insetLabel);
    const insetLabelShown = hasContent(insetLabel) && !hasContent(prefix) && typeof triggerRender !== 'function';
    const prefixId = insetLabelId ?? (insetLabelShown ? `${treeId}-inset-label` : undefined);
    const nameProps = comboboxName(ariaLabelledby, ariaLabel, insetLabelShown ? prefixId : undefined, locale.label);

    const comboboxProps = {
        role: 'combobox',
        'aria-activedescendant': activeDescendant,
        'aria-controls': treeId,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-expanded': isOpen,
        'aria-haspopup': 'tree',
        'aria-invalid': ariaInvalid,
        ...nameProps,
        'aria-required': ariaRequired,
    } as const;

    const triggerAriaProps = inputIsCombobox ? {} : { ...comboboxProps, 'aria-disabled': disabled };

    const renderSelectedItem =
        typeof propRenderSelectedItem === 'function'
            ? propRenderSelectedItem
            : (item: TreeNodeData) => ({
                  isRenderInTag: true,
                  content: get(item, realLabelName, null),
              });

    const hasValue = TreeSelectFoundation.hasValue(props, view);
    const triggerSearchHasInputValue = searchPosition === strings.SEARCH_POSITION_TRIGGER && inputValue;
    const clearable = showClear && (hasValue || triggerSearchHasInputValue) && !disabled;

    const contextValue: TreeContextValue = useMemo(
        () => ({
            loadData,
            treeDisabled: disabled,
            expandAction,
            onNodeRightClick: noop,
            onNodeExpand: (e, treeNode) => {
                setKeyboardKey(treeNode.eventKey);
                foundation.handleNodeExpand(e, treeNode);
            },
            onNodeSelect: (e, treeNode) => {
                setKeyboardKey(treeNode.eventKey);
                foundation.handleNodeSelect(e, treeNode);
            },
            onNodeCheck: (e, treeNode) => {
                setKeyboardKey(treeNode.eventKey);
                foundation.handleNodeSelect(e, treeNode);
            },
            multiple,
            renderLabel,
            renderFullLabel,
            labelEllipsis: typeof labelEllipsis === 'undefined' ? virtualize : labelEllipsis,
        }),
        [loadData, disabled, expandAction, foundation, setKeyboardKey, multiple, renderLabel, renderFullLabel, labelEllipsis, virtualize]
    );

    /** Tree keys of the open popup (APG combobox with tree popup); returns whether the key was handled */
    const handleTreeKeyDown = (event: React.KeyboardEvent) => isOpen && handleRowKeyDown(event);

    const getNodeData = (key: string) => TreeSelectFoundation.getNodeData(key, keyEntities, props);

    const getRenderTextInSingle = () => TreeSelectFoundation.getRenderTextInSingle(props, view);

    const isShownText = (text: React.ReactNode) => Boolean(text) || text === 0;

    // focus enters the dropdown through its search input or a field in a slot, and the dropdown is not a DOM
    // descendant of the trigger, so containment is checked against its popup layer
    const handleFocusLeave = (e: React.FocusEvent) => {
        const target = e.relatedTarget;
        const inside = target instanceof Node && (Boolean(triggerRef.current?.contains(target)) || Boolean(optionContainerEl.current?.closest('[popover]')?.contains(target)));
        if (!inside) {
            foundation.handleFocusLeave(e.nativeEvent);
        }
    };

    const removeTag = (removedKey: TreeNodeData['key']) => foundation.removeTag(removedKey);

    const search = (input: string) => foundation.search(input);

    const handleClear = (e: React.MouseEvent) => {
        e?.stopPropagation();
        foundation.handleClear(e);
    };

    const renderTagList = (triggerRenderKeys: string[]) => {
        const tagList: Array<React.ReactNode> = [];
        triggerRenderKeys.forEach((key: TreeNodeData['key'], index) => {
            const item = getNodeData(key);
            if (!item) {
                return;
            }
            const onClose = (_tagContent: any, e: React.MouseEvent | React.KeyboardEvent) => {
                if (e && typeof e.preventDefault === 'function') {
                    e.preventDefault();
                }
                removeTag(key);
            };
            const { content, isRenderInTag } = (renderSelectedItem as RenderSelectedItemInMultiple)(item, {
                index,
                onClose,
            });
            if (content == null) {
                return;
            }
            const isDisabled = disabled || item[keyMaps?.disabled ?? 'disabled'] || (disableStrictly && disabledKeys.has(key));
            const tag: Partial<TagProps> = {
                closable: !isDisabled,
                color: 'white',
                visible: true,
                onClose,
                size: size === 'small' ? 'small' : 'large',
            };
            if (isRenderInTag) {
                tagList.push(
                    <Tag key={`tag-${key}-${index}`} {...tag}>
                        {content}
                    </Tag>
                );
            } else {
                tagList.push(content);
            }
        });
        return tagList;
    };

    const renderTagItem = (key: string, idx: number) => {
        const keyList = normalizeKeyList([key], keyEntities, leafOnly, true);
        const nodes = keyList.map(() => getNodeData(key));
        const nodeValue = getValueOrKey(nodes, keyMaps);
        const tagCls = clsx(`${prefixcls}-selection-tag`, {
            [`${prefixcls}-selection-tag-disabled`]: disabled,
        });
        const nodeHaveData = nodes.length > 0 && Boolean(nodes[0]) && Object.keys(nodes[0]).length > 0;
        const isDisableStrictlyNode = disableStrictly && nodeHaveData && disabledKeys.has(key);
        const closable = nodeHaveData && !nodes[0][keyMaps?.disabled ?? 'disabled'] && !disabled && !isDisableStrictlyNode;
        const onClose = (_tagChildren: React.ReactNode, e: React.MouseEvent | React.KeyboardEvent) => {
            e.preventDefault();
            removeTag(key);
        };
        const tagProps: Partial<TagProps> = {
            size: size === 'small' ? 'small' : 'large',
            color: 'white',
            className: tagCls,
            closable,
            onClose,
        };
        const item = nodes[0];
        if (!item) {
            return null;
        }
        const { content, isRenderInTag } = (renderSelectedItem as RenderSelectedItemInMultiple)(item, {
            index: idx,
            onClose,
        });
        if (isRenderInTag) {
            return (
                <Tag key={`tag-${nodeValue}-${idx}`} {...tagProps}>
                    {content}
                </Tag>
            );
        }
        return content;
    };

    const renderInput = () => {
        const inputcls = clsx({
            [`${prefixTree}-input`]: isDropdownPositionSearch,
            [`${prefixcls}-inputTrigger`]: !isDropdownPositionSearch,
        });
        const baseInputProps = {
            value: inputValue,
            className: inputcls,
            preventScroll,
            onChange: (input: string) => search(input),
        };
        const inputDropdownProps = {
            showClear: showSearchClear,
            prefix: <IconSearch />,
        };
        const inputTriggerProps = {
            autoFocus: searchAutoFocus,
            onFocus: (e?: React.FocusEvent) => foundation.handleInputTriggerFocus(e),
            onBlur: (e?: React.FocusEvent) => foundation.handleInputTriggerBlur(e),
            disabled,
        };
        const realInputProps = isDropdownPositionSearch ? inputDropdownProps : inputTriggerProps;
        const describedby = joinIds(ariaDescribedby, inputValue ? undefined : singleSearchTextId);
        const inputA11yProps = isDropdownPositionSearch
            ? // a search field over the trigger's tree, not a second combobox (React Aria Autocomplete pattern)
              ({
                  'aria-activedescendant': activeDescendant,
                  'aria-autocomplete': 'list',
                  'aria-controls': treeId,
                  'aria-label': locale.filter,
              } as const)
            : ({
                  ...comboboxProps,
                  'aria-autocomplete': 'list',
                  // the input is empty until typing, so the selected text is exposed as the description
                  'aria-describedby': describedby,
              } as const);
        const wrapperCls = clsx({
            [`${prefixTree}-search-wrapper`]: isDropdownPositionSearch,
            [`${prefixcls}-triggerSingleSearch-wrapper`]: !isDropdownPositionSearch && !multiple,
            [`${prefixcls}-triggerSingleSearch-upper`]: !isDropdownPositionSearch && inputTriggerFocus,
        });
        if (searchRender === false) {
            return null;
        }
        const inputPlaceholder = isDropdownPositionSearch ? searchPlaceholder || locale.searchPlaceholder : '';
        return (
            <div className={wrapperCls}>
                {typeof searchRender === 'function' ? (
                    searchRender({
                        ...inputA11yProps,
                        ...realInputProps,
                        ...baseInputProps,
                        placeholder: inputPlaceholder,
                        ref: setInputRef,
                    })
                ) : (
                    // global Input defaults must not add a clear button or adornments; realInputProps sets the dropdown's own
                    <Input ref={setInputRef} {...inputA11yProps} placeholder={inputPlaceholder} addonAfter={null} addonBefore={null} insetLabel={null} showClear={false} prefix={null} suffix={null} {...baseInputProps} {...realInputProps} />
                )}
            </div>
        );
    };

    const renderTagInput = (triggerRenderKeys: string[]) => (
        // dropdown search is focused on open instead: autofocus in the off-screen popup scrolls the page to top
        <TagInput
            ref={tagInputRef}
            {...comboboxProps}
            aria-autocomplete="list"
            autoFocus={isTriggerPositionSearch ? searchAutoFocus : undefined}
            disabled={disabled}
            placeholder={placeholder}
            value={triggerRenderKeys}
            expandRestTagsOnClick={false}
            inputValue={inputValue}
            maxTagCount={maxTagCount}
            preventScroll={preventScroll}
            restTagsPopoverProps={restTagsPopoverProps}
            showRestTagsPopover={showRestTagsPopover}
            size={size}
            renderTagItem={(itemKey, index) => renderTagItem(itemKey, index)}
            onInputChange={(v) => search(v)}
            onRemove={(itemKey) => removeTag(itemKey)}
        />
    );

    /**
     * Single selection with the search box on the trigger: the selected text shown beside the input
     */
    const renderSingleTriggerSearchItem = () => {
        const renderText = getRenderTextInSingle();
        const shown = isShownText(renderText);
        const spanCls = clsx(`${prefixcls}-selection-TriggerSearchItem`, {
            [`${prefixcls}-selection-TriggerSearchItem-placeholder`]: (inputTriggerFocus || !shown) && !disabled,
            [`${prefixcls}-selection-TriggerSearchItem-disabled`]: disabled,
        });
        return (
            <span id={singleSearchTextId} className={spanCls} onClick={foundation.onClickSingleTriggerSearchItem}>
                {shown ? renderText : placeholder}
            </span>
        );
    };

    const renderSelectContent = (triggerRenderKeys: string[]) => {
        if (isTriggerPositionSearch) {
            return multiple ? (
                renderTagInput(triggerRenderKeys)
            ) : (
                <>
                    {renderInput()}
                    {!inputValue && renderSingleTriggerSearchItem()}
                </>
            );
        }
        if (!multiple || !hasValue) {
            const renderText = getRenderTextInSingle();
            const shown = isShownText(renderText);
            const spanCls = clsx(`${prefixcls}-selection-content`, {
                [`${prefixcls}-selection-placeholder`]: !shown,
            });
            return <span className={spanCls}>{shown ? renderText : placeholder}</span>;
        }
        return <TagGroup maxTagCount={maxTagCount} mode="custom" popoverProps={restTagsPopoverProps} showPopover={showRestTagsPopover} size={size === 'small' ? 'small' : 'large'} tagList={renderTagList(triggerRenderKeys)} />;
    };

    const renderClearBtn = () => {
        if (!clearable) {
            return null;
        }
        return (
            <button
                ref={clearHandover}
                type="button"
                className={`${prefixcls}-clearbtn`}
                aria-label={locale.clear}
                onClick={(e) => {
                    handleClear(e);
                    if (inputIsCombobox) {
                        (inputRef.current ?? tagInputRef.current)?.focus();
                    } else {
                        triggerRef.current?.focus();
                    }
                }}
                onKeyDown={stopButtonActivationKeys}
            >
                {clearIcon ? clearIcon : <IconClear />}
            </button>
        );
    };

    const renderArrow = () => {
        if (!arrowIcon) {
            return null;
        }
        return (
            <div className={clsx(`${prefixcls}-arrow`)} x-semi-prop="arrowIcon">
                {arrowIcon}
            </div>
        );
    };

    const renderSelection = () => {
        const useCustomTrigger = typeof triggerRender === 'function';
        const isEmptyTriggerSearch = isTriggerPositionSearch && checkedKeys.size === 0;
        const isValueTriggerSearch = isTriggerPositionSearch && checkedKeys.size > 0;
        const classNames = useCustomTrigger
            ? clsx(className)
            : clsx(
                  prefixcls,
                  {
                      [`${prefixcls}-borderless`]: borderless,
                      [`${prefixcls}-focus`]: isFocus,
                      [`${prefixcls}-disabled`]: disabled,
                      [`${prefixcls}-single`]: !multiple,
                      [`${prefixcls}-multiple`]: multiple,
                      [`${prefixcls}-multiple-tagInput-empty`]: multiple && isEmptyTriggerSearch,
                      [`${prefixcls}-multiple-tagInput-notEmpty`]: multiple && isValueTriggerSearch,
                      [`${prefixcls}-filterable`]: Boolean(filterTreeNode),
                      [`${prefixcls}-error`]: validateStatus === 'error',
                      [`${prefixcls}-warning`]: validateStatus === 'warning',
                      [`${prefixcls}-small`]: size === 'small',
                      [`${prefixcls}-large`]: size === 'large',
                      [`${prefixcls}-with-prefix`]: hasPrefix,
                      [`${prefixcls}-with-suffix`]: hasContent(suffix),
                      [`${prefixcls}-triggerTagWrap`]: Boolean(triggerTagWrap) && multiple && isTriggerPositionSearch,
                  },
                  className
              );
        const triggerRenderKeys = TreeSelectFoundation.getTriggerKeys(props, view);
        let inner: React.ReactNode;
        if (useCustomTrigger) {
            // class props never carried ref; a triggerRender that spreads componentProps must not grab the handle
            const componentProps = { ...props };
            delete componentProps.ref;
            inner = <Trigger disabled={disabled} placeholder={placeholder} value={triggerRenderKeys.map(getNodeData).filter(Boolean)} componentProps={componentProps} inputValue={inputValue} triggerRender={triggerRender} onClear={handleClear} onRemove={removeTag} onSearch={search} />;
        } else {
            inner = [
                <Fragment key="prefix">{hasPrefix && renderTriggerPrefix(prefixcls, prefix, insetLabel, prefixId)}</Fragment>,
                <Fragment key="selection">
                    <div className={`${prefixcls}-selection`}>{renderSelectContent(triggerRenderKeys)}</div>
                </Fragment>,
                <Fragment key="suffix">{hasContent(suffix) && renderTriggerSuffix(prefixcls, suffix)}</Fragment>,
                <Fragment key="clearBtn">{renderClearBtn()}</Fragment>,
                <Fragment key="arrow">{renderArrow()}</Fragment>,
            ];
        }
        return (
            <div
                {...rest}
                ref={triggerRef}
                className={classNames}
                style={style}
                {...triggerAriaProps}
                tabIndex={disabled || inputIsCombobox ? -1 : 0}
                onBlur={handleFocusLeave}
                onClick={(e) => {
                    rest.onClick?.(e);
                    foundation.handleClick(e);
                }}
                onFocus={(e) => foundation.handleTriggerFocus(e.nativeEvent)}
                onKeyDown={(e) => {
                    rest.onKeyDown?.(e);
                    if (!isInnerControlKey(e) && !handleTreeKeyDown(e)) {
                        foundation.handleSelectionKeyDown(e);
                        const opened = !isOpen && foundation.getState('isOpen');
                        if (opened && (e.key === 'Home' || e.key === 'End')) {
                            handleRowKeyDown(e);
                        }
                    }
                    foundation.handleKeyDown(e);
                }}
                onMouseDown={(e) => {
                    rest.onMouseDown?.(e);
                    // refocusing the search input clears its text, so a press elsewhere keeps focus in it
                    if (inputIsCombobox && !isTextEditor(e.target)) {
                        e.preventDefault();
                    }
                }}
                onMouseDownCapture={(e) => {
                    rest.onMouseDownCapture?.(e);
                    markPressInside(e);
                }}
            >
                {inner}
            </div>
        );
    };

    const renderTreeNode = (treeNode: FlattenNode, _ind?: number, nodeStyle?: React.CSSProperties) => {
        const nodeProps = getNodeProps(treeNode);
        if (!nodeProps) {
            return null;
        }
        // the jsx runtime wants key outside spread props
        const { key: nodeKey, ...restNodeProps } = nodeProps;
        return <TreeNode key={nodeKey} {...restNodeProps} id={nodeId(treeId, nodeKey)} style={nodeStyle} expandIcon={expandIcon} focused={nodeKey === activeKey} showLine={showLine} />;
    };

    const renderNodeList = () => {
        if (!virtualize || Object.keys(virtualize).length === 0) {
            return (
                <NodeList
                    flattenList={listView.cachedFlattenNodes}
                    flattenNodes={flattenNodes}
                    motionKeys={motionExpand ? motionKeys : NO_MOTION_KEYS}
                    motionType={motionType}
                    // a search hit has empty motionKeys but non-empty filteredKeys; tell it from ordinary motionKeys
                    searchTargetIsDeep={props.expandedKeys !== undefined && motionExpand && motionKeys.size === 0 && filteredKeys.size > 0}
                    renderTreeNode={renderTreeNode}
                />
            );
        }
        return (
            <AutoSizer defaultHeight={virtualize.height} defaultWidth={virtualize.width}>
                {({ height, width }) => (
                    <VirtualList
                        ref={listRef}
                        className={`${prefixTree}-virtual-list`}
                        style={{ direction }}
                        tabIndex={-1}
                        height={height as number}
                        itemCount={flattenNodes.length}
                        itemData={{ visibleOptions: flattenNodes, renderOption: renderTreeNode }}
                        itemKey={getVirtualItemKey}
                        itemSize={virtualize.itemSize}
                        width={width}
                    >
                        {VirtualRow}
                    </VirtualList>
                )}
            </AutoSizer>
        );
    };

    const renderEmpty = () => {
        if (emptyContent === null) {
            return null;
        }
        return <TreeNode empty emptyContent={emptyContent ? emptyContent : treeLocale.emptyText} />;
    };

    const renderTree = () => {
        const searchNoRes = Boolean(listInputValue) && !filteredKeys.size;
        const noData = flattenNodes.length === 0 || (showFilteredOnly && searchNoRes);
        const listCls = clsx(`${prefixTree}-option-list ${prefixTree}-option-list-block`, {
            [`${prefixTree}-option-list-hidden`]: emptyContent === null && noData,
        });
        return (
            <TreeContext value={contextValue}>
                <div className={clsx(`${prefixTree}-wrapper`)}>
                    {outerTopSlot}
                    {!outerTopSlot && filterTreeNode && isDropdownPositionSearch && renderInput()}
                    {noData ? (
                        // the combobox's aria-controls needs an element while there is no tree
                        <div id={treeId} className={listCls} style={optionListStyle} role="none">
                            {renderEmpty()}
                        </div>
                    ) : (
                        <div
                            id={treeId}
                            className={listCls}
                            style={optionListStyle}
                            // the combobox's name source, never the combobox itself: accname would read its value
                            {...nameProps}
                            aria-multiselectable={Boolean(multiple)}
                            role="tree"
                        >
                            {renderNodeList()}
                        </div>
                    )}
                    {outerBottomSlot}
                </div>
            </TreeContext>
        );
    };

    const content = (
        <div
            ref={optionContainerEl}
            className={clsx(dropdownClassName, `${prefixcls}-popover`)}
            style={dropdownStyle}
            onBlur={handleFocusLeave}
            onFocus={(e) => foundation.handleTriggerFocus(e.nativeEvent)}
            onKeyDown={(e) => {
                handleTreeKeyDown(e);
                foundation.handleKeyDown(e);
            }}
            // a press would focus the popup, which is hidden on close and drops the focus to body; the focus stays on
            // the trigger or the search input. A text field in a slot still takes the focus.
            onMouseDown={(e) => {
                if (!isTextEditor(e.target)) {
                    e.preventDefault();
                }
            }}
            onMouseDownCapture={markPressInside}
        >
            {renderTree()}
        </div>
    );

    return (
        <InputGroupContext value={undefined}>
            <Popover
                style={dropdownMatchSelectWidth ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined}
                role="presentation"
                afterClose={foundation.handleAfterClose}
                autoAdjustOverflow={autoAdjustOverflow}
                content={content}
                motion={motion}
                position={position ?? (direction === 'rtl' ? 'bottomRight' : 'bottomLeft')}
                stopPropagation={stopPropagation}
                trigger="custom"
                visible={isOpen}
                onOpen={() => {
                    foundation.handlePopoverOpen();
                    if (activeKey !== undefined) {
                        scrollToRow(activeKey);
                    }
                }}
            >
                {renderSelection()}
            </Popover>
        </InputGroupContext>
    );
}
