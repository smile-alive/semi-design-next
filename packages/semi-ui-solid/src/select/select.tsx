import { type Accessor, type JSX, type Ref, type ResolvedChildren, For, Match, Show, Switch, batch, children, createMemo, createUniqueId, mergeProps, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/select/constants';
import SelectFoundation, { type SelectAdapter, type SelectBaseProps, type SelectBaseState } from '@fibrae/semi-foundation/select/foundation';
import { getOptionRuns, type BasicOptionProps, type OptionRecord as BaseOptionRecord } from '@fibrae/semi-foundation/select/option-foundation';
import { cssClasses as tagCssClasses } from '@fibrae/semi-foundation/tag/constants';
import { isTextEditor, joinIds, stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import { centerInScroller, toCssLength } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/select/select.scss';
import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-solid';
import callHandler from '../_base/call-handler';
import { omitFormInjected } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus, { focusElement } from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import { createIconSlot } from '../_base/icon-slot';
import mergeRefs from '../_base/merge-refs';
import mergeStyles from '../_base/merge-styles';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import VirtualList, { type VirtualListHandle } from '../_base/virtual-list';
import useConfig from '../config-provider/use-config';
import type { InputGroupContextValue } from '../input/context';
import InputGroupBoundary from '../input/group-boundary';
import Input, { type InputChangeEvent, type InputElementEvent, type InputProps, type ValidateStatus } from '../input/input';
import useLocale from '../locale/use-locale';
import OverflowList, { type OverflowItem } from '../overflow-list';
import Popover, { type PopoverHandle, type PopoverProps } from '../popover';
import Space from '../space';
import Spin from '../spin';
import Tag, { TagGroup, type TagGroupItem } from '../tag';
import type { Position, TooltipProps } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';
import Text from '../typography/text';
import { type OptionProps, OptionView } from './option';
import { type GroupRecord, type OptionData, type OptionRecord, plain, readOptions } from './utils';

const prefix = cssClasses.PREFIX;

export type BasicSelectValue = string | number | Record<string, unknown>;

type IsDefaultSelectGeneric<T> = [T] extends [BasicSelectValue] ? ([BasicSelectValue] extends [T] ? true : false) : false;

/** Without a generic parameter: `string | number | unknown[] | Record | undefined`; with `T`: `T | T[] | undefined` */
export type SelectValue<T = BasicSelectValue> = IsDefaultSelectGeneric<T> extends true ? BasicSelectValue | unknown[] | undefined : T | T[] | undefined;

type ByMultiple<Multiple, Single, Many> = Multiple extends unknown ? (true extends Multiple ? Many : Single) : never;

export type SelectChangeValue<T, Multiple> = ByMultiple<Multiple, T | undefined, T[]>;

export type SelectSize = Size;

/** What `renderOptionItem` receives; spread `id` on the role="option" element, which aria-activedescendant points at */
export interface OptionRenderProps {
    [key: string]: unknown;
    id: string;
    label?: string | number;
    value?: string | number;
    style?: JSX.CSSProperties | string;
    class: string;
    selected: boolean;
    focused: boolean;
    disabled?: boolean;
    inputValue: string;
    onMouseEnter: (e: MouseEvent) => void;
    onClick: (e: MouseEvent) => void;
}

export type SelectedItemProps = OptionProps;

export interface TriggerRenderProps {
    value: SelectedItemProps[];
    inputValue: string;
    onSearch: (inputValue: string) => void;
    /** Pass the click event, so it does not reopen the dropdown */
    onClear: (e?: MouseEvent) => void;
    onRemove: (option: OptionProps) => void;
    disabled: boolean;
    placeholder: JSX.Element;
    componentProps: Record<string, unknown>;
}

export interface VirtualizeProps {
    itemSize: number;
    height?: number;
    width?: string | number;
}

export type RenderSingleSelectedItemFn = (optionNode: SelectedItemProps) => JSX.Element;

export type RenderMultipleSelectedItemFn = (
    optionNode: SelectedItemProps,
    multipleProps: {
        index: number;
        disabled: boolean;
        onClose: (tagContent: JSX.Element, e?: MouseEvent | KeyboardEvent) => void;
    }
) => { isRenderInTag: boolean; content: JSX.Element };

export type RenderSelectedItemFn = RenderSingleSelectedItemFn | RenderMultipleSelectedItemFn;

export type SelectInputProps = Omit<InputProps, 'value' | 'onFocus' | 'onChange'>;

/** React's SelectHandle methods; the trigger element passed to `ref` carries them */
export interface SelectHandle {
    open: () => void;
    close: () => void;
    clearInput: () => void;
    /** Selects every shown, enabled option (multiple only) */
    selectAll: () => void;
    deselectAll: () => void;
    /** Searches as if `value` were typed into the search input */
    search: (value: string, event?: InputChangeEvent | KeyboardEvent | MouseEvent) => void;
    /** Repositions the open dropdown at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}

export type SelectElement = HTMLDivElement & SelectHandle;

/**
 * `T` is the option value type, or the option object with `onChangeWithObject`; `Multiple` follows the `multiple` prop
 */
export interface SelectProps<T = BasicSelectValue, Multiple extends boolean | undefined = undefined>
    extends ElementProps<'div', 'prefix' | 'placeholder' | 'defaultValue' | 'value' | 'onChange' | 'onSelect' | 'onFocus' | 'onBlur' | 'ref'>, Pick<TooltipProps, 'spacing' | 'motion' | 'autoAdjustOverflow' | 'stopPropagation'> {
    /** Accessible name of the combobox: the search input while it is in the trigger, otherwise the trigger */
    'aria-label'?: string;
    id?: string;
    autofocus?: boolean;
    autoClearSearchValue?: boolean;
    /** `null` shows no icon */
    arrowIcon?: JSX.Element;
    borderless?: boolean;
    clearIcon?: JSX.Element;
    defaultValue?: SelectValue<T>;
    value?: SelectValue<T>;
    placeholder?: JSX.Element;
    onChange?: (value: SelectChangeValue<T, Multiple>) => void;
    multiple?: Multiple;
    filter?: boolean | ((inputValue: string, option: OptionProps) => boolean);
    max?: number;
    maxTagCount?: number;
    maxHeight?: string | number;
    /** An enclosing InputGroup's size applies when this is not set */
    size?: SelectSize;
    /** An InputGroup's `disabled` applies when this is not set */
    disabled?: boolean;
    /** `null` hides the empty state */
    emptyContent?: JSX.Element;
    expandRestTagsOnClick?: boolean;
    onDropdownVisibleChange?: (visible: boolean) => void;
    position?: Position;
    /** `event` is what changed the keyword; none when called from triggerRender */
    onSearch?: (value: string, event?: InputChangeEvent | KeyboardEvent | MouseEvent) => void;
    dropdownClassName?: string;
    dropdownStyle?: JSX.CSSProperties | string;
    ellipsisTrigger?: boolean;
    outerTopSlot?: JSX.Element;
    innerTopSlot?: JSX.Element;
    outerBottomSlot?: JSX.Element;
    innerBottomSlot?: JSX.Element;
    optionList?: OptionProps[];
    dropdownMatchSelectWidth?: boolean;
    loading?: boolean;
    defaultOpen?: boolean;
    validateStatus?: ValidateStatus;
    defaultActiveFirstOption?: boolean;
    onChangeWithObject?: boolean;
    suffix?: JSX.Element;
    searchPosition?: 'trigger' | 'dropdown';
    searchPlaceholder?: string;
    prefix?: JSX.Element;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    /** Props of the search input; `inputRef` receives its native input */
    inputProps?: SelectInputProps;
    showClear?: boolean;
    showArrow?: boolean;
    renderSelectedItem?: ByMultiple<Multiple, RenderSingleSelectedItemFn, RenderMultipleSelectedItemFn>;
    renderCreateItem?: (inputValue: OptionProps['value'], focus: boolean, style?: JSX.CSSProperties) => JSX.Element;
    renderOptionItem?: (props: OptionRenderProps) => JSX.Element;
    clickToHide?: boolean;
    onExceed?: (option: OptionProps) => void;
    onCreate?: (option: OptionProps) => void;
    remote?: boolean;
    onDeselect?: (value: OptionProps['value'], option: OptionProps) => void;
    onSelect?: (value: OptionProps['value'], option: OptionProps) => void;
    allowCreate?: boolean;
    triggerRender?: (props: TriggerRenderProps) => JSX.Element;
    onClear?: () => void;
    virtualize?: VirtualizeProps;
    /** Fires as focus enters the Select from outside */
    onFocus?: (e: FocusEvent) => void;
    /** Fires as focus leaves the Select; a click outside the open Select passes its mousedown event */
    onBlur?: (e: FocusEvent | MouseEvent) => void;
    /** A scroll in the option list, the virtual list included */
    onListScroll?: (e: Event) => void;
    /** `Select.Option`s and `Select.OptGroup`s */
    children?: JSX.Element;
    preventScroll?: boolean;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: PopoverProps;
    /**
     * The trigger element with the SelectHandle methods; its `focus()` focuses the combobox (the search input while it
     * is in the trigger) without opening the dropdown
     */
    ref?: Ref<SelectElement>;
}

// The body serves every `multiple` mode, so it reads the callbacks through one wide type
interface SelectBodyProps extends Omit<SelectProps<unknown, boolean>, 'onChange' | 'renderSelectedItem'> {
    onChange?: (value: unknown) => void;
    renderSelectedItem?: RenderSelectedItemFn;
}

interface SelectState extends SelectBaseState {
    isFocusInContainer: boolean;
    overflowItemCount: number;
}

type FoundationProps = SelectBaseProps & { preventScroll?: boolean; max?: number };
type Foundation = SelectFoundation<FoundationProps, SelectState, Event>;
type Adapter = SelectAdapter<FoundationProps, SelectState, Event>;

type RenderCreateItem = NonNullable<SelectProps['renderCreateItem']>;

interface Run {
    group?: GroupRecord;
    first: number;
    rows: string[];
}

// size and disabled are left out: they resolve through an enclosing InputGroup
const defaultProps = {
    stopPropagation: true,
    motion: true,
    borderless: false,
    filter: false,
    multiple: false,
    defaultOpen: false,
    allowCreate: false,
    placeholder: '',
    onChangeWithObject: false,
    maxHeight: numbers.LIST_HEIGHT,
    dropdownMatchSelectWidth: true,
    defaultActiveFirstOption: true,
    showArrow: true,
    showClear: false,
    searchPosition: strings.SEARCH_POSITION_TRIGGER,
    remote: false,
    autoAdjustOverflow: true,
    autoClearSearchValue: true,
    showRestTagsPopover: false,
    expandRestTagsOnClick: false,
    ellipsisTrigger: false,
} satisfies Partial<SelectBodyProps>;

function labelOf(option: OptionData) {
    return option._slot ? option._slot() : option.label;
}

function hasTitle(group?: GroupRecord): group is GroupRecord {
    return Boolean(group && (group.label || group.label === 0));
}

function titleAttrs({ key: _key, label: _label, class: _class, style: _style, id: _id, ...rest }: GroupRecord) {
    return rest;
}

function optionItemRest({ key: _key, class: _class, style: _style, label: _label, value: _value, disabled: _disabled, showTick: _showTick, _slot, ...rest }: OptionData) {
    return rest;
}

// the arguments are read where the row renders; the call itself is not, so state read inside it does not re-run it
function renderCreate(render: RenderCreateItem, value: OptionProps['value'], focus: boolean, style?: JSX.CSSProperties) {
    return untrack(() => render(value, focus, style));
}

export default function Select<T = BasicSelectValue, Multiple extends boolean | undefined = undefined>(rawProps: SelectProps<T, Multiple>) {
    return <InputGroupBoundary>{(inGroup) => <SelectControl {...(rawProps as SelectBodyProps)} inGroup={inGroup} />}</InputGroupBoundary>;
}

function SelectControl(all: SelectBodyProps & { inGroup?: InputGroupContextValue }) {
    const [own, bodyProps] = splitProps(all, ['inGroup']);
    const defaulted = useDefaultProps('Select', bodyProps, defaultProps);

    const config = useConfig();
    const locale = useLocale('Select');

    const generatedId = createUniqueId();
    const listboxId = createUniqueId();
    const selectionTextId = createUniqueId();
    let root: HTMLDivElement | undefined;
    let triggerInput: HTMLInputElement | undefined;
    let popover: PopoverHandle | undefined;
    let dropdownInput: HTMLInputElement | undefined;
    let clearButton: HTMLButtonElement | undefined;
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
        'allowCreate',
        'aria-describedby',
        'aria-errormessage',
        'aria-invalid',
        'aria-label',
        'aria-labelledby',
        'aria-required',
        'arrowIcon',
        'autoAdjustOverflow',
        'autoClearSearchValue',
        'autofocus',
        'borderless',
        'children',
        'class',
        'clearIcon',
        'clickToHide',
        'defaultActiveFirstOption',
        'defaultOpen',
        'defaultValue',
        'disabled',
        'dropdownClassName',
        'dropdownMatchSelectWidth',
        'dropdownStyle',
        'ellipsisTrigger',
        'emptyContent',
        'expandRestTagsOnClick',
        'filter',
        'id',
        'innerBottomSlot',
        'innerTopSlot',
        'inputProps',
        'loading',
        'max',
        'maxHeight',
        'maxTagCount',
        'motion',
        'multiple',
        'onBlur',
        'onChange',
        'onChangeWithObject',
        'onClear',
        'onClick',
        'onCreate',
        'onDeselect',
        'onDropdownVisibleChange',
        'onExceed',
        'onFocus',
        'onFocusIn',
        'onFocusOut',
        'onKeyDown',
        'onListScroll',
        'onMouseDown',
        'onSearch',
        'onSelect',
        'optionList',
        'outerBottomSlot',
        'outerTopSlot',
        'placeholder',
        'position',
        'prefix',
        'preventScroll',
        'ref',
        'remote',
        'renderCreateItem',
        'renderOptionItem',
        'renderSelectedItem',
        'restTagsPopoverProps',
        'searchPlaceholder',
        'searchPosition',
        'showArrow',
        'showClear',
        'showRestTagsPopover',
        'size',
        'spacing',
        'stopPropagation',
        'style',
        'suffix',
        'triggerRender',
        'value',
        'virtualize',
    ]);

    const [, componentProps] = splitProps(props, ['ref']);

    const foundationProps = mergeProps(props, {
        get autoFocus() {
            return props.autofocus;
        },
    }) as FoundationProps;

    const options = children(() => local.children);
    const records = createMemo(() => readOptions(options.toArray(), local.optionList));

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, SelectState>(
        SelectFoundation,
        foundationProps,
        (view) => ({
            isOpen: false,
            isFocus: false,
            inputValue: '',
            showInput: false,
            isFocusInContainer: false,
            isFullTags: false,
            ...SelectFoundation.getInitialState(view, untrack(records) as BaseOptionRecord[]),
        }),
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleInputShow: (showInput, cb) => base.setState({ showInput }, cb),
            focusInput: () => triggerInput?.focus({ preventScroll: props.preventScroll }),
            focusDropdownInput: () => dropdownInput?.focus({ preventScroll: props.preventScroll }),
            notifyMaxLimit: (option) => props.onExceed?.(plain(option as OptionData)),
            getMaxLimit: () => props.max as number,
            notifyDeselect: (value, option) => props.onDeselect?.(value, plain(option as OptionData)),
            getOptionsFromChildren: () => records() as BaseOptionRecord[],
            updateOptions: (next) => base.setState({ options: next }),
            openMenu: (cb) => base.setState({ isOpen: true }, cb),
            closeMenu: () => base.setState({ isOpen: false }),
            updateSelection: (selections) => base.setState({ selections }),
            getSelections: () => new Map(base.getState('selections')),
            notifyChange: (value) => {
                const object = (item: unknown) => (typeof item === 'object' && item !== null ? plain(item as OptionData) : item);
                props.onChange?.(props.onChangeWithObject ? (Array.isArray(value) ? value.map(object) : object(value)) : value);
            },
            notifySelect: (value, option) => props.onSelect?.(value, plain(option as OptionData)),
            notifyDropdownVisibleChange: (visible) => props.onDropdownVisibleChange?.(visible),
            notifySearch: (inputValue, event) => props.onSearch?.(inputValue, event),
            notifyCreate: (option) => props.onCreate?.(plain(option as OptionData)),
            // onMouseEnter and onMouseLeave reach the root as native listeners through the rest props
            notifyMouseEnter: () => undefined,
            notifyMouseLeave: () => undefined,
            notifyFocus: (event: FocusEvent) => props.onFocus?.(event),
            notifyBlur: (event: FocusEvent | MouseEvent) => props.onBlur?.(event),
            notifyClear: () => props.onClear?.(),
            notifyListScroll: (event) => props.onListScroll?.(event),
            updateFocusState: (isFocus) => base.setState({ isFocus }),
            updateOverflowItemCount: (overflowItemCount) => base.setState({ overflowItemCount }),
            focusTrigger: () => root && focusElement(root, { preventScroll: props.preventScroll }),
            getOptionList: () => optionContainer,
            setIsFocusInContainer: (isFocusInContainer) => base.setState({ isFocusInContainer }),
            getIsFocusInContainer: () => base.getState('isFocusInContainer'),
            updateScrollTop: (index) => {
                if (index !== undefined && virtualList) {
                    // only the rows in view are rendered, so the target may not be in the DOM yet
                    virtualList.scrollToItem(index);
                    return;
                }
                const custom = props.renderOptionItem ? '-custom' : '';
                // by id inside the list, not :nth-child (group titles are siblings of the options) or getElementById (misses a ShadowRoot)
                const destNode = optionContainer?.querySelector<HTMLElement>(index === undefined ? `.${prefix}-option${custom}-selected` : `#${CSS.escape(optionId(index))}`);
                const listbox = destNode?.closest<HTMLElement>('[role="listbox"]');
                if (destNode && listbox) {
                    centerInScroller(destNode, listbox);
                }
            },
        })
    );

    const markPressInside = useClickOutside([() => root, () => optionContainer], foundation.handleClickOutside, () => state().isOpen);

    // a removed node fires no blur: focus on the clear button goes to the combobox instead of dropping to the body
    const handover = useFocusHandover<HTMLButtonElement>(() => triggerInput ?? root);

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const prefixNode = createIconSlot(() => local.prefix);
    const insetLabelNode = createIconSlot(() => props.insetLabel);
    const suffixNode = createIconSlot(() => local.suffix);
    const placeholderNode = children(() => local.placeholder);
    const clearIcon = children(() => local.clearIcon);
    const arrowIcon = children(() => local.arrowIcon);

    const selectId = () => local.id || generatedId;

    const optionId = (index: number) => `${selectId()}-option-${index}`;

    const visibleOptions = createMemo(() => (state().options as OptionRecord[]).filter((option) => option.show));
    const selectedItems = createMemo(() => [...state().selections.values()] as OptionData[]);

    const triggerRenderProps: TriggerRenderProps = {
        get value() {
            return selectedItems().map(plain);
        },
        get inputValue() {
            return state().inputValue;
        },
        get disabled() {
            return Boolean(local.disabled);
        },
        get placeholder() {
            return placeholderNode();
        },
        componentProps,
        onSearch: (value) => handleInputChange(value),
        onClear: (e) => handleClear(e),
        onRemove: (option) => foundation.removeTag(option as BasicOptionProps),
    };

    const filterable = () => Boolean(local.filter);

    const searchInTrigger = () => local.searchPosition === strings.SEARCH_POSITION_TRIGGER;

    const position = () => local.position ?? (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft');

    // the record's index, not the visible index: a row that filtering moves up keeps its node
    const rowKey = ({ data, childKey, index }: OptionRecord) => String(data.key ?? childKey ?? `${String(data.label)}${data.value}${index}`);

    const rows = createMemo(() => new Map(visibleOptions().map((option, index) => [rowKey(option), { option, index }])));

    const runs = createMemo(() => {
        const entries = getOptionRuns(visibleOptions()).map(({ group, first, rows }): [string, Run] => [group?.key ?? `#${first}`, { group, first, rows: rows.map(({ option }) => rowKey(option)) }]);
        return new Map(entries);
    });

    const runKeys = createMemo(() => [...runs().keys()]);

    const activeDescendant = () => {
        const { isOpen, focusIndex } = state();
        // while loading the list shows a spinner instead of the options
        return isOpen && !local.loading && focusIndex !== -1 && focusIndex < visibleOptions().length ? optionId(focusIndex) : undefined;
    };

    const prefixKind = () => prefixNode.kind();

    const insetLabelKind = () => insetLabelNode.kind();

    const suffixKind = () => suffixNode.kind();

    const labelKind = () => prefixKind() ?? insetLabelKind();

    const insetLabelShown = () => Boolean(insetLabelKind()) && !prefixKind() && !local.triggerRender;

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? `${selectId()}-inset-label` : undefined);

    // The listbox binds it too: the combobox's name source, never the combobox itself, whose value accname would read
    const name = () => comboboxName(local['aria-labelledby'], local['aria-label'], insetLabelShown() ? prefixId() : undefined, locale().locale.label);

    const comboboxAttrs = {
        role: 'combobox',
        get 'aria-activedescendant'() {
            return activeDescendant();
        },
        'aria-controls': listboxId,
        get 'aria-describedby'() {
            return local['aria-describedby'];
        },
        get 'aria-errormessage'() {
            return local['aria-errormessage'];
        },
        get 'aria-expanded'() {
            return state().isOpen;
        },
        'aria-haspopup': 'listbox',
        get 'aria-invalid'() {
            return local['aria-invalid'];
        },
        get 'aria-required'() {
            return local['aria-required'];
        },
        get 'aria-label'() {
            return name()['aria-label'];
        },
        get 'aria-labelledby'() {
            return name()['aria-labelledby'];
        },
    } as const;

    // ARIA 1.2: the search input in the trigger is the combobox; otherwise the trigger is a select-only combobox
    const inputIsCombobox = () => filterable() && searchInTrigger() && !local.triggerRender && (Boolean(local.multiple) || state().showInput);

    const clearable = () => Boolean(local.showClear && (state().selections.size || state().inputValue) && !local.disabled);

    const tagSize = () => (local.size === 'small' ? 'small' : 'large');

    const handleInputChange = (value: string, event?: InputChangeEvent) => foundation.handleInputChange(value, event);

    const handleClear = (e?: MouseEvent) => {
        e?.stopImmediatePropagation();
        foundation.handleClearClick(e);
    };

    const handleClick = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onClick, e);
        foundation.handleClick(e);
    };

    const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onKeyDown, e);
        foundation.handleKeyDown(e);
    };

    const handleMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onMouseDown, e);
        markPressInside(e);
    };

    const handleFocusIn = (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusIn, e);
        if (triggerInput && e.target === triggerInput) {
            foundation.handleInputFocus(e);
        } else {
            foundation.handleTriggerFocus(e);
        }
    };

    const handleFocusOut = (e: FocusEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onFocusOut, e);
        // Chrome blurs the clear button as the update removes it; the handover gives the focus back to the combobox
        if (clearButton && e.target === clearButton && !clearable()) {
            return;
        }
        batch(() => {
            if (triggerInput && e.target === triggerInput) {
                foundation.handleInputBlur();
            }
            if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) {
                foundation.handleTriggerBlur(e);
            }
        });
    };

    const triggerOwn = mergeProps(rest, () => (inputIsCombobox() ? {} : { ...comboboxAttrs, 'aria-disabled': local.disabled }), {
        get id() {
            return selectId();
        },
        get class() {
            return local.triggerRender
                ? clsx(local.class)
                : clsx(prefix, local.class, {
                      [`${prefix}-borderless`]: local.borderless,
                      [`${prefix}-open`]: state().isOpen,
                      [`${prefix}-focus`]: state().isFocus,
                      [`${prefix}-disabled`]: local.disabled,
                      [`${prefix}-single`]: !local.multiple,
                      [`${prefix}-multiple`]: local.multiple,
                      [`${prefix}-filterable`]: filterable(),
                      [`${prefix}-small`]: local.size === 'small',
                      [`${prefix}-large`]: local.size === 'large',
                      [`${prefix}-error`]: props.validateStatus === 'error',
                      [`${prefix}-warning`]: props.validateStatus === 'warning',
                      [`${prefix}-no-arrow`]: !local.showArrow,
                      [`${prefix}-with-prefix`]: Boolean(labelKind()),
                      [`${prefix}-with-suffix`]: Boolean(suffixKind()),
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
        onFocusOut: handleFocusOut,
        onKeyDown: handleKeyDown,
        onMouseDown: handleMouseDown,
    });

    // A press would move the focus to the popup container, where the keys never reach the combobox; it stays on the
    // trigger or the dropdown search input. A text field in a slot still takes the focus.
    const handleContainerMouseDown = (e: MouseEvent) => {
        if (!isTextEditor(e.target)) {
            e.preventDefault();
        }
        markPressInside(e);
    };

    // the popup is not a DOM descendant of the trigger, so its keydown does not reach the root's handler
    const handleDropdownKeyDown = (e: InputElementEvent<KeyboardEvent>) => {
        callHandler(local.inputProps?.onKeyDown, e);
        foundation.handleKeyDown(e);
    };

    const removeTagOnClose = (option: OptionData, e?: Event) => {
        // keeps the Tag from hiding itself in controlled mode
        e?.preventDefault();
        const tag = e?.currentTarget instanceof Element ? e.currentTarget.closest(`.${tagCssClasses.PREFIX}`) : null;
        batch(() => {
            // a tag going while it has the focus hands the focus to the combobox
            if (tag && tag === FocusTrapHandle.getActiveElement(tag)) {
                foundation.focus(undefined, false);
            }
            foundation.removeTag(option as BasicOptionProps);
        });
    };

    // OverflowList shows the first overflowed item collapsed, so every other one is hidden; [] means all fit
    const handleOverflow = (items: OverflowItem[]) => {
        const { size } = state().selections;
        const hiddenByMaxTagCount = size - Math.min(size, local.maxTagCount ?? 0);
        const count = hiddenByMaxTagCount + Math.max(items.length - 1, 0);
        if (state().overflowItemCount !== count) {
            foundation.updateOverflowItemCount(size, count);
        }
    };

    const scrollToSelection = () => {
        const { focusIndex } = state();
        // Home, End or typing may have moved the highlight off the selection before the list mounted
        if (local.virtualize && focusIndex !== -1) {
            virtualList?.scrollToItem(focusIndex, 'center');
        } else if (local.virtualize) {
            const first = state().options.find((option) => option.selected && option.index >= 0);
            if (first) {
                virtualList?.scrollToItem(first.index, 'center');
            }
        } else {
            foundation.updateScrollTop();
        }
    };

    const focusOptions = () => ({ preventScroll: props.preventScroll });

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        // ref.focus() focuses the combobox, as Tooltip and focus handover expect; it does not open the dropdown
        // the trigger input is mounted exactly while it is the combobox
        forwardFocus(node, () => triggerInput ?? node, focusOptions);
        // React's handle methods ride on the element: a Tooltip wrapping the Select needs the element itself as its ref
        Object.assign(node, {
            open: () => foundation.open(),
            close: () => foundation.close(),
            clearInput: () => foundation.clearInput(),
            selectAll: foundation.selectAll,
            deselectAll: foundation.clearSelected,
            search: foundation.handleInputChange,
            rePosition: () => popover?.rePosition(),
        } satisfies SelectHandle);
        registerTrigger(node);
    };

    const setTriggerInput = (node: HTMLInputElement) => {
        triggerInput = node;
        onCleanup(() => {
            if (triggerInput === node) {
                triggerInput = undefined;
            }
        });
    };

    const setDropdownInput = (node: HTMLInputElement) => {
        dropdownInput = node;
        onCleanup(() => {
            if (dropdownInput === node) {
                dropdownInput = undefined;
            }
        });
    };

    const setClearButton = (node: HTMLButtonElement) => {
        clearButton = node;
        handover(node);
    };

    const setOptionContainer = (node: HTMLDivElement) => {
        optionContainer = node;
        onCleanup(() => {
            if (optionContainer === node) {
                optionContainer = undefined;
            }
        });
    };

    // capture: with virtualize the scrolling element is the virtual list inside, and scroll does not bubble
    const setListbox = (node: HTMLDivElement) => {
        const controller = new AbortController();
        node.addEventListener('scroll', foundation.handleListScroll, { capture: true, signal: controller.signal });
        onCleanup(() => controller.abort());
    };

    const setVirtualList = (handle?: VirtualListHandle) => {
        virtualList = handle;
    };

    const renderTriggerInput = () => (
        <Input
            {...comboboxAttrs}
            aria-autocomplete="list"
            // the single-select input is empty until typing, so the selected text is exposed as its description
            aria-describedby={joinIds(local['aria-describedby'], local.multiple || state().inputValue ? undefined : selectionTextId)}
            id={`${selectId()}-input`}
            size={local.size}
            value={state().inputValue}
            disabled={local.disabled}
            onChange={handleInputChange}
            // the trigger draws its own clear button and adornments: global Input defaults must not add them
            showClear={false}
            prefix={null}
            suffix={null}
            insetLabel={null}
            addonBefore={null}
            addonAfter={null}
            {...local.inputProps}
            class={clsx(`${prefix}-input`, local.multiple ? `${prefix}-input-multiple` : `${prefix}-input-single`, local.inputProps?.class)}
            style={local.multiple ? { width: state().inputValue ? `${state().inputValue.length * 16}px` : '2px' } : local.inputProps?.style}
            inputRef={mergeRefs(setTriggerInput, local.inputProps?.inputRef)}
        />
    );

    const renderDropdownInput = () => (
        <div class={`${prefix}-dropdown-search-wrapper`}>
            {/* a search field over the trigger's list, not a second combobox (the React Aria Autocomplete pattern) */}
            <Input
                aria-activedescendant={activeDescendant()}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-label={name()['aria-label']}
                aria-labelledby={name()['aria-labelledby']}
                // the popup mounts after the dropdown opens, so the foundation's focus call finds no input yet
                autofocus={local.autofocus}
                prefix={<IconSearch />}
                value={state().inputValue}
                disabled={local.disabled}
                onChange={handleInputChange}
                placeholder={local.searchPlaceholder}
                showClear
                // global Input defaults must not add adornments to the search field
                suffix={null}
                insetLabel={null}
                addonBefore={null}
                addonAfter={null}
                {...local.inputProps}
                class={clsx(`${prefix}-dropdown-input`, local.multiple ? `${prefix}-dropdown-input-multiple` : `${prefix}-dropdown-input-single`, local.inputProps?.class)}
                inputRef={mergeRefs(setDropdownInput, local.inputProps?.inputRef)}
                onKeyDown={handleDropdownKeyDown}
            />
        </div>
    );

    const SelectedTag = (tag: { option: OptionData; index: number; collapsed?: boolean; inTagGroup?: boolean }) => {
        const tagDisabled = () => Boolean(tag.option.disabled || local.disabled);
        const onClose = (_content: JSX.Element, e?: Event) => removeTagOnClose(tag.option, e);
        const rendered = createMemo(() => {
            const render = local.renderSelectedItem as RenderMultipleSelectedItemFn | undefined;
            return render ? render(plain(tag.option), { index: tag.index, disabled: tagDisabled(), onClose }) : { isRenderInTag: true, content: labelOf(tag.option) };
        });
        const content = () =>
            tag.collapsed && !local.renderSelectedItem ? (
                <Text ellipsis={{ rows: 1, showTooltip: { type: 'popover', opts: { style: { width: 'auto', 'font-size': '12px' } } } }} size="small">
                    {rendered().content}
                </Text>
            ) : (
                rendered().content
            );
        return (
            <Show when={rendered().isRenderInTag} fallback={content()}>
                <Tag tabIndex={tag.inTagGroup ? -1 : undefined} style={tag.inTagGroup ? undefined : { 'max-width': '100%' }} closable={!tagDisabled()} color="white" size={tagSize()} onClose={onClose}>
                    {content()}
                </Tag>
            </Show>
        );
    };

    const groupTagList = (full: boolean) => (full && state().isFullTags ? selectedItems() : selectedItems().slice(0, local.maxTagCount)).map((option) => ({ tagKey: option.value }));

    // the group list is a prefix of the selection, so a tag's index is its option's
    const renderGroupTag = (_tag: TagGroupItem, index: number) => <SelectedTag option={selectedItems()[index]} index={index} inTagGroup />;

    const restTag = (triggerProps?: object) => (
        <Tag {...triggerProps} class={`${prefix}-content-wrapper-collapse-tag`} style={{ 'margin-right': '0', 'flex-shrink': '0' }} closable={false} color="grey" size={tagSize()}>
            +{state().overflowItemCount}
        </Tag>
    );

    const CollapsedTags = () => {
        const items = () => {
            const count = local.maxTagCount ?? 0;
            return selectedItems().length > count ? selectedItems().slice(0, count) : selectedItems();
        };
        const restItems = () => selectedItems().slice(selectedItems().length - state().overflowItemCount);
        return (
            <div class={`${prefix}-content-wrapper-collapse`}>
                <OverflowList
                    itemKey={(item) => (item as OptionData).value as string | number}
                    items={items()}
                    overflowRenderer={(overflowItems: OverflowItem[]) => {
                        const first = overflowItems[0] as OptionData | undefined;
                        return first ? <SelectedTag option={first} index={items().indexOf(first)} collapsed /> : null;
                    }}
                    visibleItemRenderer={(item, index) => <SelectedTag option={item as OptionData} index={index} />}
                    onOverflow={handleOverflow}
                />
                <Show when={state().overflowItemCount > 0}>
                    <Show when={local.showRestTagsPopover} fallback={restTag()}>
                        <Popover
                            autoAdjustOverflow
                            content={
                                <Space style={{ 'max-width': '400px' }} spacing={2} wrap>
                                    <For each={restItems()}>{(option, index) => <SelectedTag option={option} index={index()} />}</For>
                                </Space>
                            }
                            position="top"
                            showArrow
                            trigger="hover"
                            {...local.restTagsPopoverProps}
                        >
                            {(getTriggerProps) => restTag(getTriggerProps())}
                        </Popover>
                    </Show>
                </Show>
            </div>
        );
    };

    const MultipleSelection = () => {
        const limited = () => (selectedItems().length > (local.maxTagCount ?? 0) ? local.maxTagCount : undefined);
        const restCount = () => selectedItems().length - (local.maxTagCount ?? 0);
        return (
            <div
                class={clsx(`${prefix}-content-wrapper`, {
                    [`${prefix}-content-wrapper-one-line`]: Boolean(local.maxTagCount) && !state().isOpen,
                    [`${prefix}-content-wrapper-empty`]: !selectedItems().length,
                })}
            >
                <Show
                    when={selectedItems().length}
                    fallback={
                        <Show when={hasContent(placeholderNode()) && !state().inputValue}>
                            <span class={clsx(`${prefix}-selection-text`, `${prefix}-selection-placeholder`)}>{placeholderNode()}</span>
                        </Show>
                    }
                >
                    <Switch>
                        <Match when={!local.maxTagCount || (local.expandRestTagsOnClick && state().isOpen)}>
                            <For each={selectedItems()}>{(option, index) => <SelectedTag option={option} index={index()} />}</For>
                        </Match>
                        <Match when={local.ellipsisTrigger}>
                            <CollapsedTags />
                        </Match>
                        <Match when={local.showRestTagsPopover}>
                            <TagGroup maxTagCount={limited()} popoverProps={local.restTagsPopoverProps} restCount={state().isFullTags ? undefined : restCount()} showPopover size={tagSize()} tagList={groupTagList(true)} renderTag={renderGroupTag} onPlusNMouseEnter={foundation.updateIsFullTags} />
                        </Match>
                        <Match when={true}>
                            <TagGroup maxTagCount={limited()} restCount={restCount()} size={tagSize()} tagList={groupTagList(false)} renderTag={renderGroupTag} />
                        </Match>
                    </Switch>
                </Show>
                <Show when={filterable() && searchInTrigger()}>{renderTriggerInput()}</Show>
            </div>
        );
    };

    const SingleSelection = () => {
        const content = createMemo(() => {
            const option = selectedItems()[0];
            if (!option) {
                return undefined;
            }
            const render = local.renderSelectedItem as RenderSingleSelectedItemFn | undefined;
            return render ? render(plain(option)) : labelOf(option);
        });
        const shown = () => {
            const value = content();
            return Boolean(value) || value === 0;
        };
        const searching = () => state().showInput && searchInTrigger();
        return (
            <div class={`${prefix}-content-wrapper`}>
                <span
                    id={selectionTextId}
                    class={clsx(`${prefix}-selection-text`, {
                        [`${prefix}-selection-placeholder`]: !shown(),
                        [`${prefix}-selection-text-hide`]: Boolean(state().inputValue) && searching(),
                        [`${prefix}-selection-text-inactive`]: !state().inputValue && searching(),
                    })}
                    x-semi-prop="placeholder"
                >
                    <Show when={shown()} fallback={placeholderNode()}>
                        {content()}
                    </Show>
                </span>
                <Show when={filterable() && searching()}>{renderTriggerInput()}</Show>
            </div>
        );
    };

    const DefaultTrigger = () => (
        <>
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
                <Show when={local.multiple} fallback={<SingleSelection />}>
                    <MultipleSelection />
                </Show>
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
                <button ref={setClearButton} type="button" class={`${prefix}-clear`} aria-label={locale().locale.clear} onClick={(e) => handleClear(e)} onKeyDown={stopButtonActivationKeys}>
                    <Show when={hasContent(clearIcon())} fallback={<IconClear />}>
                        {clearIcon()}
                    </Show>
                </button>
            </Show>
            <Show when={local.showArrow} fallback={<div class={`${prefix}-arrow-empty`} />}>
                <div class={`${prefix}-arrow`} x-semi-prop="arrowIcon">
                    <Show when={arrowIcon() !== undefined} fallback={<IconChevronDown />}>
                        {arrowIcon()}
                    </Show>
                </div>
            </Show>
        </>
    );

    const optionItemProps = (record: Accessor<OptionRecord>, index: Accessor<number>, select: (e: MouseEvent) => void, rowStyle?: Accessor<JSX.CSSProperties>) => {
        const option = () => record().data;
        const merged = mergeProps(() => optionItemRest(option()), {
            get id() {
                return optionId(index());
            },
            get disabled() {
                return option().disabled;
            },
            get focused() {
                return index() === state().focusIndex;
            },
            get selected() {
                return record().selected;
            },
            get style() {
                return mergeStyles(rowStyle?.(), option().style);
            },
            get label() {
                return option().label;
            },
            get value() {
                return option().value;
            },
            get inputValue() {
                return state().inputValue;
            },
            get class() {
                return clsx(option().class, `${prefix}-option-custom`, { [`${prefix}-option-custom-selected`]: record().selected });
            },
            onMouseEnter: () => foundation.handleOptionMouseEnter(index()),
            onClick: (e: MouseEvent) => {
                if (!option().disabled) {
                    select(e);
                }
            },
        });
        return merged as OptionRenderProps;
    };

    const renderRow = (record: Accessor<OptionRecord>, index: Accessor<number>, rowStyle?: Accessor<JSX.CSSProperties>) => {
        const option = () => record().data;
        const focused = () => index() === state().focusIndex;
        // the option as kept in state, the same object Enter selects
        const select = (e: MouseEvent) => foundation.onSelect(record() as BaseOptionRecord, index(), e);
        // the children are created again only when the options are read again, not when a row's flags change
        const slot = createMemo(() => option()._slot);
        return (
            <Switch
                fallback={
                    <OptionView
                        {...getDataAttr(option())}
                        showTick={option().showTick ?? true}
                        disabled={option().disabled}
                        class={option().class}
                        style={mergeStyles(rowStyle?.(), option().style)}
                        focused={focused()}
                        inputValue={record().create ? undefined : state().inputValue}
                        selected={record().selected}
                        semiOptionId={optionId(index())}
                        onMouseEnter={() => foundation.handleOptionMouseEnter(index())}
                        onSelect={select}
                    >
                        <Show
                            when={!record().create}
                            fallback={
                                <>
                                    <span class={`${prefix}-create-tips`}>{locale().locale.createText}</span>
                                    {option().value}
                                </>
                            }
                        >
                            <Show when={slot()} keyed fallback={option().label}>
                                {(read) => read()}
                            </Show>
                        </Show>
                    </OptionView>
                }
            >
                <Match when={record().create && local.renderCreateItem}>
                    {(render) => (
                        <div id={optionId(index())} aria-selected="false" role="option" onClick={select}>
                            {renderCreate(render(), option().value, focused(), rowStyle?.())}
                        </div>
                    )}
                </Match>
                <Match when={!record().create && local.renderOptionItem} keyed>
                    {(render) => render(optionItemProps(record, index, select, rowStyle))}
                </Match>
            </Switch>
        );
    };

    const RunRows = (runProps: { run: Accessor<Run> }) => (
        <For each={runProps.run().rows}>
            {(key) => {
                // the last row stays readable while it is disposed after its key left the list
                const row = createMemo((previous?: { option: OptionRecord; index: number }) => rows().get(key) ?? previous, rows().get(key)) as Accessor<{ option: OptionRecord; index: number }>;
                return renderRow(
                    () => row().option,
                    () => row().index
                );
            }}
        </For>
    );

    const GroupedRows = () => (
        <For each={runKeys()}>
            {(key) => {
                const run = createMemo((previous?: Run) => runs().get(key) ?? previous) as Accessor<Run>;
                const titleId = () => (run().group?.id as string | undefined) ?? `${selectId()}-group-${run().first}`;
                return (
                    // OptionGroup renders no title without a label, and a group needs one for its name
                    <Show when={hasTitle(run().group)} fallback={<RunRows run={run} />}>
                        <div class={`${prefix}-group-wrapper`} aria-labelledby={titleId()} role="group">
                            <div {...titleAttrs(run().group as GroupRecord)} id={titleId()} class={clsx(run().group?.class as string | undefined, cssClasses.PREFIX_GROUP)} style={run().group?.style as JSX.CSSProperties | string | undefined}>
                                {run().group?.label}
                            </div>
                            <RunRows run={run} />
                        </div>
                    </Show>
                );
            }}
        </For>
    );

    const renderOptions = () => {
        const outerTop = children(() => local.outerTopSlot);
        const innerTop = children(() => local.innerTopSlot);
        const innerBottom = children(() => local.innerBottomSlot);
        const outerBottom = children(() => local.outerBottomSlot);
        const emptyContent = children(() => local.emptyContent);
        const isEmpty = () => visibleOptions().length === 0;
        const slot = (node: Accessor<ResolvedChildren>, slotName: string) => (
            <Show when={hasContent(node())}>
                <div class={`${prefix}-option-list-${slotName}-slot`} onMouseEnter={foundation.handleSlotMouseEnter}>
                    {node()}
                </div>
            </Show>
        );
        return (
            <div
                ref={setOptionContainer}
                class={clsx(
                    {
                        // No padding when the list is empty and emptyContent is null: nothing is shown
                        [`${prefix}-option-list-wrapper`]: !(isEmpty() && emptyContent() === null),
                    },
                    local.dropdownClassName
                )}
                style={local.dropdownStyle}
                onKeyDown={foundation.handleContainerKeyDown}
                onMouseDown={handleContainerMouseDown}
            >
                {slot(outerTop, 'outer-top')}
                <Show when={!searchInTrigger() && filterable()}>{renderDropdownInput()}</Show>
                <div
                    ref={setListbox}
                    id={listboxId}
                    class={clsx(`${prefix}-option-list`, { [`${prefix}-option-list-chosen`]: state().selections.size > 0 })}
                    style={{ 'max-height': toCssLength(local.maxHeight) }}
                    aria-label={name()['aria-label']}
                    aria-labelledby={name()['aria-labelledby']}
                    aria-multiselectable={Boolean(local.multiple)}
                    role="listbox"
                >
                    {slot(innerTop, 'inner-top')}
                    <Switch
                        fallback={
                            <Show when={local.virtualize} keyed fallback={<GroupedRows />}>
                                {(virtualize) => (
                                    <VirtualList ref={setVirtualList} style={{ direction: config().direction }} tabIndex={-1} height={virtualize.height || numbers.LIST_HEIGHT} itemCount={visibleOptions().length} itemData={visibleOptions()} itemSize={virtualize.itemSize} width={virtualize.width || '100%'}>
                                        {(row) => {
                                            const option = createMemo((previous?: OptionRecord) => row.data[row.index] ?? previous, row.data[row.index]) as Accessor<OptionRecord>;
                                            return renderRow(
                                                () => option(),
                                                () => row.index,
                                                () => row.style
                                            );
                                        }}
                                    </VirtualList>
                                )}
                            </Show>
                        }
                    >
                        <Match when={local.loading}>
                            <div class={`${prefix}-loading-wrapper`}>
                                <Spin />
                            </div>
                        </Match>
                        <Match when={isEmpty()}>
                            <Show when={emptyContent() !== null}>
                                <OptionView empty>{hasContent(emptyContent()) ? emptyContent() : locale().locale.emptyText}</OptionView>
                            </Show>
                        </Match>
                    </Switch>
                    {slot(innerBottom, 'inner-bottom')}
                </div>
                {slot(outerBottom, 'outer-bottom')}
            </div>
        );
    };

    const inputs = () => [records(), local.value] as const;

    // The selection keeps labels of earlier options, so it is not derived in render
    useWatch(inputs, ([next, value], [prevOptions, prevValue]) => {
        foundation.handleInputsChange({ optionsChanged: !isEqual(prevOptions, next), valueChanged: !isEqual(prevValue, value) }, value as Parameters<Foundation['handleInputsChange']>[1]);
    });

    return (
        <Popover
            ref={(handle) => (popover = handle)}
            style={local.dropdownMatchSelectWidth ? { 'min-width': 'var(--semi-tooltip-trigger-width)' } : undefined}
            role="presentation"
            afterClose={foundation.handlePopoverClose}
            autoAdjustOverflow={local.autoAdjustOverflow}
            content={renderOptions}
            disableArrowKeyDown
            motion={local.motion}
            position={position()}
            spacing={local.spacing}
            stopPropagation={local.stopPropagation}
            trigger="custom"
            visible={state().isOpen}
            onOpen={scrollToSelection}
        >
            {(getTriggerProps) => (
                <div
                    {...(getTriggerProps(
                        mergeProps(triggerOwn, {
                            // the spread memoizes this call and tracks the read; a spread signal object would call the ref again on any change
                            ref: untrack(() => mergeRefs<SelectElement>(setRoot, local.ref)),
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
