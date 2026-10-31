import { type JSX, type Ref, For, Index, Show, batch, children, createMemo, createUniqueId, mergeProps, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/cascader/constants';
import CascaderFoundation, { type BasicCascaderInnerData, type BasicCascaderProps, type BasicTriggerRenderProps, type BasicScrollPanelProps, type BasicValue, type CascaderAdapter, type Virtualize } from '@fibrae/semi-foundation/cascader/foundation';
import { calcMergeType } from '@fibrae/semi-foundation/cascader/util';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { isInnerControlKey, isTextEditor, joinIds, stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/cascader/cascader.scss';
import { IconChevronDown, IconClear } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import { focusElement } from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import mergeRefs from '../_base/merge-refs';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import type { VirtualListHandle } from '../_base/virtual-list';
import useConfig from '../config-provider/use-config';
import type { InputGroupContextValue } from '../input/context';
import InputGroupBoundary from '../input/group-boundary';
import Input, { type ValidateStatus } from '../input/input';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverProps } from '../popover';
import Tag from '../tag';
import TagInput from '../tag-input';
import type { Position } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import Item, { type CascaderData, type Data, type Entity, type FilterRenderProps } from './item';

export type { KeyMapProps, ShowNextType } from '@fibrae/semi-foundation/cascader/foundation';

export type CascaderType = Size;

/**
 * `true extends Multiple` rather than `Multiple extends true`: the outer conditional distributes, so a `boolean`
 * multiple gives both shapes
 */
type ByMultiple<Multiple, Single, Many> = Multiple extends unknown ? (true extends Multiple ? Many : Single) : never;

export interface ScrollPanelProps extends BasicScrollPanelProps {
    activeNode: CascaderData;
}

/** Live like component props: read the fields where they are used */
export interface TriggerRenderProps<Multiple extends boolean | undefined = undefined> extends Omit<BasicTriggerRenderProps, 'componentProps' | 'value' | 'inputValue' | 'onClear'> {
    /** The Cascader's props without `ref` */
    componentProps: Omit<CascaderProps<boolean>, 'ref'>;
    /** The position in treeData (such as `0-0-1`) of the selected node, or in multiple mode of each checked node */
    value: ByMultiple<Multiple, string | undefined, Set<string>>;
    /** The search text while open; the selected path (what `displayRender` returns) while closed */
    inputValue: JSX.Element;
    /** Pass the click event when bound to a control inside the trigger, so the click does not open the dropdown */
    onClear: (e?: MouseEvent) => void;
}

/* The basic type of the value of Cascader */
export type SimpleValueType = string | number | CascaderData;

/* The value of Cascader */
export type Value = SimpleValueType | Array<SimpleValueType> | Array<Array<SimpleValueType>>;

/** A single-mode value is one node or its path; a multiple-mode value may also be a list of paths */
type ModeValue<Multiple> = ByMultiple<Multiple, SimpleValueType | Array<SimpleValueType>, Value>;

/** The methods on a Cascader ref */
export interface CascaderHandle {
    open: () => void;
    close: () => void;
    focus: () => void;
    blur: () => void;
    /** Searches as if `value` were typed; needs `filterTreeNode` */
    search: (value: string) => void;
}

export type CascaderElement = HTMLDivElement & CascaderHandle;

/**
 * `Multiple` follows the `multiple` prop, so that `value`, `onChange`, `displayRender` and `triggerRender` take the
 * shapes of the mode in use
 */
export interface CascaderProps<Multiple extends boolean | undefined = undefined> extends ElementProps<'div', 'children' | 'prefix' | 'defaultValue' | 'onChange' | 'onSelect' | 'onLoad' | 'onBlur' | 'onFocus' | 'ref'> {
    'aria-label'?: string;
    id?: string;
    multiple?: Multiple;
    /** `null` shows no arrow */
    arrowIcon?: JSX.Element;
    clearIcon?: JSX.Element;
    /** Rendered in each branch option, so it is written inline: one node can sit in one place only */
    expandIcon?: JSX.Element;
    defaultValue?: ModeValue<Multiple>;
    value?: ModeValue<Multiple>;
    dropdownClassName?: string;
    dropdownStyle?: JSX.CSSProperties | string;
    /** `null` hides the empty state */
    emptyContent?: JSX.Element;
    motion?: boolean;
    borderless?: boolean;
    separator?: string;
    changeOnSelect?: boolean;
    autoMergeValue?: boolean;
    disabled?: boolean;
    filterTreeNode?: ((inputValue: string, treeNodeString: string, data?: CascaderData) => boolean) | boolean;
    /** `first` and `second` are the two result paths, from the root to the matched node */
    filterSorter?: (first: CascaderData[], second: CascaderData[], inputValue: string) => number;
    /** Called once per search result with live props */
    filterRender?: (props: FilterRenderProps) => JSX.Element;
    filterLeafOnly?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
    /** An enclosing InputGroup's size applies when this is not set */
    size?: CascaderType;
    treeData?: Array<CascaderData>;
    treeNodeFilterProp?: string;
    displayProp?: string;
    maxTagCount?: number;
    max?: number;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: PopoverProps;
    prefix?: JSX.Element;
    suffix?: JSX.Element;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    stopPropagation?: boolean | string;
    showClear?: boolean;
    autoAdjustOverflow?: boolean;
    defaultOpen?: boolean;
    onChangeWithObject?: boolean;
    bottomSlot?: JSX.Element;
    topSlot?: JSX.Element;
    showNext?: 'click' | 'hover';
    disableStrictly?: boolean;
    leafOnly?: boolean;
    enableLeafClick?: boolean;
    clickToSelect?: boolean;
    preventScroll?: boolean;
    virtualizeInSearch?: Virtualize;
    checkRelation?: typeof strings.RELATED | typeof strings.UN_RELATED;
    remote?: boolean;
    keyMaps?: BasicCascaderProps['keyMaps'];
    /** Called once with live props; replaces the trigger content */
    triggerRender?: (props: TriggerRenderProps<Multiple>) => JSX.Element;
    onListScroll?: (e: Event, panel: ScrollPanelProps) => void;
    loadData?: (selectOptions: CascaderData[]) => Promise<void>;
    onLoad?: (newLoadedKeys: Set<string>, data: CascaderData) => void;
    /** Receives the selected path, or in multiple mode the checked paths; their nodes with `onChangeWithObject` */
    onChange?: (value: ByMultiple<Multiple, Array<SimpleValueType>, Array<Array<SimpleValueType>>>) => void;
    /** In multiple mode a single checked node gives its value, more give an array */
    onSelect?: (value: ByMultiple<Multiple, string | number, string | number | Array<string | number>>) => void;
    onExceed?: (checkedItem: Entity[]) => void;
    onClear?: () => void;
    onDropdownVisibleChange?: (visible: boolean) => void;
    onSearch?: (value: string) => void;
    /** Renders the selected path's labels, or in multiple mode one tag per checked node */
    displayRender?: ByMultiple<Multiple, (selected: Array<string | number>) => JSX.Element, (selected: Entity, idx: number) => JSX.Element>;
    /** Content of an option in the columns; the search results, the selection and the tags show the label text */
    renderLabel?: (item: CascaderData) => JSX.Element;
    /** Focus entering the trigger or the dropdown from outside passes the `focusin` event; moving within them does not report again. A click or key that reopens after a pick closed it reports it too */
    onFocus?: (e: MouseEvent | KeyboardEvent | FocusEvent) => void;
    /** Once per focus: the mousedown outside, the click or key that picks and closes, or the `focusout` that leaves the trigger and the dropdown */
    onBlur?: (e?: MouseEvent | KeyboardEvent | FocusEvent) => void;
    validateStatus?: ValidateStatus;
    position?: Position;
    searchPosition?: typeof strings.SEARCH_POSITION_TRIGGER | typeof strings.SEARCH_POSITION_CUSTOM;
    /** The trigger element with the CascaderHandle methods; its `focus()` focuses the combobox without opening the dropdown */
    ref?: Ref<CascaderElement>;
}

// The body serves both modes, so it reads the mode-dependent props through one wide type
interface CascaderBodyProps extends Omit<CascaderProps<boolean>, 'value' | 'defaultValue' | 'onChange' | 'onSelect' | 'displayRender' | 'triggerRender'> {
    value?: Value;
    defaultValue?: Value;
    onChange?: (value: Value) => void;
    onSelect?: (value: string | number | Array<string | number>) => void;
    displayRender?: ((selected: Array<string | number>) => JSX.Element) | ((selected: Entity, idx: number) => JSX.Element);
    triggerRender?: (props: TriggerRenderProps<boolean>) => JSX.Element;
}

type FoundationEvent = MouseEvent | KeyboardEvent;
type Foundation = CascaderFoundation<FoundationEvent, Event>;
type Adapter = CascaderAdapter<FoundationEvent, Event>;

const prefixcls = cssClasses.PREFIX;

// size and disabled are left out: they resolve through an enclosing InputGroup
const defaultProps = {
    borderless: false,
    leafOnly: false,
    stopPropagation: true,
    motion: true,
    defaultOpen: false,
    showClear: false,
    changeOnSelect: false,
    disableStrictly: false,
    autoMergeValue: true,
    multiple: false,
    filterTreeNode: false,
    filterLeafOnly: true,
    showRestTagsPopover: false,
    separator: ' / ',
    treeNodeFilterProp: 'label',
    displayProp: 'label',
    treeData: [],
    showNext: strings.SHOW_NEXT_BY_CLICK,
    enableLeafClick: false,
    clickToSelect: false,
    searchPosition: strings.SEARCH_POSITION_TRIGGER,
    checkRelation: strings.RELATED,
    remote: false,
} satisfies Partial<CascaderBodyProps>;

export default function Cascader<Multiple extends boolean | undefined = undefined>(rawProps: CascaderProps<Multiple>) {
    return <InputGroupBoundary>{(inGroup) => <CascaderControl {...(rawProps as CascaderBodyProps)} inGroup={inGroup} />}</InputGroupBoundary>;
}

function CascaderControl(all: CascaderBodyProps & { inGroup?: InputGroupContextValue }) {
    const [own, bodyProps] = splitProps(all, ['inGroup']);
    const defaulted = useDefaultProps('Cascader', bodyProps, defaultProps);

    const config = useConfig();
    const locale = useLocale('Cascader');

    const popupId = createUniqueId();
    const selectionTextId = createUniqueId();
    let root: HTMLDivElement | undefined;
    let searchInput: HTMLInputElement | undefined;
    let tagInput: HTMLDivElement | undefined;
    let optionContainer: HTMLDivElement | undefined;
    let virtualList: VirtualListHandle | undefined;

    // fixed for the instance's lifetime: the layer and the context value are
    const inGroup = untrack(() => own.inGroup);

    // as Input: own value, then the group's, then the global default
    const props = mergeProps(defaulted, {
        get size() {
            return bodyProps.size ?? inGroup?.view().size ?? defaulted.size ?? 'default';
        },
        get disabled() {
            return bodyProps.disabled ?? inGroup?.view().disabled ?? defaulted.disabled ?? false;
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
        'autoMergeValue',
        'borderless',
        'bottomSlot',
        'changeOnSelect',
        'checkRelation',
        'class',
        'clearIcon',
        'clickToSelect',
        'defaultOpen',
        'defaultValue',
        'disableStrictly',
        'disabled',
        'displayProp',
        'displayRender',
        'dropdownClassName',
        'dropdownStyle',
        'emptyContent',
        'enableLeafClick',
        'expandIcon',
        'filterLeafOnly',
        'filterRender',
        'filterSorter',
        'filterTreeNode',
        'id',
        'keyMaps',
        'leafOnly',
        'loadData',
        'max',
        'maxTagCount',
        'motion',
        'multiple',
        'onBlur',
        'onChange',
        'onChangeWithObject',
        'onClear',
        'onClick',
        'onDropdownVisibleChange',
        'onExceed',
        'onFocus',
        'onFocusIn',
        'onFocusOut',
        'onKeyDown',
        'onListScroll',
        'onLoad',
        'onMouseDown',
        'onSearch',
        'onSelect',
        'placeholder',
        'position',
        'prefix',
        'preventScroll',
        'ref',
        'remote',
        'renderLabel',
        'restTagsPopoverProps',
        'searchPlaceholder',
        'searchPosition',
        'separator',
        'showClear',
        'showNext',
        'showRestTagsPopover',
        'size',
        'stopPropagation',
        'style',
        'suffix',
        'topSlot',
        'treeData',
        'treeNodeFilterProp',
        'triggerRender',
        'value',
        'virtualizeInSearch',
    ]);

    const [, componentProps] = splitProps(props, ['ref']);

    // displayRender returns nodes: the foundation would keep them as the search text, which is a string here
    const [, foundationProps] = splitProps(props, ['ref', 'displayRender']) as [unknown, BasicCascaderProps];

    const { foundation, state } = useFoundation<Foundation, Adapter, BasicCascaderProps, BasicCascaderInnerData>(
        CascaderFoundation,
        foundationProps,
        (view) => CascaderFoundation.getInitialState(view),
        (base) => ({
            focusCombobox: () => focusCombobox(),
            blurCombobox: () => {
                searchInput?.blur();
                tagInput?.blur();
                if (root) {
                    HTMLElement.prototype.blur.call(root);
                }
            },
            updateStates: (states) => base.setState(states as BasicCascaderInnerData),
            notifyChange: (value) => props.onChange?.(value as Value),
            notifySelect: (selected) => props.onSelect?.(selected),
            notifyOnSearch: (input) => props.onSearch?.(input),
            notifyFocus: (e) => props.onFocus?.(e),
            notifyBlur: (e) => props.onBlur?.(e as FoundationEvent | undefined),
            notifyDropdownVisibleChange: (visible) => props.onDropdownVisibleChange?.(visible),
            notifyLoadData: (selectedOpt, callback, onReject) => {
                const loading = props.loadData?.(selectedOpt as CascaderData[]);
                if (!loading) {
                    return;
                }
                loading.then(undefined, onReject);
                // A treeData update applies synchronously, so loadData's own update is in place once it resolves. The
                // rejection is left unhandled on this chain on purpose, so it still reaches the caller
                void loading.then(() => callback());
            },
            notifyOnLoad: (newLoadedKeys, data) => props.onLoad?.(newLoadedKeys, data as CascaderData),
            notifyListScroll: (e, panel) => props.onListScroll?.(e, panel as ScrollPanelProps),
            notifyOnExceed: (data) => props.onExceed?.(data as Entity[]),
            notifyClear: () => props.onClear?.(),
            toggleInputShow: (showInput, cb) => {
                const focusInTrigger = root?.contains(FocusTrapHandle.getActiveElement(root));
                base.setState({ showInput }, () => {
                    // unmounting the focused search input would drop focus to the body; the trigger is the
                    // combobox again, so it takes focus back
                    if (!showInput && focusInTrigger && root) {
                        focusElement(root, { preventScroll: true });
                    }
                    cb();
                });
            },
            scrollToOption: (key, index) => {
                if (virtualList) {
                    virtualList.scrollToItem(index);
                } else {
                    optionContainer?.querySelector(`#${CSS.escape(optionId(key))}`)?.scrollIntoView({ block: 'nearest' });
                }
            },
        })
    );

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const markPressInside = useClickOutside(
        [() => root, () => optionContainer],
        (e) => {
            if (optionContainer) {
                foundation.handleClickOutside(e);
            }
        },
        () => state().isOpen
    );

    // the owner may clear the value while the clear button holds focus; the combobox takes it back
    const clearHandover = useFocusHandover<HTMLButtonElement>(() => (inputIsCombobox() ? root?.querySelector('input') : root));

    const prefixNode = createIconSlot(() => local.prefix);
    const insetLabelNode = createIconSlot(() => props.insetLabel);
    const suffixNode = createIconSlot(() => local.suffix);
    const clearIcon = children(() => local.clearIcon);
    const arrowIcon = children(() => local.arrowIcon);

    // multiple mode derives keyEntities and the checked sets from props, so they reach the DOM with the props
    const multipleView = createMemo(() => (local.multiple ? CascaderFoundation.deriveMultipleState(foundationProps, state()) : undefined));

    const view = mergeProps(state(), () => multipleView() ?? {}) as BasicCascaderInnerData;

    const renderData = createMemo(() => CascaderFoundation.getRenderData(foundationProps, view) as Array<Entity | Data>);

    const inputPlaceholder = () => local.searchPlaceholder || local.placeholder;

    const mergeType = () => calcMergeType(local.autoMergeValue, local.leafOnly);

    const triggerSearch = () => Boolean(local.filterTreeNode) && local.searchPosition === strings.SEARCH_POSITION_TRIGGER;

    const position = () => local.position ?? (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft');

    const isEmpty = () => !renderData().length;

    const realKeys = () => (mergeType() === strings.NONE_MERGE_TYPE || local.checkRelation === strings.UN_RELATED ? view.checkedKeys : view.resolvedCheckedKeys);

    const keyEntities = () => view.keyEntities as Record<string, Entity>;

    // ids are IDREFs for aria-activedescendant, so a key with spaces is encoded
    const optionId = (key: string) => `${popupId}-option-${encodeURIComponent(key)}`;

    // multiple mode shows tags; its displayRender renders one tag
    const selectedPath = createMemo(() => {
        const [key] = view.selectedKeys;
        return key === undefined || local.multiple ? undefined : (CascaderFoundation.getItemPropPath(key, local.displayProp, view.keyEntities) as Array<string | number>);
    });

    const displayText = children(() => {
        const path = selectedPath();
        if (!path) {
            return undefined;
        }
        const render = local.displayRender as ((selected: Array<string | number>) => JSX.Element) | undefined;
        if (render) {
            return untrack(() => render(path));
        }
        return (
            <Index each={path}>
                {(label, index) => (
                    <>
                        {index > 0 ? local.separator : null}
                        {label()}
                    </>
                )}
            </Index>
        );
    });

    const triggerRenderProps: TriggerRenderProps<boolean> = {
        componentProps: componentProps as TriggerRenderProps<boolean>['componentProps'],
        get disabled() {
            return Boolean(local.disabled);
        },
        get placeholder() {
            return inputPlaceholder();
        },
        get value() {
            const entities = keyEntities();
            if (local.multiple) {
                // the trigger gets positions; mergeType decides which checked set they come from, whatever checkRelation is
                const keys = mergeType() === strings.NONE_MERGE_TYPE ? view.checkedKeys : view.resolvedCheckedKeys;
                return new Set([...keys].map((key) => entities[key]?.pos));
            }
            return entities[[...view.selectedKeys][0]]?.pos;
        },
        get inputValue() {
            // the foundation keeps the path text while closed; a displayRender gives the node it renders
            const closedWithRender = !view.isOpen && !local.multiple && local.filterTreeNode && local.displayRender && selectedPath();
            return closedWithRender ? displayText() : view.inputValue;
        },
        onSearch: (value) => handleInputChange(value),
        onClear: (e) => handleClear(e),
        onRemove: foundation.handleTagRemoveInTrigger,
    };

    const keyboardKey = () => (view.isOpen ? CascaderFoundation.getKeyboardKey(view) : null);

    const prefixKind = () => prefixNode.kind();

    const insetLabelKind = () => insetLabelNode.kind();

    const suffixKind = () => suffixNode.kind();

    const labelKind = () => prefixKind() ?? insetLabelKind();

    // A rendered inset label names the combobox and the tree, so it needs an id even when the caller gives none
    const insetLabelShown = () => Boolean(insetLabelKind()) && !prefixKind() && !local.triggerRender;

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? `${popupId}-inset-label` : undefined);

    // The popup binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const name = () => comboboxName(local['aria-labelledby'], local['aria-label'], insetLabelShown() ? prefixId() : undefined, locale().locale.label);

    const comboboxAttrs = {
        role: 'combobox',
        get 'aria-activedescendant'() {
            const key = keyboardKey();
            return key === null ? undefined : optionId(key);
        },
        'aria-controls': popupId,
        get 'aria-describedby'() {
            return local['aria-describedby'];
        },
        get 'aria-errormessage'() {
            return local['aria-errormessage'];
        },
        get 'aria-expanded'() {
            return view.isOpen;
        },
        get 'aria-haspopup'() {
            return local.filterTreeNode && view.isSearching ? 'listbox' : 'tree';
        },
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

    // ARIA 1.2: the search input is the combobox while mounted (only when searching), else the trigger is a
    // select-only combobox exposing the selected path as its value. A triggerRender replaces the input
    const inputIsCombobox = () => triggerSearch() && !local.triggerRender && (Boolean(local.multiple) || Boolean(view.showInput));

    // multiple mode keeps no selectedKeys beyond the one getInitialState writes; its value also holds controlled paths without tags
    const clearable = () => Boolean(local.showClear && (view.inputValue || (local.multiple ? CascaderFoundation.hasMultipleValue(foundationProps, view) : view.selectedKeys.size)) && !local.disabled);

    const tagSize = () => (local.size === 'default' ? 'large' : local.size);

    const focusCombobox = (options?: FocusOptions) => {
        const focusOptions = { preventScroll: props.preventScroll, ...options };
        if (searchInput) {
            searchInput.focus(focusOptions);
        } else if (tagInput) {
            tagInput.focus(focusOptions);
        } else if (root) {
            focusElement(root, focusOptions);
        }
    };

    const handleInputChange = (input: string) => foundation.handleInputChange(input);

    const handleOptionKeyDown = (e: KeyboardEvent) =>
        foundation.handleOptionKeyDown(e, {
            editing: isTextEditor(e.target),
            rtl: config().direction === 'rtl',
        });

    const handleContentKeyDown = (e: KeyboardEvent) =>
        batch(() => {
            handleOptionKeyDown(e);
            foundation.handleKeyDown(e);
        });

    const handleClear = (e?: MouseEvent) => {
        e?.stopPropagation();
        foundation.handleClear();
    };

    const handleClick = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onClick, e);
        foundation.handleClick(e);
    };

    const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onKeyDown, e);
        batch(() => {
            if (!isInnerControlKey(e)) {
                foundation.handleSelectionKeyDown(e);
            }
            foundation.handleKeyDown(e);
        });
    };

    // ahead of the search input: an Enter that picks the current option must not reach TagInput, which would also
    // take the typed text as a new tag
    const handleKeyDownCapture = (e: KeyboardEvent) => {
        if (!isInnerControlKey(e) && handleOptionKeyDown(e)) {
            // stopping it here also skips the delegated handlers, so the owner hears the key now
            callHandler(local.onKeyDown, e as KeyboardEvent & { currentTarget: HTMLDivElement; target: Element });
            e.stopPropagation();
        }
    };

    const handleMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onMouseDown, e);
        markPressInside(e);
    };

    const handleFocusIn = (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusIn, e);
        foundation.handleFocusEnter(e);
    };

    // focus enters the dropdown through a field in a slot, and the dropdown is not a DOM descendant of the trigger, so
    // containment is checked against its popup layer
    const handleFocusLeave = (e: FocusEvent) => {
        const target = e.relatedTarget;
        const inside = target instanceof Node && (Boolean(root?.contains(target)) || Boolean(optionContainer?.closest('[popover]')?.contains(target)));
        if (!inside) {
            foundation.handleFocusLeave(e);
        }
    };

    const handleTriggerFocusOut = (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, e);
        handleFocusLeave(e);
    };

    const triggerOwn = mergeProps(rest, () => (inputIsCombobox() ? {} : { ...comboboxAttrs, 'aria-disabled': local.disabled }), {
        get id() {
            return local.id;
        },
        get class() {
            return local.triggerRender
                ? clsx(local.class)
                : clsx(prefixcls, local.class, {
                      [`${prefixcls}-borderless`]: local.borderless,
                      [`${prefixcls}-focus`]: view.isOpen,
                      [`${prefixcls}-disabled`]: local.disabled,
                      [`${prefixcls}-single`]: true,
                      [`${prefixcls}-filterable`]: Boolean(local.filterTreeNode),
                      [`${prefixcls}-error`]: props.validateStatus === 'error',
                      [`${prefixcls}-warning`]: props.validateStatus === 'warning',
                      [`${prefixcls}-small`]: local.size === 'small',
                      [`${prefixcls}-large`]: local.size === 'large',
                      [`${prefixcls}-with-prefix`]: Boolean(labelKind()),
                      [`${prefixcls}-with-suffix`]: Boolean(suffixKind()),
                  });
        },
        get style() {
            return local.style;
        },
        get tabIndex() {
            return local.disabled || inputIsCombobox() ? -1 : 0;
        },
        onClick: handleClick,
        onFocusIn: handleFocusIn,
        onFocusOut: handleTriggerFocusOut,
        onKeyDown: handleKeyDown,
        onMouseDown: handleMouseDown,
    });

    // a press would focus the popup, which is hidden on close and drops the focus to body; the focus stays on the
    // trigger. A text field in a slot still takes the focus.
    const handleContainerMouseDown = (e: MouseEvent) => {
        if (!isTextEditor(e.target)) {
            e.preventDefault();
        }
        markPressInside(e);
    };

    const handleClearClick = (e: MouseEvent) => {
        handleClear(e);
        if (inputIsCombobox()) {
            foundation.focus();
        } else if (root) {
            focusElement(root);
        }
    };

    const removeTag = (key: string, e: Event) => {
        // the value has not changed yet, so the close button must not close the tag itself
        e.preventDefault();
        foundation.handleTagRemoveByKey(key);
    };

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        // ref.focus() focuses the combobox, as Tooltip and focus handover expect; it does not open the dropdown
        node.focus = (options) => untrack(() => focusCombobox(options));
        node.blur = foundation.blur;
        // React's handle methods ride on the element: a Tooltip wrapping the Cascader needs the element itself as its ref
        Object.assign(node, {
            open: foundation.open,
            close: foundation.close,
            search: (value: string) => foundation.handleInputChange(value),
        } satisfies Omit<CascaderHandle, 'focus' | 'blur'>);
        registerTrigger(node);
        const controller = new AbortController();
        node.addEventListener('keydown', handleKeyDownCapture, { capture: true, signal: controller.signal });
        onCleanup(() => controller.abort());
    };

    const setSearchInput = (node: HTMLInputElement) => {
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

    const setOptionContainer = (node: HTMLDivElement) => {
        optionContainer = node;
        onCleanup(() => {
            if (optionContainer === node) {
                optionContainer = undefined;
            }
        });
    };

    const setVirtualList = (handle?: VirtualListHandle) => {
        virtualList = handle;
    };

    const SelectionTag = (tagProps: { nodeKey: string; index: number }) => {
        const entity = () => keyEntities()[tagProps.nodeKey];
        const isDisabled = () => Boolean(local.disabled || entity()?.data.disabled || (local.disableStrictly && view.disabledKeys?.has(tagProps.nodeKey)));
        // not keyed by the entity: a treeData update rebuilds every entity, and the focused tag must stay in place
        return (
            <Show when={entity()}>
                {(item) => (
                    <Show
                        when={local.displayRender as ((selected: Entity, idx: number) => JSX.Element) | undefined}
                        keyed
                        fallback={
                            <Tag class={clsx(`${prefixcls}-selection-tag`, { [`${prefixcls}-selection-tag-disabled`]: isDisabled() })} closable={!isDisabled()} color="white" size={tagSize()} tagKey={tagProps.nodeKey} onClose={(_children, e) => removeTag(tagProps.nodeKey, e)}>
                                {item().data[local.displayProp] as JSX.Element}
                            </Tag>
                        }
                    >
                        {(render) => (
                            <Show when={item()} keyed>
                                {(current) => render(current, tagProps.index)}
                            </Show>
                        )}
                    </Show>
                )}
            </Show>
        );
    };

    const MultipleTags = () => {
        const keys = createMemo(() => [...realKeys()]);
        const shownCount = () => (typeof local.maxTagCount === 'number' ? Math.min(local.maxTagCount, keys().length) : keys().length);
        const restLabel = (triggerProps?: object) => (
            <span {...triggerProps} class={clsx(`${prefixcls}-selection-n`, { [`${prefixcls}-selection-n-disabled`]: local.disabled })}>
                +{keys().length - shownCount()}
            </span>
        );
        return (
            <>
                <For each={keys().slice(0, shownCount())}>{(key, index) => <SelectionTag nodeKey={key} index={index()} />}</For>
                <Show when={keys().length > shownCount()}>
                    <Show when={local.showRestTagsPopover} fallback={restLabel()}>
                        <Popover autoAdjustOverflow content={<For each={keys().slice(shownCount())}>{(key, index) => <SelectionTag nodeKey={key} index={shownCount() + index()} />}</For>} position="top" showArrow trigger="hover" {...local.restTagsPopoverProps}>
                            {(getTriggerProps) => restLabel(getTriggerProps())}
                        </Popover>
                    </Show>
                </Show>
            </>
        );
    };

    const SearchTagInput = () => (
        <TagInput
            ref={setTagInput}
            class={`${prefixcls}-tagInput-wrapper`}
            {...comboboxAttrs}
            aria-autocomplete="list"
            disabled={local.disabled}
            placeholder={inputPlaceholder()}
            value={[...realKeys()]}
            expandRestTagsOnClick={false}
            inputValue={view.inputValue}
            maxTagCount={local.maxTagCount}
            preventScroll={local.preventScroll}
            restTagsPopoverProps={local.restTagsPopoverProps}
            showRestTagsPopover={local.showRestTagsPopover}
            size={local.size}
            renderTagItem={(key, index) => <SelectionTag nodeKey={key} index={index} />}
            onInputChange={(value) => handleInputChange(value)}
            onRemove={foundation.handleTagRemoveByKey}
        />
    );

    const SearchInput = () => (
        <div class={clsx(`${prefixcls}-search-wrapper`, { [`${prefixcls}-search-wrapper-${local.size}`]: local.size !== 'default' })}>
            <span
                id={selectionTextId}
                class={clsx({
                    [`${prefixcls}-selection-placeholder`]: !hasContent(displayText()),
                    [`${prefixcls}-selection-text-hide`]: view.showInput && view.inputValue,
                    [`${prefixcls}-selection-text-inactive`]: view.showInput && !view.inputValue,
                })}
            >
                <Show when={hasContent(displayText())} fallback={inputPlaceholder()}>
                    {displayText()}
                </Show>
            </span>
            <Show when={view.showInput}>
                <Input
                    inputRef={setSearchInput}
                    class={`${prefixcls}-input`}
                    // the trigger draws its own clear button and adornments: global Input defaults must not add them
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    showClear={false}
                    prefix={null}
                    suffix={null}
                    {...comboboxAttrs}
                    aria-autocomplete="list"
                    // the selected text sits beside the input, which is empty until the user types, so the combobox
                    // has no value of its own; the text is exposed as the description
                    aria-describedby={joinIds(local['aria-describedby'], view.inputValue ? undefined : selectionTextId)}
                    disabled={local.disabled}
                    value={view.inputValue}
                    size={local.size}
                    onChange={(value) => handleInputChange(value)}
                />
            </Show>
        </div>
    );

    const SelectContent = () => (
        <Show
            when={triggerSearch()}
            fallback={
                <Show
                    when={local.multiple}
                    fallback={
                        <span class={clsx({ [`${prefixcls}-selection-placeholder`]: !hasContent(displayText()) })}>
                            <Show when={hasContent(displayText())} fallback={local.placeholder}>
                                {displayText()}
                            </Show>
                        </span>
                    }
                >
                    <Show when={view.checkedKeys.size > 0} fallback={<span class={`${prefixcls}-selection-placeholder`}>{local.placeholder}</span>}>
                        <MultipleTags />
                    </Show>
                </Show>
            }
        >
            <Show when={local.multiple} fallback={<SearchInput />}>
                <SearchTagInput />
            </Show>
        </Show>
    );

    const DefaultTrigger = () => (
        <>
            <Show when={labelKind()}>
                <div
                    id={prefixId()}
                    class={clsx(`${prefixcls}-prefix`, {
                        [`${prefixcls}-inset-label`]: Boolean(insetLabelKind()),
                        [`${prefixcls}-prefix-text`]: labelKind() === 'text',
                        [`${prefixcls}-prefix-icon`]: labelKind() === 'icon',
                    })}
                    x-semi-prop="prefix,insetLabel"
                >
                    {prefixKind() ? prefixNode() : insetLabelNode()}
                </div>
            </Show>
            <div class={clsx(`${prefixcls}-selection`, { [`${prefixcls}-selection-multiple`]: local.multiple && view.checkedKeys.size > 0 })}>
                <SelectContent />
            </div>
            <Show when={suffixKind()}>
                <div
                    class={clsx(`${prefixcls}-suffix`, {
                        [`${prefixcls}-suffix-text`]: suffixKind() === 'text',
                        [`${prefixcls}-suffix-icon`]: suffixKind() === 'icon',
                    })}
                    x-semi-prop="suffix"
                >
                    {suffixNode()}
                </div>
            </Show>
            <Show when={clearable()}>
                <button ref={clearHandover} type="button" class={`${prefixcls}-clearbtn`} aria-label={locale().locale.clear} onClick={handleClearClick} onKeyDown={stopButtonActivationKeys}>
                    <Show when={hasContent(clearIcon())} fallback={<IconClear />}>
                        {clearIcon()}
                    </Show>
                </button>
            </Show>
            <Show when={arrowIcon() === undefined || hasContent(arrowIcon())}>
                <div class={`${prefixcls}-arrow`} x-semi-prop="arrowIcon">
                    <Show when={arrowIcon() !== undefined} fallback={<IconChevronDown />}>
                        {arrowIcon()}
                    </Show>
                </div>
            </Show>
        </>
    );

    const renderContent = () => (
        <div ref={setOptionContainer} class={clsx(local.dropdownClassName, `${prefixcls}-popover`)} style={local.dropdownStyle} onFocusIn={foundation.handleFocusEnter} onFocusOut={handleFocusLeave} onKeyDown={handleContentKeyDown} onMouseDown={handleContainerMouseDown}>
            {local.topSlot}
            <Item
                id={popupId}
                multiple={Boolean(local.multiple)}
                activeKeys={view.activeKeys}
                checkedKeys={view.checkedKeys}
                data={renderData()}
                emptyContent={local.emptyContent}
                expandIcon={local.expandIcon}
                halfCheckedKeys={view.halfCheckedKeys}
                keyboardKey={keyboardKey()}
                keyword={view.inputValue}
                labelProps={name()}
                loadData={local.loadData}
                loadedKeys={view.loadedKeys}
                loadingKeys={view.loadingKeys}
                optionId={optionId}
                searchable={Boolean(local.filterTreeNode) && view.isSearching}
                selectedKeys={view.selectedKeys}
                separator={local.separator}
                showNext={local.showNext}
                virtualize={local.virtualizeInSearch}
                virtualListRef={setVirtualList}
                filterRender={local.filterRender}
                renderLabel={local.renderLabel}
                onItemCheckboxClick={foundation.onItemCheckboxClick}
                onItemClick={foundation.handleItemClick}
                onItemHover={foundation.handleItemHover}
                onListScroll={foundation.handleListScroll}
            />
            {local.bottomSlot}
        </div>
    );

    const inputs = () => [local.treeData, local.keyMaps, local.value] as const;

    useWatch(inputs, ([treeData, keyMaps, value], [prevTreeData, prevKeyMaps, prevValue]) => {
        const optionsChanged = !isEqual(prevTreeData, treeData) || !isEqual(prevKeyMaps, keyMaps);
        // by content: an inline value is a new array on every parent render, and each change resets the search
        foundation.handleInputsChange({ optionsChanged, valueChanged: !isEqual(prevValue, value) }, value as BasicValue);
    });

    return (
        <Popover
            // An empty list has no columns to size it, so it matches the trigger's width
            style={isEmpty() ? { 'min-width': 'var(--semi-tooltip-trigger-width)' } : undefined}
            role="presentation"
            afterClose={foundation.endSearching}
            autoAdjustOverflow={local.autoAdjustOverflow}
            content={renderContent}
            motion={local.motion}
            position={position()}
            stopPropagation={local.stopPropagation}
            trigger="custom"
            visible={view.isOpen}
            onOpen={foundation.handlePopoverOpen}
        >
            {(getTriggerProps) => (
                <div
                    {...(getTriggerProps(
                        mergeProps(triggerOwn, {
                            // the spread memoizes this call and tracks the read; a spread signal object would call the ref again on any change
                            ref: untrack(() => mergeRefs<CascaderElement>(setRoot as (node: CascaderElement) => void, local.ref)),
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
