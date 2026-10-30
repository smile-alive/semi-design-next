import type React from 'react';
import { type CSSProperties, type MouseEvent, type ReactNode, Children, Fragment, useCallback, useDeferredValue, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { isEqual, isEqualWith } from 'es-toolkit';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { cssClasses, strings, numbers } from '@fibrae/semi-foundation/select/constants';
import SelectFoundation, { type SelectAdapter } from '@fibrae/semi-foundation/select/foundation';
import { type OptionRecord, getOptionRuns, optionListToRecords } from '@fibrae/semi-foundation/select/option-foundation';
import { cssClasses as tagCssClasses } from '@fibrae/semi-foundation/tag/constants';
import { isTextEditor, joinIds, stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import { centerInScroller } from '@fibrae/semi-foundation/utils/dom';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/select/select.scss';
import { IconChevronDown, IconClear, IconSearch } from '@fibrae/semi-icons-react';
import type { Bivariant, ByMultiple, ElementProps } from '../_base/base';
import type { ValidateStatus } from '../_base/base-component';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useMergedRef from '../_base/use-merged-ref';
import VirtualList, { type VirtualListHandle } from '../_base/virtual-list';
import { hasContent, isSameNode, renderTriggerPrefix, renderTriggerSuffix } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import { InputGroupContext, useInputGroupInScope, withInputGroup } from '../input/context';
import Input, { type InputProps, type InputHandle, type InputChangeEvent } from '../input/index';
import useLocale from '../locale/use-locale';
import OverflowList from '../overflow-list/index';
import Popover, { type PopoverHandle, type PopoverProps } from '../popover/index';
import Space from '../space/index';
import Spin from '../spin';
import TagGroup from '../tag/group';
import Tag from '../tag/index';
import type { Position, TooltipProps } from '../tooltip';
import Trigger from '../trigger';
import Text from '../typography/text';
import Option, { type OptionProps } from './option';
import OptionGroup, { type OptionGroupProps } from './option-group';
import { getOptionsFromGroup } from './utils';
import VirtualRow from './virtual-row';
export type { OptionProps } from './option';
export type { OptionGroupProps } from './option-group';
export type { VirtualRowProps } from './virtual-row';

const prefixcls = cssClasses.PREFIX;
// shared so an option without its own style passes memo(Option) the same object every render
const noStyle: CSSProperties = {};

type ExcludeInputType = {
    value?: InputProps['value'];
    onFocus?: InputProps['onFocus'];
    onChange?: InputProps['onChange'];
};

type OnChangeValueType = string | number | Record<string, any>;

/** A collected option; one read from a Select.OptGroup carries that group's props and key */
type OptionRow = OptionRecord<OptionProps, OptionGroupProps & { key?: React.Key }>;

export type BasicSelectValue = string | number | Record<string, any>;

type IsDefaultSelectGeneric<T> = [T] extends [BasicSelectValue] ? ([BasicSelectValue] extends [T] ? true : false) : false;

/**
 * Without a generic parameter: `string | number | any[] | Record | undefined`; with `T`: `T | T[] | undefined`.
 */
export type SelectValue<T = BasicSelectValue> = IsDefaultSelectGeneric<T> extends true ? BasicSelectValue | any[] | undefined : T | T[] | undefined;

export interface optionRenderProps {
    /** Put it on the role="option" element: the trigger's aria-activedescendant points at it */
    id?: string;
    key?: any;
    label?: React.ReactNode;
    value?: string | number;
    style?: React.CSSProperties;
    className?: string;
    selected?: boolean;
    focused?: boolean;
    show?: boolean;
    disabled?: boolean;
    onMouseEnter?: (e: React.MouseEvent) => any;
    onClick?: (e: React.MouseEvent) => any;
    [x: string]: any;
}

export interface SelectedItemProps {
    value: OptionProps['value'];
    label: OptionProps['label'];
}

export interface TriggerRenderProps {
    value: SelectedItemProps[];
    inputValue: string;
    onSearch: (inputValue: string) => void;
    onClear: () => void;
    onRemove: (option: OptionProps) => void;
    disabled: boolean;
    placeholder: React.ReactNode;
    componentProps: Record<string, any>;
}

/** The methods on a Select ref */
export interface SelectHandle {
    /** closes the dropdown */
    close: () => void;
    /** opens the dropdown */
    open: () => void;
    /** focuses the trigger, or the search input when filterable; the dropdown opens only when filterable */
    focus: () => void;
    /** empties the search input */
    clearInput: () => void;
    /** selects every option (multiple only) */
    selectAll: () => void;
    /** clears every selection */
    deselectAll: () => void;
    /** searches as if `value` were typed into the search input */
    search: (value: string, event?: unknown) => void;
    /** Repositions the open dropdown at once; it already follows scrolling, resizing and trigger moves, a move a frame late */
    rePosition: () => void;
}
export type SelectSize = Size;

export interface virtualListProps {
    itemSize: number;
    height?: number;
    width?: string | number;
}

export type RenderSingleSelectedItemFn = (optionNode: Record<string, any>) => React.ReactNode;
export type RenderMultipleSelectedItemFn = (
    optionNode: Record<string, any>,
    multipleProps: {
        index: number;
        disabled: boolean;
        onClose: (tagContent: React.ReactNode, e: MouseEvent | React.KeyboardEvent) => void;
    }
) => { isRenderInTag: boolean; content: React.ReactNode };

export type RenderSelectedItemFn = RenderSingleSelectedItemFn | RenderMultipleSelectedItemFn;

type SelectChangeValue<T, Multiple> = ByMultiple<Multiple, T | undefined, T[]>;

/**
 * `T` is the option value type, or the option object with `onChangeWithObject`; `Multiple` follows the `multiple` prop
 */
export interface SelectProps<T = BasicSelectValue, Multiple extends boolean | undefined = undefined> extends ElementProps<'div', 'prefix' | 'defaultValue' | 'onChange' | 'onSelect'>, Pick<TooltipProps, 'spacing' | 'motion' | 'autoAdjustOverflow' | 'stopPropagation'> {
    /** Accessible name of the combobox: the search input while it is in the trigger, otherwise the trigger */
    'aria-label'?: React.AriaAttributes['aria-label'];
    id?: string;
    autoFocus?: boolean;
    autoClearSearchValue?: boolean;
    arrowIcon?: React.ReactNode;
    borderless?: boolean;
    clearIcon?: React.ReactNode;
    defaultValue?: SelectValue<T>;
    value?: SelectValue<T>;
    placeholder?: React.ReactNode;
    onChange?: (value: SelectChangeValue<T, Multiple>) => void;
    multiple?: Multiple;
    filter?: boolean | ((inpueValue: string, option: OptionProps) => boolean);
    max?: number;
    maxTagCount?: number;
    maxHeight?: string | number;
    style?: React.CSSProperties;
    className?: string;
    size?: SelectSize;
    disabled?: boolean;
    emptyContent?: React.ReactNode;
    expandRestTagsOnClick?: boolean;
    onDropdownVisibleChange?: (visible: boolean) => void;
    position?: Position;
    /**
     * `event` is what changed the keyword; none when called through the ref or triggerRender
     */
    onSearch?: (value: string, event?: InputChangeEvent | React.KeyboardEvent | React.MouseEvent | globalThis.MouseEvent) => void;
    dropdownClassName?: string;
    dropdownStyle?: React.CSSProperties;
    ellipsisTrigger?: boolean;
    outerTopSlot?: React.ReactNode;
    innerTopSlot?: React.ReactNode;
    outerBottomSlot?: React.ReactNode;
    innerBottomSlot?: React.ReactNode;
    optionList?: OptionProps[];
    dropdownMatchSelectWidth?: boolean;
    loading?: boolean;
    defaultOpen?: boolean;
    validateStatus?: ValidateStatus;
    defaultActiveFirstOption?: boolean;
    onChangeWithObject?: boolean;
    suffix?: React.ReactNode;
    searchPosition?: 'trigger' | 'dropdown';
    searchPlaceholder?: string;
    prefix?: React.ReactNode;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    inputProps?: Omit<InputProps, keyof ExcludeInputType>;
    showClear?: boolean;
    showArrow?: boolean;
    renderSelectedItem?: ByMultiple<Multiple, RenderSingleSelectedItemFn, RenderMultipleSelectedItemFn>;
    renderCreateItem?: (inputValue: OptionProps['value'], focus: boolean, style?: React.CSSProperties) => React.ReactNode;
    renderOptionItem?: (props: optionRenderProps) => React.ReactNode;
    onMouseEnter?: (e: React.MouseEvent) => any;
    onMouseLeave?: (e: React.MouseEvent) => any;
    clickToHide?: boolean;
    onExceed?: (option: OptionProps) => void;
    onCreate?: (option: OptionProps) => void;
    remote?: boolean;
    onDeselect?: (value: OptionProps['value'], option: Record<string, any>) => void;
    onSelect?: (value: OptionProps['value'], option: Record<string, any>) => void;
    allowCreate?: boolean;
    triggerRender?: (props: TriggerRenderProps) => React.ReactNode;
    onClear?: () => void;
    virtualize?: virtualListProps;
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
    /** a click outside the open Select passes its mousedown event */
    onBlur?: (e: React.FocusEvent<HTMLElement> | globalThis.MouseEvent) => void;
    onListScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
    children?: React.ReactNode;
    preventScroll?: boolean;
    showRestTagsPopover?: boolean;
    restTagsPopoverProps?: PopoverProps;
    /** the imperative methods, see SelectHandle */
    ref?: React.Ref<SelectHandle>;
}

interface SelectBodyProps<T> extends Omit<SelectProps<T, boolean>, 'onChange'> {
    onChange?: Bivariant<[value: SelectChangeValue<T, boolean>]>;
}

export interface SelectState {
    isOpen: boolean;
    isFocus: boolean;
    options: OptionRow[];
    selections: Map<OptionProps['value'], any>;
    inputValue: string;
    showInput: boolean;
    focusIndex: number;
    isFocusInContainer: boolean;
    isFullTags: boolean;
    overflowItemCount: number;
}

const defaultProps = {
    stopPropagation: true,
    motion: true,
    borderless: false,
    filter: false,
    multiple: false,
    disabled: false,
    defaultOpen: false,
    allowCreate: false,
    placeholder: '',
    onDropdownVisibleChange: noop,
    onChangeWithObject: false,
    onChange: noop,
    onSearch: noop,
    onMouseEnter: noop,
    onMouseLeave: noop,
    onDeselect: noop,
    onSelect: noop,
    onCreate: noop,
    onExceed: noop,
    onFocus: noop,
    onBlur: noop,
    onClear: noop,
    onListScroll: noop,
    maxHeight: numbers.LIST_HEIGHT,
    dropdownMatchSelectWidth: true,
    defaultActiveFirstOption: true,
    showArrow: true,
    showClear: false,
    searchPosition: strings.SEARCH_POSITION_TRIGGER,
    remote: false,
    autoAdjustOverflow: true,
    autoClearSearchValue: true,
    arrowIcon: <IconChevronDown />,
    showRestTagsPopover: false,
    restTagsPopoverProps: {},
    expandRestTagsOnClick: false,
    ellipsisTrigger: false,
} satisfies Partial<SelectBodyProps<any>>;

function defaultRenderMultipleItem(optionNode: OptionProps) {
    return { isRenderInTag: true, content: optionNode.label };
}

function collectOptions({ optionList, children }: Pick<SelectBodyProps<unknown>, 'optionList' | 'children'>) {
    return optionListToRecords(optionList) ?? getOptionsFromGroup(children);
}

function Select<T = BasicSelectValue, Multiple extends boolean | undefined = undefined>(rawProps: SelectProps<T, Multiple>) {
    const bodyProps: SelectBodyProps<T> = rawProps;
    const props = useDefaultProps('Select', withInputGroup(bodyProps, useInputGroupInScope()), defaultProps);

    const {
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        id,
        autoFocus,
        autoClearSearchValue,
        arrowIcon,
        borderless,
        clearIcon,
        defaultValue,
        value,
        placeholder,
        onChange,
        multiple,
        filter,
        max,
        maxTagCount,
        maxHeight,
        style,
        className,
        size,
        disabled,
        emptyContent,
        expandRestTagsOnClick,
        onDropdownVisibleChange,
        position: positionProp,
        onSearch,
        dropdownClassName,
        dropdownStyle,
        ellipsisTrigger,
        outerTopSlot,
        innerTopSlot,
        outerBottomSlot,
        innerBottomSlot,
        optionList,
        dropdownMatchSelectWidth,
        loading,
        defaultOpen,
        validateStatus,
        defaultActiveFirstOption,
        onChangeWithObject,
        suffix,
        searchPosition,
        searchPlaceholder,
        prefix,
        insetLabel,
        insetLabelId,
        inputProps,
        showClear,
        showArrow,
        renderSelectedItem,
        renderCreateItem,
        renderOptionItem,
        onMouseEnter,
        onMouseLeave,
        clickToHide,
        onExceed,
        onCreate,
        remote,
        onDeselect,
        onSelect,
        allowCreate,
        triggerRender,
        onClear,
        virtualize,
        onFocus,
        onBlur,
        onListScroll,
        children,
        preventScroll,
        showRestTagsPopover,
        restTagsPopoverProps,
        ref,
        spacing,
        motion,
        autoAdjustOverflow,
        stopPropagation,
        ...rest
    } = props;

    const { direction } = useConfigContext();
    const { locale } = useLocale('Select');

    const triggerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<InputHandle>(null);
    const dropdownInputRef = useRef<InputHandle>(null);
    const optionContainerEl = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<PopoverHandle>(null);
    const virtualizeListRef = useRef<VirtualListHandle>(null);
    const selectOptionListID = useId();
    const generatedId = useId();
    const selectionTextId = useId();
    const prevInputsRef = useRef<{ children: ReactNode[]; optionList: OptionProps[]; value: unknown }>(null);
    let position = positionProp;

    const [foundation, state] = useFoundation<SelectFoundation<SelectBodyProps<T>, SelectState, React.UIEvent<HTMLDivElement>>, SelectAdapter<SelectBodyProps<T>, SelectState, React.UIEvent<HTMLDivElement>>, SelectBodyProps<T>, SelectState>(
        SelectFoundation,
        props,
        () => {
            const initial = SelectFoundation.getInitialState(props, collectOptions(props));
            return {
                isOpen: false,
                isFocus: false,
                inputValue: '',
                showInput: false,
                isFocusInContainer: false,
                isFullTags: false,
                ...initial,
                options: initial.options as OptionRow[],
            };
        },
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleInputShow: (showInput, cb) => base.setState({ showInput }, cb),
            focusInput: () => inputRef.current?.focus({ preventScroll: base.getProp('preventScroll') }),
            focusDropdownInput: () => dropdownInputRef.current?.focus({ preventScroll: base.getProp('preventScroll') }),
            notifyMaxLimit: (option) => base.getProps().onExceed(option as OptionProps),
            getMaxLimit: () => base.getProp('max'),
            notifyDeselect: (value, option) => base.getProps().onDeselect(value, option),
            getOptionsFromChildren: () => collectOptions(base.getProps()),
            updateOptions: (options) => base.setState({ options: options as OptionRow[] }),
            openMenu: (cb) => base.setState({ isOpen: true }, cb),
            closeMenu: () => base.setState({ isOpen: false }),
            updateSelection: (selections) => base.setState({ selections }),
            getSelections: () => new Map(base.getState('selections')),
            notifyChange: (value: OnChangeValueType | OnChangeValueType[]) => base.getProps().onChange(value as T | T[]),
            notifySelect: (value, option) => base.getProps().onSelect(value, option),
            notifyDropdownVisibleChange: (visible) => base.getProps().onDropdownVisibleChange(visible),
            notifySearch: (input, event) => base.getProps().onSearch(input, event),
            notifyCreate: (input) => base.getProps().onCreate(input as OptionProps),
            notifyMouseEnter: (e) => base.getProps().onMouseEnter(e),
            notifyMouseLeave: (e) => base.getProps().onMouseLeave(e),
            notifyFocus: (event) => base.getProps().onFocus(event),
            notifyBlur: (event) => base.getProps().onBlur(event),
            notifyClear: () => base.getProps().onClear(),
            notifyListScroll: (e) => base.getProps().onListScroll(e),
            updateFocusState: (isFocus) => base.setState({ isFocus }),
            updateOverflowItemCount: (overflowItemCount) => base.setState({ overflowItemCount }),
            focusTrigger: () => triggerRef.current?.focus({ preventScroll: base.getProp('preventScroll') }),
            getOptionList: () => optionContainerEl.current,
            setIsFocusInContainer: (isFocusInContainer) => base.setState({ isFocusInContainer }),
            getIsFocusInContainer: () => base.getState('isFocusInContainer'),
            updateScrollTop: (index) => {
                if (index !== undefined && virtualizeListRef.current) {
                    virtualizeListRef.current.scrollToItem(index);
                    return;
                }
                const custom = base.getProps().renderOptionItem !== undefined;
                let destNode: HTMLElement | null | undefined;
                if (index === undefined) {
                    destNode = optionContainerEl.current?.querySelector<HTMLElement>(`.${prefixcls}-option${custom ? '-custom' : ''}-selected`);
                } else {
                    // by id inside the list, not :nth-child (group titles are siblings of the options) or document.getElementById (misses a ShadowRoot)
                    destNode = optionContainerEl.current?.querySelector<HTMLElement>(`#${CSS.escape(`${base.getProps().id || generatedId}-option-${index}`)}`);
                }
                const listbox = destNode?.closest<HTMLElement>('[role="listbox"]');
                if (destNode && listbox) {
                    centerInScroller(destNode, listbox);
                }
            },
        })
    );

    // inputProps may carry a ref, which must not take the handle the foundation focuses
    const triggerInputRef = useMergedRef(inputRef, props.inputProps?.ref);
    const dropdownSearchRef = useMergedRef(dropdownInputRef, props.inputProps?.ref);
    const { isOpen } = state;
    const { selections, inputValue, isFocus, showInput, focusIndex, options, isFullTags, overflowItemCount } = state;

    // only a keyword change is deferred; clicks and arrow keys paint with the live state
    const lagOptions = useDeferredValue(options);
    const lagInputValue = useDeferredValue(inputValue);
    const keywordSettled = lagInputValue === inputValue;
    const liveVisibleOptions = useMemo(() => options.filter((item) => item.show), [options]);
    const lagVisibleOptions = useMemo(() => lagOptions.filter((item) => item.show), [lagOptions]);
    const visibleOptions = keywordSettled ? liveVisibleOptions : lagVisibleOptions;

    // focusIndex indexes the live list; while rows lag behind, the highlight follows that option or none
    const liveFocusedOption = liveVisibleOptions[focusIndex];
    const deferredFocusIndex = keywordSettled ? focusIndex : visibleOptions.findIndex((option) => liveFocusedOption && option.data.value === liveFocusedOption.data.value);
    const selectID = id || generatedId;

    // A removed node fires no blur: hand its focus to the combobox instead of dropping it to the body
    const setClearButton = useCallback(
        (node: HTMLButtonElement) => () => {
            if (node === FocusTrapHandle.getActiveElement(node)) {
                (inputRef.current ?? triggerRef.current)?.focus({ preventScroll: foundation.getProps().preventScroll });
            }
        },
        [foundation]
    );

    // The selection keeps labels of earlier options, so it is not derived in render
    useLayoutEffect(() => {
        const prev = prevInputsRef.current;
        const children = Children.toArray(props.children);
        prevInputsRef.current = { children, optionList: props.optionList, value: props.value };
        if (!prev) {
            return;
        }
        const optionsChanged = !isEqualWith(prev.children, children, isSameNode) || !isEqualWith(prev.optionList, props.optionList, isSameNode);
        foundation.handleInputsChange({ optionsChanged, valueChanged: !isEqual(prev.value, props.value) }, props.value);
    });

    const markPressInside = useClickOutside([triggerRef, optionContainerEl], foundation.handleClickOutside, isOpen);

    useImperativeHandle(
        props.ref,
        () => ({
            close: () => foundation.close(),
            open: () => foundation.open(),
            focus: () => foundation.focus(),
            clearInput: () => foundation.clearInput(),
            selectAll: foundation.selectAll,
            deselectAll: foundation.clearSelected,
            search: foundation.handleInputChange,
            rePosition: () => popoverRef.current?.rePosition(),
        }),
        [foundation]
    );

    if (position === undefined) {
        position = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
    }

    let inner: React.ReactNode;

    const filterable = Boolean(filter);

    // while loading the list shows a spinner instead of the options
    const activeDescendant = isOpen && !loading && deferredFocusIndex !== -1 && deferredFocusIndex < visibleOptions.length ? `${selectID}-option-${deferredFocusIndex}` : undefined;
    const hasPrefix = hasContent(prefix) || hasContent(insetLabel);
    const insetLabelShown = hasContent(insetLabel) && !hasContent(prefix) && typeof triggerRender !== 'function';
    const prefixId = insetLabelId ?? (insetLabelShown ? `${selectID}-inset-label` : undefined);
    const name = comboboxName(ariaLabelledby, ariaLabel, insetLabelShown ? prefixId : undefined, locale.label);

    // ARIA 1.2: the search input in the trigger is the combobox; otherwise the trigger is a select-only combobox
    const inputIsCombobox = filterable && searchPosition === strings.SEARCH_POSITION_TRIGGER && typeof triggerRender !== 'function' && (multiple || showInput);

    const comboboxProps = {
        role: 'combobox',
        'aria-activedescendant': activeDescendant,
        'aria-controls': isOpen ? selectOptionListID : undefined,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-expanded': isOpen,
        'aria-haspopup': 'listbox',
        'aria-invalid': ariaInvalid,
        'aria-required': ariaRequired,
        ...name,
    } as const;

    const triggerAriaProps = inputIsCombobox ? {} : { ...comboboxProps, 'aria-disabled': disabled };
    const triggerInputId = inputProps?.id ?? `${selectID}-input`;

    // One handler pair per visible option, kept while the options are unchanged: hover and arrow keys only move the
    // focus index, so every memo(Option) except the two whose `focused` flips can skip rendering
    const optionHandlers = useMemo(
        () =>
            visibleOptions.map((option, optionIndex) => {
                const liveIndex = () => (keywordSettled ? optionIndex : liveVisibleOptions.findIndex((item) => item.data.value === option.data.value));
                return {
                    onMouseEnter: () => foundation.handleOptionMouseEnter(liveIndex()),
                    // the option as kept in state, the same object Enter selects; Option's own copy drops its props
                    onSelect: (_: OptionProps, e: unknown) => foundation.onSelect(option, liveIndex(), e),
                };
            }),
        [visibleOptions, keywordSettled, liveVisibleOptions, foundation]
    );

    const multipleItemRenderer = (renderSelectedItem ?? defaultRenderMultipleItem) as RenderMultipleSelectedItemFn;

    // the same size mapping as TreeSelect, Cascader and TagInput: a default-size trigger holds large tags
    const tagSize = size === 'small' ? 'small' : 'large';
    const useCustomTrigger = typeof triggerRender === 'function';

    const selectionCls = useCustomTrigger
        ? clsx(className)
        : clsx(prefixcls, className, {
              [`${prefixcls}-borderless`]: borderless,
              [`${prefixcls}-open`]: isOpen,
              [`${prefixcls}-focus`]: isFocus,
              [`${prefixcls}-disabled`]: disabled,
              [`${prefixcls}-single`]: !multiple,
              [`${prefixcls}-multiple`]: multiple,
              [`${prefixcls}-filterable`]: filterable,
              [`${prefixcls}-small`]: size === 'small',
              [`${prefixcls}-large`]: size === 'large',
              [`${prefixcls}-error`]: validateStatus === 'error',
              [`${prefixcls}-warning`]: validateStatus === 'warning',
              [`${prefixcls}-no-arrow`]: !showArrow,
              [`${prefixcls}-with-prefix`]: hasPrefix,
              [`${prefixcls}-with-suffix`]: hasContent(suffix),
          });

    const clearable = showClear && (selections.size || inputValue) && !disabled;

    const handleInputChange = (sugInput: string, event?: InputChangeEvent) => foundation.handleInputChange(sugInput, event);

    const handleClear = (e?: React.MouseEvent) => {
        e?.nativeEvent.stopImmediatePropagation();
        foundation.handleClearClick(e);
    };

    const renderTriggerInput = () => {
        const inputcls = clsx(
            `${prefixcls}-input`,
            {
                [`${prefixcls}-input-single`]: !multiple,
                [`${prefixcls}-input-multiple`]: multiple,
            },
            inputProps?.className
        );

        const selectInputProps: Record<string, any> = {
            id: triggerInputId,
            value: inputValue,
            disabled,
            onChange: handleInputChange,
            // the trigger draws its own clear button and adornments: global Input defaults must not add them
            showClear: false,
            prefix: null,
            suffix: null,
            insetLabel: null,
            addonBefore: null,
            addonAfter: null,
            ...inputProps,
            className: inputcls,
            ref: triggerInputRef,
            onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                inputProps?.onBlur?.(e);
                foundation.handleInputBlur();
            },
        };

        if (multiple) {
            selectInputProps.style = { width: inputValue ? `${inputValue.length * 16}px` : '2px' };
        }
        return (
            <Input
                {...comboboxProps}
                aria-autocomplete="list"
                // the single-select input is empty until typing, so the selected text is exposed as its description
                aria-describedby={joinIds(ariaDescribedby, multiple || inputValue ? undefined : selectionTextId)}
                size={size}
                onFocus={(e) => {
                    foundation.handleInputFocus(e);
                    // prevent event bubbling which will fire trigger onFocus event
                    e.stopPropagation();
                }}
                {...selectInputProps}
            />
        );
    };

    const renderDropdownInput = () => {
        const inputCls = clsx(
            `${prefixcls}-dropdown-input`,
            {
                [`${prefixcls}-dropdown-input-single`]: !multiple,
                [`${prefixcls}-dropdown-input-multiple`]: multiple,
            },
            inputProps?.className
        );

        const selectInputProps: Record<string, any> = {
            value: inputValue,
            disabled,
            onChange: handleInputChange,
            placeholder: searchPlaceholder,
            showClear: true,
            // global Input defaults must not add adornments to the search field
            suffix: null,
            insetLabel: null,
            addonBefore: null,
            addonAfter: null,
            ...inputProps,
            className: inputCls,
            ref: dropdownSearchRef,
            // the popup is not a DOM descendant of the trigger div, so keydown does not bubble to it
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                inputProps?.onKeyDown?.(e);
                foundation.handleKeyDown(e);
            },
        };

        return (
            <div className={`${prefixcls}-dropdown-search-wrapper`}>
                {/* a search field over the trigger's list, not a second combobox (the React Aria Autocomplete pattern) */}
                <Input aria-activedescendant={activeDescendant} aria-autocomplete="list" aria-controls={selectOptionListID} {...name} prefix={<IconSearch />} {...selectInputProps} />
            </div>
        );
    };

    const renderCreateOption = (option: OptionProps, isFocused: boolean, optionIndex: number, optionStyle: React.CSSProperties) => {
        if (typeof renderCreateItem === 'undefined') {
            return (
                <Option key={option.key || (option.label as string) + option.value} showTick {...optionHandlers[optionIndex]} {...option} style={optionStyle} focused={isFocused} semiOptionId={`${selectID}-option-${optionIndex}`}>
                    <span className={`${prefixcls}-create-tips`}>{locale.createText}</span>
                    {option.value}
                </Option>
            );
        }

        const customCreateItem = renderCreateItem(option.value, isFocused, optionStyle);

        return (
            <div key={option.key || option.label} id={`${selectID}-option-${optionIndex}`} aria-selected="false" role="option" onClick={(e) => optionHandlers[optionIndex].onSelect(option, e)}>
                {customCreateItem}
            </div>
        );
    };

    const renderOption = (record: OptionRow, optionIndex: number, rowStyle?: React.CSSProperties) => {
        const { data: option } = record;
        const isFocused = optionIndex === deferredFocusIndex;
        const optionStyle = option.style ? { ...rowStyle, ...option.style } : (rowStyle ?? noStyle);
        if (record.create) {
            return renderCreateOption(option, isFocused, optionIndex, rowStyle);
        }
        return (
            <Option
                showTick
                {...option}
                // the record's index, not the visible index: a row that filtering moves up keeps its node
                key={option.key || record.childKey || (option.label as string) + option.value + record.index}
                style={optionStyle}
                focused={isFocused}
                inputValue={inputValue}
                selected={record.selected}
                semiOptionId={`${selectID}-option-${optionIndex}`}
                renderOptionItem={renderOptionItem}
                {...optionHandlers[optionIndex]}
            >
                {option.label}
            </Option>
        );
    };

    const renderWithGroup = (visibleOptions: OptionRow[]) => {
        return getOptionRuns(visibleOptions).flatMap(({ group, first, rows }) => {
            const nodes = rows.map(({ option, index }) => renderOption(option, index));
            // OptionGroup renders no title without a label, and a group needs one for its name
            if (!group || (!group.label && typeof group.label !== 'number')) {
                return nodes;
            }
            const { key: groupKey, ...groupProps } = group;
            const titleId = groupProps.id ?? `${selectID}-group-${first}`;
            return (
                <div key={groupKey} className={`${prefixcls}-group-wrapper`} aria-labelledby={titleId} role="group">
                    <OptionGroup {...groupProps} id={titleId} />
                    {nodes}
                </div>
            );
        });
    };

    const renderOptions = () => {
        const listContent = virtualize ? (
            <VirtualList ref={virtualizeListRef} style={{ direction }} tabIndex={-1} height={virtualize.height || numbers.LIST_HEIGHT} itemCount={visibleOptions.length} itemData={{ visibleOptions, renderOption }} itemSize={virtualize.itemSize} width={virtualize.width || '100%'}>
                {VirtualRow}
            </VirtualList>
        ) : (
            renderWithGroup(visibleOptions)
        );

        const isEmpty = visibleOptions.length === 0;
        let body: React.ReactNode = listContent;
        if (loading) {
            body = (
                <div className={`${prefixcls}-loading-wrapper`}>
                    <Spin />
                </div>
            );
        } else if (isEmpty) {
            body = <Option empty emptyContent={emptyContent} />;
        }
        const renderSlot = (slot: React.ReactNode, name: string) =>
            slot ? (
                <div className={`${prefixcls}-option-list-${name}-slot`} onMouseEnter={foundation.handleSlotMouseEnter}>
                    {slot}
                </div>
            ) : null;

        return (
            <div
                ref={optionContainerEl}
                className={clsx(
                    {
                        // No padding when the list is empty and emptyContent is null: nothing is shown
                        [`${prefixcls}-option-list-wrapper`]: !(isEmpty && emptyContent === null),
                    },
                    dropdownClassName
                )}
                style={dropdownStyle}
                onKeyDown={foundation.handleContainerKeyDown}
                // A press would move the focus to the popup container, where the keys never reach the combobox; it
                // stays on the trigger or the dropdown search input. A text field in a slot still takes the focus.
                onMouseDown={(e) => {
                    if (!isTextEditor(e.target)) {
                        e.preventDefault();
                    }
                }}
                onMouseDownCapture={markPressInside}
            >
                {renderSlot(outerTopSlot, 'outer-top')}
                {searchPosition === strings.SEARCH_POSITION_DROPDOWN && filter && renderDropdownInput()}
                <div
                    id={selectOptionListID}
                    className={clsx({
                        [`${prefixcls}-option-list`]: true,
                        [`${prefixcls}-option-list-chosen`]: selections.size,
                    })}
                    style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
                    // a name source only: accname would read the combobox's value (typed or selected text)
                    {...name}
                    aria-multiselectable={multiple}
                    role="listbox"
                    // capture: with virtualize the scrolling element is the VirtualList inside, and scroll does not bubble
                    onScrollCapture={foundation.handleListScroll}
                >
                    {renderSlot(innerTopSlot, 'inner-top')}
                    {body}
                    {renderSlot(innerBottomSlot, 'inner-bottom')}
                </div>
                {renderSlot(outerBottomSlot, 'outer-bottom')}
            </div>
        );
    };

    const renderSingleSelection = () => {
        let renderText: React.ReactNode = '';
        const selectedItems = [...selections];
        if (selectedItems.length) {
            const selectedItem = selectedItems[0][1];
            renderText = typeof renderSelectedItem === 'undefined' ? selectedItem.label : (renderSelectedItem as RenderSingleSelectedItemFn)(selectedItem);
        }

        const showInputInTrigger = searchPosition === strings.SEARCH_POSITION_TRIGGER;

        const spanCls = clsx({
            [`${prefixcls}-selection-text`]: true,
            [`${prefixcls}-selection-placeholder`]: !renderText && renderText !== 0,
            [`${prefixcls}-selection-text-hide`]: inputValue && showInput && showInputInTrigger,
            [`${prefixcls}-selection-text-inactive`]: !inputValue && showInput && showInputInTrigger,
        });

        return (
            <div className={`${prefixcls}-content-wrapper`}>
                <span id={selectionTextId} className={spanCls} x-semi-prop="placeholder">
                    {renderText || renderText === 0 ? renderText : placeholder}
                </span>
                {filterable && showInput && showInputInTrigger && renderTriggerInput()}
            </div>
        );
    };

    const removeTagOnClose = (option: OptionProps) => (_tagContent: React.ReactNode, e: MouseEvent | React.KeyboardEvent) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault(); // make sure that tag will not hidden immediately in controlled mode
        }
        const tag = e?.currentTarget instanceof Element ? e.currentTarget.closest(`.${tagCssClasses.PREFIX}`) : null;
        if (tag && tag === FocusTrapHandle.getActiveElement(tag)) {
            foundation.focus(undefined, false);
        }
        foundation.removeTag(option);
    };

    const renderTag = (item: [OptionProps['value'], any], i: number, { collapsed = false, inTagGroup = false } = {}) => {
        const tagValue = item[1].value;
        const tagDisabled = item[1].disabled || disabled;
        const onClose = removeTagOnClose(item[1]);
        const { content, isRenderInTag } = multipleItemRenderer(item[1], { index: i, disabled: tagDisabled, onClose });
        const realContent =
            collapsed && typeof renderSelectedItem !== 'function' ? (
                <Text
                    ellipsis={{
                        rows: 1,
                        showTooltip: { type: 'popover', opts: { style: { width: 'auto', fontSize: 12 } } },
                    }}
                    size="small"
                >
                    {content}
                </Text>
            ) : (
                content
            );
        if (isRenderInTag) {
            const tagProps = {
                // Tag declares no `disabled`; it lands on the Tag's root div
                disabled: tagDisabled,
                ...(inTagGroup ? { tabIndex: -1 } : { style: { maxWidth: '100%' } }),
            };
            return (
                <Tag {...tagProps} key={tagValue} closable={!tagDisabled} color="white" size={tagSize} onClose={onClose}>
                    {realContent}
                </Tag>
            );
        }
        return <Fragment key={tagValue}>{realContent}</Fragment>;
    };

    const renderNTag = (n: number, restTags: [OptionProps['value'], any][]) => {
        const nTag = (
            <Tag key={`_+${n}`} className={`${prefixcls}-content-wrapper-collapse-tag`} style={{ marginRight: 0, flexShrink: 0 }} closable={false} color="grey" size={tagSize}>
                +{n}
            </Tag>
        );
        if (!showRestTagsPopover) {
            return nTag;
        }
        return (
            <Popover
                autoAdjustOverflow
                content={
                    <Space style={{ maxWidth: '400px' }} spacing={2} wrap>
                        {restTags.map((tag, index) => renderTag(tag, index))}
                    </Space>
                }
                position="top"
                showArrow
                trigger="hover"
                {...restTagsPopoverProps}
                key={`_+${n}_Popover`}
            >
                {nTag}
            </Popover>
        );
    };

    // OverflowList shows the first overflowed item collapsed, so only the others count as hidden
    const handleOverflow = (items: [OptionProps['value'], any][]) => {
        const hiddenByMaxTagCount = selections.size - Math.min(selections.size, maxTagCount);
        const newOverFlowItemCount = hiddenByMaxTagCount + Math.max(items.length - 1, 0);
        if (overflowItemCount !== newOverFlowItemCount) {
            foundation.updateOverflowItemCount(selections.size, newOverFlowItemCount);
        }
    };

    const renderCollapsedTags = (selectedItems: [OptionProps['value'], any][], length?: number) => {
        const normalTags = typeof length === 'number' ? selectedItems.slice(0, length) : selectedItems;
        return (
            <div className={`${prefixcls}-content-wrapper-collapse`}>
                <OverflowList
                    itemKey={(item) => item?.[1]?.value}
                    items={normalTags}
                    overflowRenderer={(overflowItems) =>
                        overflowItems.length && overflowItems[0]
                            ? renderTag(overflowItems[0], length - 1, {
                                  collapsed: true,
                              })
                            : null
                    }
                    visibleItemRenderer={(item, index) => renderTag(item, index)}
                    onOverflow={(overflowItems) => handleOverflow(overflowItems)}
                />
                {overflowItemCount > 0 && renderNTag(overflowItemCount, selectedItems.slice(selectedItems.length - overflowItemCount))}
            </div>
        );
    };

    const renderOneLineTags = (selectedItems: [OptionProps['value'], any][], n?: number) => {
        if (showRestTagsPopover) {
            const mapItems = isFullTags ? selectedItems : selectedItems.slice(0, maxTagCount);
            return (
                <TagGroup
                    maxTagCount={n}
                    mode="custom"
                    popoverProps={restTagsPopoverProps}
                    restCount={isFullTags ? undefined : selectedItems.length - maxTagCount}
                    showPopover={showRestTagsPopover}
                    size={tagSize}
                    tagList={mapItems.map((item, i) => renderTag(item, i, { inTagGroup: true }))}
                    onPlusNMouseEnter={foundation.updateIsFullTags}
                />
            );
        }
        return <TagGroup maxTagCount={n} mode="custom" restCount={selectedItems.length - maxTagCount} size={tagSize} tagList={selectedItems.slice(0, maxTagCount).map((item, i) => renderTag(item, i, { inTagGroup: true }))} />;
    };

    const renderMultipleSelection = () => {
        const selectedItems = [...selections];

        const contentWrapperCls = clsx({
            [`${prefixcls}-content-wrapper`]: true,
            [`${prefixcls}-content-wrapper-one-line`]: maxTagCount && !isOpen,
            [`${prefixcls}-content-wrapper-empty`]: !selectedItems.length,
        });

        const spanCls = clsx({
            [`${prefixcls}-selection-text`]: true,
            [`${prefixcls}-selection-placeholder`]: !selectedItems.length,
            [`${prefixcls}-selection-text-hide`]: selectedItems && selectedItems.length,
        });
        const placeholderText = placeholder && !inputValue ? <span className={spanCls}>{placeholder}</span> : null;
        const n = selectedItems.length > maxTagCount ? maxTagCount : undefined;
        const NotOneLine = !maxTagCount;

        let tagContent: ReactNode;
        if (NotOneLine || (expandRestTagsOnClick && isOpen)) {
            tagContent = selectedItems.map((item, i) => renderTag(item, i));
        } else if (ellipsisTrigger) {
            tagContent = renderCollapsedTags(selectedItems, n);
        } else {
            tagContent = renderOneLineTags(selectedItems, n);
        }

        const showTriggerInput = filterable && searchPosition === strings.SEARCH_POSITION_TRIGGER;

        return (
            <div className={contentWrapperCls}>
                {selectedItems && selectedItems.length ? tagContent : placeholderText}
                {showTriggerInput && renderTriggerInput()}
            </div>
        );
    };

    const scrollToSelection = () => {
        // Home, End or typing may have moved the highlight off the selection before the list mounted
        if (virtualize && focusIndex !== -1) {
            virtualizeListRef.current?.scrollToItem(focusIndex, 'center');
        } else if (virtualize) {
            const first = options.find((option) => option.selected && option.index >= 0);
            if (first) {
                virtualizeListRef.current?.scrollToItem(first.index, 'center');
            }
        } else {
            foundation.updateScrollTop();
        }
    };

    if (useCustomTrigger) {
        // a triggerRender that spreads componentProps must not grab the Select's ref
        const componentProps = { ...props };
        delete componentProps.ref;
        inner = <Trigger disabled={disabled} placeholder={placeholder} value={Array.from(selections.values())} componentProps={componentProps} inputValue={inputValue} triggerRender={triggerRender} onClear={handleClear} onRemove={foundation.removeTag} onSearch={handleInputChange} />;
    } else {
        inner = (
            <>
                {hasPrefix && renderTriggerPrefix(prefixcls, prefix, insetLabel, prefixId)}
                <div className={`${prefixcls}-selection`}>{multiple ? renderMultipleSelection() : renderSingleSelection()}</div>
                {hasContent(suffix) && renderTriggerSuffix(prefixcls, suffix)}
                {clearable && (
                    <button ref={setClearButton} type="button" className={`${prefixcls}-clear`} aria-label={locale.clear} onClick={handleClear} onKeyDown={stopButtonActivationKeys}>
                        {clearIcon ? clearIcon : <IconClear />}
                    </button>
                )}
                {showArrow ? (
                    <div className={`${prefixcls}-arrow`} x-semi-prop="arrowIcon">
                        {arrowIcon}
                    </div>
                ) : (
                    <div className={`${prefixcls}-arrow-empty`} />
                )}
            </>
        );
    }

    const dropdownAnchorStyle: CSSProperties | undefined = dropdownMatchSelectWidth ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined;

    return (
        <InputGroupContext value={undefined}>
            <Popover
                ref={popoverRef}
                style={dropdownAnchorStyle}
                role="presentation"
                afterClose={foundation.handlePopoverClose}
                autoAdjustOverflow={autoAdjustOverflow}
                content={renderOptions}
                disableArrowKeyDown
                motion={motion}
                position={position}
                spacing={spacing}
                stopPropagation={stopPropagation}
                trigger="custom"
                visible={isOpen}
                onOpen={scrollToSelection}
            >
                <div
                    {...rest}
                    ref={triggerRef}
                    id={selectID}
                    className={selectionCls}
                    style={style}
                    {...triggerAriaProps}
                    tabIndex={disabled || inputIsCombobox ? -1 : 0}
                    onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                            foundation.handleTriggerBlur(e);
                        }
                    }}
                    onClick={(e) => {
                        rest.onClick?.(e);
                        foundation.handleClick(e);
                    }}
                    onFocus={foundation.handleTriggerFocus}
                    onKeyDown={(e) => {
                        rest.onKeyDown?.(e);
                        foundation.handleKeyDown(e);
                    }}
                    onMouseDownCapture={(e) => {
                        rest.onMouseDownCapture?.(e);
                        markPressInside(e);
                    }}
                    onMouseEnter={foundation.handleMouseEnter}
                    onMouseLeave={foundation.handleMouseLeave}
                >
                    {inner}
                </div>
            </Popover>
        </InputGroupContext>
    );
}

export default Object.assign(Select, { Option, OptGroup: OptionGroup });
