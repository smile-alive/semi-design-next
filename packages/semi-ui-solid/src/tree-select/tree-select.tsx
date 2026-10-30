import { type Accessor, type JSX, type Ref, Show, batch, children, createComputed, createMemo, createSelector, createUniqueId, mergeProps, on, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
// compat get: the label prop name comes from keyMaps/treeNodeLabelProp and is resolved as a path
import { get } from 'es-toolkit/compat';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { cssClasses, strings } from '@fibrae/semi-foundation/tree-select/constants';
import TreeSelectFoundation, { type BasicTreeSelectInnerData, type BasicTreeSelectProps, type TreeSelectAdapter, treeSelectDerivedPropKeys } from '@fibrae/semi-foundation/tree-select/foundation';
import { buildRowProps, nodeId } from '@fibrae/semi-foundation/tree/shared';
import { normalizeKeyList } from '@fibrae/semi-foundation/tree/tree-util';
import { isInnerControlKey, isTextEditor, joinIds, stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/tree/tree.scss';
import '@fibrae/semi-foundation/tree-select/tree-select.scss';
import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus, { focusElement } from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import mergeRefs from '../_base/merge-refs';
import { usePopupLayer } from '../_base/popup-layer';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import type { VirtualListHandle } from '../_base/virtual-list';
import useConfig from '../config-provider/use-config';
import Input, { type InputProps, type ValidateStatus } from '../input';
import { InputGroupContext, useInputGroupContext } from '../input/context';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverProps } from '../popover';
import Tag, { TagGroup, type TagGroupItem } from '../tag';
import TagInput from '../tag-input';
import type { Position } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import { type FlattenNode, NodeList, TreeContext, type TreeContextValue, type TreeNodeData, type TreeProps, type TreeRowProps, TreeNode, sameRow, useTreeKeyboard } from '../tree';

const prefix = cssClasses.PREFIX;
const prefixTree = cssClasses.PREFIX_TREE;

export type ExpandAction = false | 'click' | 'doubleClick';

/** The value of a tree node */
export type TreeSelectNodeValue = string | number;

type ByMultiple<Multiple, Single, Many> = Multiple extends unknown ? (true extends Multiple ? Many : Single) : never;

type ChangeEvent = MouseEvent | KeyboardEvent | null;

/**
 * The arguments of `onChange`: `onChangeWithObject` drops the value argument, `multiple` makes each one an array.
 * Clearing a single selection passes `undefined`.
 */
export type OnChangeArgs<T, Multiple, WithObject> = WithObject extends unknown
    ? true extends WithObject
        ? [node: ByMultiple<Multiple, TreeNodeData | undefined, TreeNodeData[]>, e: ChangeEvent]
        : [value: ByMultiple<Multiple, T | undefined, T[]>, node: ByMultiple<Multiple, TreeNodeData | undefined, TreeNodeData[]>, e: ChangeEvent]
    : never;

export type RenderSelectedItemInSingle = (treeNode: TreeNodeData) => JSX.Element;

export type RenderSelectedItemInMultiple = (
    treeNode: TreeNodeData,
    otherProps: {
        index: number | string;
        onClose: (tagContent: JSX.Element, e?: MouseEvent | KeyboardEvent) => void;
    }
) => {
    isRenderInTag: boolean;
    content: JSX.Element;
};

export type RenderSelectedItem = RenderSelectedItemInSingle | RenderSelectedItemInMultiple;

/** What a `searchRender` function receives: a live object, ready to spread on an Input; put `ref` on the text field */
export type SearchRenderProps = Omit<InputProps, 'ref' | 'onChange'> & {
    value: string;
    onChange: (value: string) => void;
    ref: (element: HTMLElement) => void;
};

/** A live object: read its fields in the returned JSX, destructuring takes only the values of the first render */
export interface TriggerRenderProps {
    componentProps: Omit<TreeSelectProps<TreeSelectNodeValue, boolean, boolean>, 'ref'>;
    disabled: boolean;
    inputValue: string;
    placeholder?: string;
    value: TreeNodeData[];
    /** Pass the click event, so it does not reopen the dropdown */
    onClear: (e?: MouseEvent) => void;
    onSearch: (inputValue: string) => void;
    onRemove: (key: string) => void;
}

/** React's TreeSelectHandle methods; the trigger element passed to `ref` carries them */
export interface TreeSelectHandle {
    /** Searches as if `value` were typed, opening the dropdown first; needs `filterTreeNode` */
    search: (value: string) => void;
    /** Closes the dropdown */
    close: () => void;
}

export type TreeSelectElement = HTMLDivElement & TreeSelectHandle;

/** One node value, or in multiple mode also a list of them; nodes instead with `onChangeWithObject` */
type ModeValue<T, Multiple> = ByMultiple<Multiple, T | TreeNodeData, T | TreeNodeData | Array<T | TreeNodeData>>;

type OverrideCommonProps = 'renderFullLabel' | 'renderLabel' | 'icon' | 'emptyContent' | 'filterTreeNode' | 'style' | 'treeData' | 'onExpand' | 'keyMaps' | 'showLine' | 'loadData' | 'virtualize';

type RedefinedProps =
    | OverrideCommonProps
    | 'className'
    | 'aria-label'
    | 'validateStatus'
    | 'searchRender'
    | 'multiple'
    | 'onChangeWithObject'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'renderSelectedItem'
    | 'onBlur'
    | 'onFocus'
    | 'onSelect'
    | 'onSearch'
    | 'onLoad'
    | 'arrowIcon'
    | 'dropdownStyle'
    | 'insetLabel'
    | 'optionListStyle'
    | 'outerBottomSlot'
    | 'outerTopSlot'
    | 'prefix'
    | 'suffix'
    | 'restTagsPopoverProps';

/**
 * `T` is the type of the node values the caller stores. `Multiple` follows the `multiple` prop and `WithObject` the
 * `onChangeWithObject` prop, so that `value`, `onChange` and `renderSelectedItem` take the shapes of the mode in use
 */
export interface TreeSelectProps<T extends TreeSelectNodeValue = TreeSelectNodeValue, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined>
    extends Omit<BasicTreeSelectProps, RedefinedProps>, Pick<TreeProps, OverrideCommonProps>, ElementProps<'div', 'prefix' | 'defaultValue' | 'onChange' | 'onSelect' | 'onLoad' | 'onBlur' | 'onFocus' | 'placeholder' | 'ref' | 'style'> {
    /** Accessible name of the combobox: the search input while it is in the trigger, otherwise the trigger */
    'aria-label'?: string;
    multiple?: Multiple;
    onChangeWithObject?: WithObject;
    value?: ModeValue<T, Multiple>;
    defaultValue?: ModeValue<T, Multiple>;
    /** `null` shows no arrow */
    arrowIcon?: JSX.Element;
    clearIcon?: JSX.Element;
    dropdownStyle?: JSX.CSSProperties | string;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    optionListStyle?: JSX.CSSProperties | string;
    outerBottomSlot?: JSX.Element;
    outerTopSlot?: JSX.Element;
    prefix?: JSX.Element;
    suffix?: JSX.Element;
    position?: Position;
    size?: Size;
    validateStatus?: ValidateStatus;
    restTagsPopoverProps?: PopoverProps;
    expandIcon?: TreeProps['expandIcon'];
    /** `false` renders no search box */
    searchRender?: boolean | ((inputProps: SearchRenderProps) => JSX.Element);
    onSelect?: (selectedKey: string, selected: boolean, selectedNode: TreeNodeData) => void;
    onSearch?: (searchValue: string, filteredExpandedKeys: string[], filteredNodes: TreeNodeData[]) => void;
    onLoad?: (loadedKeys: Set<string>, treeNode: TreeNodeData) => void;
    renderSelectedItem?: ByMultiple<Multiple, RenderSelectedItemInSingle, RenderSelectedItemInMultiple>;
    triggerRender?: (props: TriggerRenderProps) => JSX.Element;
    /**
     * Once per onFocus: the mousedown outside, the click or key that selects and closes, or the focusout that leaves
     * the trigger and the dropdown
     */
    onBlur?: (e: MouseEvent | KeyboardEvent | FocusEvent) => void;
    onChange?: (...args: OnChangeArgs<T, Multiple, WithObject>) => void;
    /**
     * Focus entering the trigger or the dropdown from outside (focusin); moving within them does not report again. A
     * click or key that reopens after a pick closed it, and `searchAutoFocus` on mount (`null`), report it too
     */
    onFocus?: (e: MouseEvent | KeyboardEvent | FocusEvent | null) => void;
    /** Called when the dropdown opens or closes; Select, Cascader and AutoComplete call it `onDropdownVisibleChange` */
    onVisibleChange?: (isVisible: boolean) => void;
    onClear?: (e: MouseEvent) => void;
    /** Lets selected tags wrap onto multiple lines in the trigger (multiple + searchPosition="trigger") */
    triggerTagWrap?: boolean;
    /**
     * The trigger element with the TreeSelectHandle methods; its `focus()` focuses the combobox (the search input
     * while it is in the trigger) without opening the dropdown
     */
    ref?: Ref<TreeSelectElement>;
}

// The body serves every mode, so it reads the callbacks through one wide type
interface TreeSelectBodyProps extends Omit<TreeSelectProps<TreeSelectNodeValue, boolean, boolean>, 'onChange' | 'renderSelectedItem'> {
    onChange?: (...args: unknown[]) => void;
    renderSelectedItem?: RenderSelectedItem;
}

type Foundation = TreeSelectFoundation<BasicTreeSelectProps, BasicTreeSelectInnerData, MouseEvent | KeyboardEvent>;
type Adapter = TreeSelectAdapter<BasicTreeSelectProps, BasicTreeSelectInnerData, MouseEvent | KeyboardEvent>;

const defaultProps = {
    borderless: false,
    searchPosition: strings.SEARCH_POSITION_DROPDOWN,
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
    treeNodeFilterProp: 'label',
    onChangeWithObject: false,
    treeNodeLabelProp: 'label',
    dropdownMatchSelectWidth: true,
    defaultOpen: false,
    showSearchClear: true,
    showClear: false,
    expandAction: false,
    clickToHide: true,
    searchAutoFocus: false,
    checkRelation: 'related',
    showRestTagsPopover: false,
    clickTriggerToHide: true,
    autoMergeValue: true,
    triggerTagWrap: false,
} satisfies Partial<TreeSelectBodyProps>;

const isShownText = (text: unknown) => Boolean(text) || text === 0;

export default function TreeSelect<T extends TreeSelectNodeValue = TreeSelectNodeValue, Multiple extends boolean | undefined = undefined, WithObject extends boolean | undefined = undefined>(rawProps: TreeSelectProps<T, Multiple, WithObject>) {
    const bodyProps = rawProps as TreeSelectBodyProps;
    const defaulted = useDefaultProps('TreeSelect', bodyProps, defaultProps);

    const group = useInputGroupContext();
    const layer = usePopupLayer();
    const config = useConfig();
    const locale = useLocale('TreeSelect');
    const treeLocale = useLocale('Tree');

    let root: HTMLDivElement | undefined;
    let searchInput: HTMLElement | undefined;
    let tagInput: HTMLDivElement | undefined;
    let clearButton: HTMLButtonElement | undefined;
    let optionContainer: HTMLDivElement | undefined;
    let list: VirtualListHandle | undefined;

    const inGroup = group?.layer === layer ? group : undefined;

    // as Input: own value, then the group's, then the global default
    const props = mergeProps(defaulted, {
        get size() {
            return bodyProps.size ?? inGroup?.view().size ?? defaulted.size ?? 'default';
        },
        get disabled() {
            return bodyProps.disabled ?? inGroup?.view().disabled ?? defaulted.disabled;
        },
    });

    // validateStatus, insetLabel and insetLabelId are read from props: the Form-injected keys never reach the split
    const [local, rest] = splitProps(omitFormInjected(props), [
        'aria-describedby',
        'aria-errormessage',
        'aria-invalid',
        'aria-label',
        'aria-labelledby',
        'aria-required',
        'arrowIcon',
        'autoAdjustOverflow',
        'autoExpandParent',
        'autoMergeValue',
        'borderless',
        'checkRelation',
        'class',
        'clearIcon',
        'clickToHide',
        'clickTriggerToHide',
        'defaultExpandAll',
        'defaultExpandedKeys',
        'defaultOpen',
        'defaultValue',
        'disableStrictly',
        'disabled',
        'dropdownClassName',
        'dropdownMatchSelectWidth',
        'dropdownStyle',
        'emptyContent',
        'expandAction',
        'expandAll',
        'expandIcon',
        'expandedKeys',
        'filterTreeNode',
        'icon',
        'keyMaps',
        'labelEllipsis',
        'leafOnly',
        'loadData',
        'loadedKeys',
        'maxTagCount',
        'motion',
        'motionExpand',
        'multiple',
        'onBlur',
        'onChange',
        'onChangeWithObject',
        'onClear',
        'onClick',
        'onExpand',
        'onFocus',
        'onFocusIn',
        'onFocusOut',
        'onKeyDown',
        'onLoad',
        'onMouseDown',
        'onSearch',
        'onSelect',
        'onVisibleChange',
        'optionListStyle',
        'outerBottomSlot',
        'outerTopSlot',
        'placeholder',
        'position',
        'prefix',
        'preventScroll',
        'ref',
        'remote',
        'renderFullLabel',
        'renderLabel',
        'renderSelectedItem',
        'restTagsPopoverProps',
        'searchAutoFocus',
        'searchPlaceholder',
        'searchPosition',
        'searchRender',
        'showClear',
        'showFilteredOnly',
        'showLine',
        'showRestTagsPopover',
        'showSearchClear',
        'size',
        'stopPropagation',
        'style',
        'suffix',
        'treeData',
        'treeNodeFilterProp',
        'treeNodeLabelProp',
        'triggerRender',
        'triggerTagWrap',
        'value',
        'virtualize',
    ]);

    const [, componentProps] = splitProps(props, ['ref']);

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const treeId = createUniqueId();
    const singleSearchTextId = createUniqueId();

    // An expression prop such as `treeData={list().map(...)}` is a getter that builds a new array on every read, while
    // deriveState compares treeData by reference and keeps a copy of the props: it reads one snapshot per prop change,
    // or every write-back would look like new data and never settle
    const snapshot = createMemo(() => Object.fromEntries(treeSelectDerivedPropKeys.map((key) => [key, (props as BasicTreeSelectProps)[key]])) as BasicTreeSelectProps);

    const { foundation, state } = useFoundation<Foundation, Adapter, BasicTreeSelectProps, BasicTreeSelectInnerData>(
        TreeSelectFoundation,
        props as BasicTreeSelectProps,
        () => TreeSelectFoundation.getInitialState(snapshot()),
        (base) => ({
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            updateState: (states) => base.setState(states as BasicTreeSelectInnerData),
            notifySelect: (selectKey, selected, node) => props.onSelect?.(selectKey, selected, node as TreeNodeData),
            notifySearch: (input, filteredExpandedKeys, filteredNodes) => props.onSearch?.(input, filteredExpandedKeys, filteredNodes as TreeNodeData[]),
            setCachedFlattenNodes: (cachedFlattenNodes) => base.setState({ cachedFlattenNodes }),
            notifyLoad: (loadedKeys, node) => props.onLoad?.(loadedKeys, node as TreeNodeData),
            notifyClear: (e) => props.onClear?.(e),
            openMenu: () => base.setState({ isOpen: true }),
            // a reopened dropdown starts without an active row
            closeMenu: () =>
                batch(() => {
                    base.setState({ isOpen: false });
                    keyboard.setKeyboardKey(null);
                }),
            notifyVisibleChange: (visible) => props.onVisibleChange?.(visible),
            notifyChange: (value, node, e) => props.onChange?.(value, node, e),
            notifyChangeWithObject: (node, e) => props.onChange?.(node, e),
            notifyExpand: (expandedKeys, { expanded, node }) => props.onExpand?.([...expandedKeys], { expanded, node: node as TreeNodeData }),
            notifyFocus: (e) => props.onFocus?.(e),
            notifyBlur: (e) => props.onBlur?.(e),
            focusInput: () => {
                searchInput?.focus({ preventScroll: props.preventScroll });
                tagInput?.focus();
            },
            focusTrigger: () => {
                if (root?.getAttribute('role') === 'combobox') {
                    focusElement(root);
                } else {
                    (searchInput ?? tagInput)?.focus();
                }
            },
            updateIsFocus: (isFocus) => base.setState({ isFocus }),
            isInTrigger: (node) => node instanceof Node && Boolean(root?.contains(node)),
        })
    );

    // the state that new props imply; written back before the DOM updates, so rows and handlers read one state
    const derived = createMemo(() => TreeSelectFoundation.deriveState(snapshot(), state()));
    const prefixNode = createIconSlot(() => local.prefix);
    const insetLabelNode = createIconSlot(() => props.insetLabel);
    const suffixNode = createIconSlot(() => local.suffix);
    const clearIcon = children(() => local.clearIcon);
    const arrowIcon = children(() => local.arrowIcon);

    const contextView = createMemo(() => ({
        treeDisabled: Boolean(local.disabled),
        multiple: Boolean(local.multiple),
        draggable: false,
        directory: false,
        expandAction: local.expandAction ?? false,
        hasLoadData: Boolean(local.loadData),
        labelEllipsis: Boolean(local.labelEllipsis ?? local.virtualize),
        dragOverNodeKey: null,
        dropPosition: null,
        renderLabel: local.renderLabel,
        renderFullLabel: local.renderFullLabel,
    }));

    const triggerRenderKeys = createMemo(() => TreeSelectFoundation.getTriggerKeys(props, state()));

    const rows = () => state().flattenNodes as FlattenNode[];

    // the row state Tree and TreeSelect share; prevProps holds each one's own props
    const rowState: Accessor<Omit<BasicTreeSelectInnerData, 'prevProps'>> = state;

    const rowProps = (node: FlattenNode) => buildRowProps(node, rowState(), props) as TreeRowProps | null;

    const reveal = (index: number, key: string) => {
        if (list) {
            list.scrollToItem(index);
            return;
        }
        // inside the dropdown, not the document: one in a ShadowRoot is out of document.getElementById's reach
        optionContainer?.querySelector(`#${CSS.escape(nodeId(treeId, key))}`)?.scrollIntoView({ block: 'nearest' });
    };

    const keyboard = useTreeKeyboard({
        // keys act on the live rows, so Enter never picks a row the keyword already filtered out
        rows,
        // an APG combobox opens without an active option
        defaultIndex: () => -1,
        rowProps,
        hasLoadData: () => Boolean(local.loadData),
        rtl: () => config().direction === 'rtl',
        editing: (event) => isTextEditor(event.target),
        select: foundation.handleNodeSelect,
        expand: foundation.handleNodeExpand,
        reveal,
    });

    const isActive = createSelector(keyboard.activeKey);

    const filterable = () => Boolean(local.filterTreeNode);

    const isTriggerPositionSearch = () => filterable() && local.searchPosition === strings.SEARCH_POSITION_TRIGGER;

    const isDropdownPositionSearch = () => local.searchPosition === strings.SEARCH_POSITION_DROPDOWN;

    const activeDescendant = () => {
        const key = keyboard.activeKey();
        return key === undefined ? undefined : nodeId(treeId, key);
    };

    // ARIA 1.2: a search input on the trigger is the combobox (`searchRender={false}` leaves single mode without one,
    // and a triggerRender replaces it); otherwise the trigger is a select-only combobox
    const inputIsCombobox = () => isTriggerPositionSearch() && !local.triggerRender && (Boolean(local.multiple) || local.searchRender !== false);

    // the search field is mounted exactly while it is the combobox; a searchRender one may be a textarea, and in
    // multiple mode it is the TagInput's input
    const comboboxElement = () => (inputIsCombobox() ? (searchInput ?? root?.querySelector('input')) : root);

    // the owner may clear the value while the clear button holds focus; the combobox takes it back
    const clearHandover = useFocusHandover<HTMLButtonElement>(comboboxElement);

    const markPressInside = useClickOutside(
        [() => root, () => optionContainer],
        foundation.handleClickOutside,
        // blur comes from a click outside, so it is listened to while focused, not only while open
        () => state().isOpen || state().isFocus
    );

    const prefixKind = () => prefixNode.kind();

    const insetLabelKind = () => insetLabelNode.kind();

    const suffixKind = () => suffixNode.kind();

    const labelKind = () => prefixKind() ?? insetLabelKind();

    const insetLabelShown = () => Boolean(insetLabelKind()) && !prefixKind() && !local.triggerRender;

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? `${treeId}-inset-label` : undefined);

    // The tree binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const name = () => comboboxName(local['aria-labelledby'], local['aria-label'], insetLabelShown() ? prefixId() : undefined, locale().locale.label);

    const comboboxAttrs = {
        role: 'combobox',
        get 'aria-activedescendant'() {
            return activeDescendant();
        },
        'aria-controls': treeId,
        get 'aria-describedby'() {
            return local['aria-describedby'];
        },
        get 'aria-errormessage'() {
            return local['aria-errormessage'];
        },
        get 'aria-expanded'() {
            return state().isOpen;
        },
        'aria-haspopup': 'tree',
        get 'aria-invalid'() {
            return local['aria-invalid'];
        },
        get 'aria-label'() {
            return name()['aria-label'];
        },
        get 'aria-labelledby'() {
            return name()['aria-labelledby'];
        },
        get 'aria-required'() {
            return local['aria-required'];
        },
    } as const;

    const getNodeData = (key: string) => TreeSelectFoundation.getNodeData(key, state().keyEntities, props) as TreeNodeData | undefined;

    const defaultRenderSelectedItem: RenderSelectedItemInMultiple = (item) => ({ isRenderInTag: true, content: get(item, local.keyMaps?.label ?? local.treeNodeLabelProp, null) as JSX.Element });

    const renderSelectedItem = () => (typeof local.renderSelectedItem === 'function' ? (local.renderSelectedItem as RenderSelectedItemInMultiple) : defaultRenderSelectedItem);

    const hasValue = () => TreeSelectFoundation.hasValue(props, state());

    const clearable = () => Boolean(local.showClear && (hasValue() || (local.searchPosition === strings.SEARCH_POSITION_TRIGGER && state().inputValue)) && !local.disabled);

    const tagSize = () => (local.size === 'small' ? 'small' : 'large');

    // the row a pointer acts on becomes the keyboard's row, in the same commit as the foundation's update
    const activate = (row: TreeRowProps, action: () => void) =>
        batch(() => {
            keyboard.setKeyboardKey(row.key);
            action();
        });

    const contextValue: TreeContextValue = {
        view: contextView,
        icon: () => local.icon,
        onNodeExpand: (e, row) => activate(row, () => foundation.handleNodeExpand(e, row)),
        onNodeSelect: (e, row) => activate(row, () => foundation.handleNodeSelect(e, row)),
        onNodeCheck: (e, row) => activate(row, () => foundation.handleNodeSelect(e, row)),
    };

    const search = (value: string) => foundation.search(value);

    const handleClear = (e?: MouseEvent) => {
        e?.stopPropagation();
        foundation.handleClear(e);
    };

    const removeTag = (key: string) => foundation.removeTag(key);

    const triggerRenderProps: TriggerRenderProps = {
        componentProps: componentProps as TriggerRenderProps['componentProps'],
        get disabled() {
            return Boolean(local.disabled);
        },
        get inputValue() {
            return state().inputValue;
        },
        get placeholder() {
            return local.placeholder;
        },
        get value() {
            return triggerRenderKeys().flatMap((key) => getNodeData(key) ?? []);
        },
        onClear: (e) => handleClear(e),
        onSearch: (value) => search(value),
        onRemove: (key) => removeTag(key),
    };

    // a tag closing calls this with its click or key; preventDefault keeps a controlled Tag from hiding itself
    const closeTag = (key: string) => (_content: unknown, e?: Event) => {
        e?.preventDefault();
        removeTag(key);
    };

    // Tree keys of the open popup (APG combobox with tree popup); returns whether the key was handled
    const handleTreeKeyDown = (e: KeyboardEvent) => state().isOpen && keyboard.handleKeyDown(e);

    const handleFocusIn = (e: FocusEvent) => foundation.handleTriggerFocus(e);

    // focus enters the dropdown through its search input or a field in a slot, and the dropdown is not a DOM
    // descendant of the trigger, so containment is checked against its popup layer
    const handleFocusLeave = (e: FocusEvent) => {
        // Chrome blurs the clear button as the update removes it; the handover gives the focus back to the combobox
        if (clearButton && e.target === clearButton && !clearable()) {
            return;
        }
        const target = e.relatedTarget;
        const inside = target instanceof Node && (Boolean(root?.contains(target)) || Boolean(optionContainer?.closest('[popover]')?.contains(target)));
        if (!inside) {
            foundation.handleFocusLeave(e);
        }
    };

    const handleClick = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onClick, e);
        foundation.handleClick(e);
    };

    const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onKeyDown, e);
        if (!isInnerControlKey(e) && !handleTreeKeyDown(e)) {
            const wasOpen = state().isOpen;
            foundation.handleSelectionKeyDown(e);
            // Home and End open the popup on the first or the last row
            if (!wasOpen && state().isOpen && (e.key === 'Home' || e.key === 'End')) {
                keyboard.handleKeyDown(e);
            }
        }
        foundation.handleKeyDown(e);
    };

    const handleMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onMouseDown, e);
        // refocusing the search input clears its text, so a press elsewhere keeps focus in it
        if (inputIsCombobox() && !isTextEditor(e.target)) {
            e.preventDefault();
        }
        markPressInside(e);
    };

    const handleTriggerFocusIn = (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusIn, e);
        handleFocusIn(e);
    };

    const handleTriggerFocusOut = (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, e);
        handleFocusLeave(e);
    };

    const triggerOwn = mergeProps(rest, () => (inputIsCombobox() ? {} : { ...comboboxAttrs, 'aria-disabled': local.disabled }), {
        get class() {
            if (local.triggerRender) {
                return clsx(local.class);
            }
            const emptyTriggerSearch = isTriggerPositionSearch() && state().checkedKeys.size === 0;
            return clsx(
                prefix,
                {
                    [`${prefix}-borderless`]: local.borderless,
                    [`${prefix}-focus`]: state().isFocus,
                    [`${prefix}-disabled`]: local.disabled,
                    [`${prefix}-single`]: !local.multiple,
                    [`${prefix}-multiple`]: local.multiple,
                    [`${prefix}-multiple-tagInput-empty`]: local.multiple && emptyTriggerSearch,
                    [`${prefix}-multiple-tagInput-notEmpty`]: local.multiple && isTriggerPositionSearch() && !emptyTriggerSearch,
                    [`${prefix}-filterable`]: filterable(),
                    [`${prefix}-error`]: props.validateStatus === 'error',
                    [`${prefix}-warning`]: props.validateStatus === 'warning',
                    [`${prefix}-small`]: local.size === 'small',
                    [`${prefix}-large`]: local.size === 'large',
                    [`${prefix}-with-prefix`]: Boolean(labelKind()),
                    [`${prefix}-with-suffix`]: Boolean(suffixKind()),
                    [`${prefix}-triggerTagWrap`]: Boolean(local.triggerTagWrap) && local.multiple && isTriggerPositionSearch(),
                },
                local.class
            );
        },
        get style() {
            return local.style;
        },
        get tabIndex() {
            return local.disabled || inputIsCombobox() ? -1 : 0;
        },
        onClick: handleClick,
        onFocusIn: handleTriggerFocusIn,
        onFocusOut: handleTriggerFocusOut,
        onKeyDown: handleKeyDown,
        onMouseDown: handleMouseDown,
    });

    // A press would focus the popup, which is hidden on close and drops the focus to body; the focus stays on the
    // trigger or the search input. A text field in a slot still takes the focus.
    const handleContainerMouseDown = (e: MouseEvent) => {
        if (!isTextEditor(e.target)) {
            e.preventDefault();
        }
        markPressInside(e);
    };

    const handleContainerKeyDown = (e: KeyboardEvent) => {
        handleTreeKeyDown(e);
        foundation.handleKeyDown(e);
    };

    const handleOpen = () => {
        foundation.handlePopoverOpen();
        // a key that opens the popup sets the row before the list mounts, so opening scrolls to it again
        const key = keyboard.activeKey();
        if (key !== undefined) {
            reveal(keyboard.activeIndex(), key);
        }
    };

    // ref.focus() focuses the combobox, as Tooltip and focus handover expect; it does not open the dropdown
    const focusTarget = () => comboboxElement() ?? root;

    const focusOptions = () => ({ preventScroll: props.preventScroll });

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        forwardFocus(node, focusTarget, focusOptions);
        // React's handle methods ride on the element: a Tooltip wrapping the TreeSelect needs the element itself as its ref
        Object.assign(node, {
            search: foundation.search,
            close: foundation.close,
        } satisfies TreeSelectHandle);
        registerTrigger(node);
    };

    const setSearchInput = (node: HTMLElement) => {
        searchInput = node;
        onCleanup(() => {
            if (searchInput === node) {
                searchInput = undefined;
            }
        });
    };

    const setTagInput = (node: HTMLDivElement) => {
        tagInput = node;
        onCleanup(() => {
            if (tagInput === node) {
                tagInput = undefined;
            }
        });
    };

    const setClearButton = (node: HTMLButtonElement) => {
        clearButton = node;
        clearHandover(node);
    };

    const setOptionContainer = (node: HTMLDivElement) => {
        optionContainer = node;
        onCleanup(() => {
            if (optionContainer === node) {
                optionContainer = undefined;
            }
        });
    };

    const searchAttrs = () => {
        if (isDropdownPositionSearch()) {
            // a search field over the trigger's tree, not a second combobox (React Aria Autocomplete pattern)
            return {
                'aria-activedescendant': activeDescendant(),
                'aria-autocomplete': 'list',
                'aria-controls': treeId,
                'aria-label': locale().locale.filter,
            } as const;
        }
        return {
            ...comboboxAttrs,
            'aria-autocomplete': 'list',
            // the input is empty until typing, so the selected text is exposed as the description
            'aria-describedby': joinIds(local['aria-describedby'], state().inputValue ? undefined : singleSearchTextId),
        } as const;
    };

    const searchClass = () => clsx({ [`${prefixTree}-input`]: isDropdownPositionSearch(), [`${prefix}-inputTrigger`]: !isDropdownPositionSearch() });

    const searchPlaceholder = () => (isDropdownPositionSearch() ? local.searchPlaceholder || locale().locale.searchPlaceholder : '');

    const searchPrefix = () => (isDropdownPositionSearch() ? <IconSearch /> : undefined);

    const handleSearchFocus = (e: FocusEvent) => {
        if (!isDropdownPositionSearch()) {
            foundation.handleInputTriggerFocus(e);
        }
    };

    const handleSearchBlur = (e: FocusEvent) => {
        if (!isDropdownPositionSearch()) {
            foundation.handleInputTriggerBlur(e);
        }
    };

    const searchRenderProps = mergeProps(searchAttrs, {
        get class() {
            return searchClass();
        },
        get value() {
            return state().inputValue;
        },
        get placeholder() {
            return searchPlaceholder();
        },
        get preventScroll() {
            return local.preventScroll;
        },
        get showClear() {
            return isDropdownPositionSearch() ? local.showSearchClear : undefined;
        },
        get prefix() {
            return searchPrefix();
        },
        get autofocus() {
            return isDropdownPositionSearch() ? undefined : local.searchAutoFocus;
        },
        get disabled() {
            return isDropdownPositionSearch() ? undefined : local.disabled;
        },
        get onFocus() {
            return isDropdownPositionSearch() ? undefined : handleSearchFocus;
        },
        get onBlur() {
            return isDropdownPositionSearch() ? undefined : handleSearchBlur;
        },
        onChange: (value: string) => search(value),
        ref: setSearchInput,
    }) as SearchRenderProps;

    const searchRenderFn = () => (typeof local.searchRender === 'function' ? local.searchRender : undefined);

    const SearchInput = () => (
        <Show when={local.searchRender !== false}>
            <div
                class={clsx({
                    [`${prefixTree}-search-wrapper`]: isDropdownPositionSearch(),
                    [`${prefix}-triggerSingleSearch-wrapper`]: !isDropdownPositionSearch() && !local.multiple,
                    [`${prefix}-triggerSingleSearch-upper`]: !isDropdownPositionSearch() && state().inputTriggerFocus,
                })}
            >
                <Show
                    keyed
                    when={searchRenderFn()}
                    fallback={
                        // global Input defaults must not add a clear button or adornments; the dropdown search sets its own
                        <Input
                            {...searchAttrs()}
                            inputRef={setSearchInput}
                            class={searchClass()}
                            placeholder={searchPlaceholder()}
                            value={state().inputValue}
                            preventScroll={local.preventScroll}
                            addonAfter={null}
                            addonBefore={null}
                            insetLabel={null}
                            suffix={null}
                            showClear={isDropdownPositionSearch() ? local.showSearchClear : false}
                            prefix={isDropdownPositionSearch() ? <IconSearch /> : null}
                            autofocus={isDropdownPositionSearch() ? undefined : local.searchAutoFocus}
                            disabled={isDropdownPositionSearch() ? undefined : local.disabled}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            onChange={(value) => search(value)}
                        />
                    }
                >
                    {(render) => render(searchRenderProps)}
                </Show>
            </div>
        </Show>
    );

    const TagInputTrigger = () => (
        // dropdown search is focused on open instead: autofocus in the off-screen popup scrolls the page to top
        <TagInput
            {...comboboxAttrs}
            ref={setTagInput}
            aria-autocomplete="list"
            autofocus={local.searchAutoFocus}
            disabled={local.disabled}
            placeholder={local.placeholder}
            value={triggerRenderKeys()}
            expandRestTagsOnClick={false}
            inputValue={state().inputValue}
            maxTagCount={local.maxTagCount}
            preventScroll={local.preventScroll}
            restTagsPopoverProps={local.restTagsPopoverProps}
            showRestTagsPopover={local.showRestTagsPopover}
            size={local.size}
            renderTagItem={(key, index) => <TagItem itemKey={key} index={index} />}
            onInputChange={(value) => search(value)}
            onRemove={(key) => removeTag(key)}
        />
    );

    const TagItem = (itemProps: { itemKey: string; index: number }) => {
        const item = createMemo(() => (normalizeKeyList([itemProps.itemKey], state().keyEntities, local.leafOnly, true).length ? getNodeData(itemProps.itemKey) : undefined));
        const closable = () => {
            const data = item();
            const hasData = Boolean(data) && Object.keys(data as object).length > 0;
            const strictlyDisabled = local.disableStrictly && hasData && state().disabledKeys.has(itemProps.itemKey);
            return hasData && !(data as TreeNodeData)[local.keyMaps?.disabled ?? 'disabled'] && !local.disabled && !strictlyDisabled;
        };
        const rendered = createMemo(() => {
            const data = item();
            return data ? renderSelectedItem()(data, { index: itemProps.index, onClose: closeTag(itemProps.itemKey) }) : undefined;
        });
        return (
            <Show when={rendered()}>
                {(result) => (
                    <Show when={result().isRenderInTag} fallback={result().content}>
                        <Tag class={clsx(`${prefix}-selection-tag`, { [`${prefix}-selection-tag-disabled`]: local.disabled })} closable={closable()} color="white" size={tagSize()} onClose={closeTag(itemProps.itemKey)}>
                            {result().content}
                        </Tag>
                    </Show>
                )}
            </Show>
        );
    };

    const tagList = () => triggerRenderKeys().flatMap((key) => (getNodeData(key) ? [{ tagKey: key }] : []));

    const renderTag = (tag: TagGroupItem, index: number) => {
        const key = tag.tagKey as string;
        const item = getNodeData(key);
        if (!item) {
            return undefined;
        }
        const onClose = closeTag(key);
        const { content, isRenderInTag } = renderSelectedItem()(item, { index, onClose });
        if (content == null) {
            return undefined;
        }
        const tagDisabled = local.disabled || item[local.keyMaps?.disabled ?? 'disabled'] || (local.disableStrictly && state().disabledKeys.has(key));
        return isRenderInTag ? (
            <Tag closable={!tagDisabled} color="white" visible size={tagSize()} onClose={onClose}>
                {content}
            </Tag>
        ) : (
            content
        );
    };

    // what the trigger shows for the single selection, created once per change by the branch that inserts it: a
    // createMemo runs on creation, so one in the body would build a renderSelectedItem element a triggerRender hides
    const createSingleText = () => createMemo(() => TreeSelectFoundation.getRenderTextInSingle(props, state()) as JSX.Element);

    // single selection with the search box on the trigger: the selected text shown beside the input
    const SingleTriggerSearchItem = () => {
        const singleText = createSingleText();
        return (
            <span
                id={singleSearchTextId}
                class={clsx(`${prefix}-selection-TriggerSearchItem`, {
                    [`${prefix}-selection-TriggerSearchItem-placeholder`]: (state().inputTriggerFocus || !isShownText(singleText())) && !local.disabled,
                    [`${prefix}-selection-TriggerSearchItem-disabled`]: local.disabled,
                })}
                onClick={foundation.onClickSingleTriggerSearchItem}
            >
                <Show when={isShownText(singleText())} fallback={local.placeholder}>
                    {singleText()}
                </Show>
            </span>
        );
    };

    const SingleSelection = () => {
        const singleText = createSingleText();
        return (
            <span class={clsx(`${prefix}-selection-content`, { [`${prefix}-selection-placeholder`]: !isShownText(singleText()) })}>
                <Show when={isShownText(singleText())} fallback={local.placeholder}>
                    {singleText()}
                </Show>
            </span>
        );
    };

    const SelectContent = () => (
        <Show
            when={isTriggerPositionSearch()}
            fallback={
                <Show when={local.multiple && hasValue()} fallback={<SingleSelection />}>
                    <TagGroup maxTagCount={local.maxTagCount} popoverProps={local.restTagsPopoverProps} showPopover={local.showRestTagsPopover} size={tagSize()} tagList={tagList()} renderTag={renderTag} />
                </Show>
            }
        >
            <Show
                when={local.multiple}
                fallback={
                    <>
                        <SearchInput />
                        <Show when={!state().inputValue}>
                            <SingleTriggerSearchItem />
                        </Show>
                    </>
                }
            >
                <TagInputTrigger />
            </Show>
        </Show>
    );

    const DefaultTrigger = () => (
        // the search input is part of the TreeSelect, not a control of an enclosing InputGroup
        <InputGroupContext.Provider value={undefined}>
            <Show when={labelKind()}>
                <div
                    id={prefixId()}
                    class={clsx(`${prefix}-prefix`, {
                        [`${prefix}-inset-label`]: Boolean(insetLabelKind()),
                        [`${prefix}-prefix-text`]: labelKind() === 'text',
                        [`${prefix}-prefix-icon`]: labelKind() === 'icon',
                    })}
                    x-semi-prop="prefix,insetLabel"
                >
                    {prefixKind() ? prefixNode() : insetLabelNode()}
                </div>
            </Show>
            <div class={`${prefix}-selection`}>
                <SelectContent />
            </div>
            <Show when={suffixKind()}>
                <div
                    class={clsx(`${prefix}-suffix`, {
                        [`${prefix}-suffix-text`]: suffixKind() === 'text',
                        [`${prefix}-suffix-icon`]: suffixKind() === 'icon',
                    })}
                    x-semi-prop="suffix"
                >
                    {suffixNode()}
                </div>
            </Show>
            <Show when={clearable()}>
                <button
                    ref={setClearButton}
                    type="button"
                    class={`${prefix}-clearbtn`}
                    aria-label={locale().locale.clear}
                    onClick={(e) => {
                        handleClear(e);
                        root?.focus();
                    }}
                    onKeyDown={stopButtonActivationKeys}
                >
                    <Show when={hasContent(clearIcon())} fallback={<IconClear />}>
                        {clearIcon()}
                    </Show>
                </button>
            </Show>
            <Show when={arrowIcon() === undefined || hasContent(arrowIcon())}>
                <div class={`${prefix}-arrow`} x-semi-prop="arrowIcon">
                    <Show when={arrowIcon() !== undefined} fallback={<IconChevronDown />}>
                        {arrowIcon()}
                    </Show>
                </div>
            </Show>
        </InputGroupContext.Provider>
    );

    const renderRow = (node: Accessor<FlattenNode | undefined>, style?: Accessor<JSX.CSSProperties>) => {
        const row = createMemo(
            () => {
                const current = node();
                return current ? rowProps(current) : null;
            },
            null,
            { equals: sameRow }
        );
        return <Show when={row()}>{(current) => <TreeNode expandIcon={local.expandIcon} focused={isActive(current().key)} id={nodeId(treeId, current().key)} row={current()} showLine={local.showLine} style={style?.()} />}</Show>;
    };

    const renderContent = () => {
        const outerTop = children(() => local.outerTopSlot);
        const outerBottom = children(() => local.outerBottomSlot);
        const emptyContent = children(() => local.emptyContent);
        const noData = () => {
            const { flattenNodes, inputValue, filteredKeys } = state();
            const searchNoRes = Boolean(inputValue) && !filteredKeys.size;
            return flattenNodes.length === 0 || (Boolean(local.showFilteredOnly) && searchNoRes);
        };
        const listClass = () => clsx(`${prefixTree}-option-list`, `${prefixTree}-option-list-block`, { [`${prefixTree}-option-list-hidden`]: emptyContent() === null && noData() });
        return (
            <div ref={setOptionContainer} class={clsx(local.dropdownClassName, `${prefix}-popover`)} style={local.dropdownStyle} onFocusIn={handleFocusIn} onFocusOut={handleFocusLeave} onKeyDown={handleContainerKeyDown} onMouseDown={handleContainerMouseDown}>
                <TreeContext.Provider value={contextValue}>
                    <div class={`${prefixTree}-wrapper`}>
                        <Show when={hasContent(outerTop())} fallback={<Show when={filterable() && isDropdownPositionSearch()}>{<SearchInput />}</Show>}>
                            {outerTop()}
                        </Show>
                        <Show
                            when={!noData()}
                            fallback={
                                // the combobox's aria-controls needs an element while there is no tree
                                <div id={treeId} class={listClass()} style={local.optionListStyle} role="none">
                                    <Show when={emptyContent() !== null}>
                                        <ul class={clsx(`${prefixTree}-option`, `${prefixTree}-option-empty`)}>
                                            <li class={clsx(`${prefixTree}-option-label`, `${prefixTree}-option-label-empty`)} x-semi-prop="emptyContent">
                                                {hasContent(emptyContent()) ? emptyContent() : treeLocale().locale.emptyText}
                                            </li>
                                        </ul>
                                    </Show>
                                </div>
                            }
                        >
                            <div id={treeId} class={listClass()} style={local.optionListStyle} aria-label={name()['aria-label']} aria-labelledby={name()['aria-labelledby']} aria-multiselectable={Boolean(local.multiple)} role="tree">
                                <NodeList
                                    flattenList={state().cachedFlattenNodes as FlattenNode[] | undefined}
                                    flattenNodes={rows()}
                                    listRef={(handle) => (list = handle)}
                                    motion={Boolean(local.motionExpand)}
                                    motionKeys={state().motionKeys}
                                    motionType={state().motionType}
                                    renderRow={renderRow}
                                    virtualize={local.virtualize}
                                />
                            </div>
                        </Show>
                        {outerBottom()}
                    </div>
                </TreeContext.Provider>
            </div>
        );
    };

    createComputed(on(derived, (value) => value && foundation.syncDerivedState(value)));

    return (
        <Popover
            style={local.dropdownMatchSelectWidth ? { 'min-width': 'var(--semi-tooltip-trigger-width)' } : undefined}
            role="presentation"
            afterClose={foundation.handleAfterClose}
            autoAdjustOverflow={local.autoAdjustOverflow}
            content={renderContent}
            // the combobox moves through the tree itself; the focus stays on it (APG)
            disableArrowKeyDown
            motion={local.motion}
            position={local.position ?? (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft')}
            stopPropagation={local.stopPropagation}
            trigger="custom"
            visible={state().isOpen}
            onOpen={handleOpen}
        >
            {(getTriggerProps) => (
                <div
                    {...(getTriggerProps(
                        mergeProps(triggerOwn, {
                            // the spread memoizes this call and tracks the read; a spread signal object would call the ref again on any change
                            ref: untrack(() => mergeRefs<TreeSelectElement>(setRoot as (node: TreeSelectElement) => void, local.ref)),
                        })
                    ) as JSX.HTMLAttributes<HTMLDivElement>)}
                >
                    <Show when={local.triggerRender} keyed fallback={<DefaultTrigger />}>
                        {(render) => render(triggerRenderProps)}
                    </Show>
                </div>
            )}
        </Popover>
    );
}
