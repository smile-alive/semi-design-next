import React, { Fragment, useDeferredValue, useId, useImperativeHandle, useRef, type ReactNode, type CSSProperties, type MouseEvent } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/cascader/constants';
import CascaderFoundation, { type BasicCascaderInnerData, type BasicCascaderProps, type BasicTriggerRenderProps, type BasicScrollPanelProps, type CascaderAdapter } from '@fibrae/semi-foundation/cascader/foundation';
import { calcMergeType } from '@fibrae/semi-foundation/cascader/util';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { isInnerControlKey, isTextEditor, joinIds, stopButtonActivationKeys } from '@fibrae/semi-foundation/utils/a11y';
import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
import { noop } from '@fibrae/semi-foundation/utils/function';
import '@fibrae/semi-foundation/cascader/cascader.scss';
import { IconClear, IconChevronDown } from '@fibrae/semi-icons-react';
import type { Bivariant, ByMultiple, ElementProps } from '../_base/base';
import type { ValidateStatus } from '../_base/base-component';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFocusHandover from '../_base/use-focus-handover';
import useFoundation from '../_base/use-foundation';
import type { VirtualListHandle } from '../_base/virtual-list';
import { hasContent, renderTriggerPrefix, renderTriggerSuffix } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import Input, { type InputHandle } from '../input/index';
import useLocale from '../locale/use-locale';
import Popover, { type PopoverProps } from '../popover/index';
import Tag from '../tag';
import TagInput, { type TagInputHandle } from '../tag-input';
import type { Position } from '../tooltip/index';
import Trigger from '../trigger';
import Item, { type CascaderData, type Entities, type Entity, type Data, type FilterRenderProps } from './item';

export type { CascaderType, ShowNextType, KeyMapProps } from '@fibrae/semi-foundation/cascader/foundation';
export type { CascaderData, Entity, Data, CascaderItemProps, FilterRenderProps } from './item';

export interface ScrollPanelProps extends BasicScrollPanelProps {
    activeNode: CascaderData;
}

export interface TriggerRenderProps<Multiple extends boolean | undefined = undefined> extends Omit<BasicTriggerRenderProps, 'componentProps' | 'value'> {
    componentProps: CascaderProps<boolean>;
    /** The position in treeData (such as `0-0-1`) of the selected node, or in multiple mode of each checked node */
    value: ByMultiple<Multiple, string | undefined, Set<string>>;
    inputValue: ReactNode;
    onClear: (e: React.MouseEvent) => void;
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

/**
 * `Multiple` follows the `multiple` prop, so that `value`, `onChange`, `displayRender` and `triggerRender` take the
 * shapes of the mode in use
 */
export interface CascaderProps<Multiple extends boolean | undefined = undefined>
    extends Omit<BasicCascaderProps, 'multiple' | 'value' | 'defaultValue' | 'onChange' | 'onSelect' | 'displayRender' | 'triggerRender'>, ElementProps<'div', 'prefix' | 'defaultValue' | 'onChange' | 'onSelect' | 'onLoad' | 'onBlur' | 'onFocus'> {
    multiple?: Multiple;
    arrowIcon?: ReactNode;
    clearIcon?: ReactNode;
    expandIcon?: ReactNode;
    defaultValue?: ModeValue<Multiple>;
    dropdownStyle?: CSSProperties;
    emptyContent?: ReactNode;
    motion?: boolean;
    filterTreeNode?: ((inputValue: string, treeNodeString: string, data?: CascaderData) => boolean) | boolean;
    /** `first` and `second` are the two result paths, from the root to the matched node */
    filterSorter?: (first: CascaderData[], second: CascaderData[], inputValue: string) => number;
    filterRender?: (props: FilterRenderProps) => ReactNode;
    treeData?: Array<CascaderData>;
    restTagsPopoverProps?: PopoverProps;
    children?: React.ReactNode;
    value?: ModeValue<Multiple>;
    prefix?: ReactNode;
    suffix?: ReactNode;
    id?: string;
    insetLabel?: ReactNode;
    insetLabelId?: string;
    style?: CSSProperties;
    bottomSlot?: ReactNode;
    topSlot?: ReactNode;
    triggerRender?: (props: TriggerRenderProps<Multiple>) => ReactNode;
    onListScroll?: (e: React.UIEvent<HTMLUListElement>, panel: ScrollPanelProps) => void;
    loadData?: (selectOptions: CascaderData[]) => Promise<void>;
    onLoad?: (newLoadedKeys: Set<string>, data: CascaderData) => void;
    /** Receives the selected path, or in multiple mode the checked paths; their nodes with `onChangeWithObject` */
    onChange?: (value: ByMultiple<Multiple, Array<SimpleValueType>, Array<Array<SimpleValueType>>>) => void;
    /** In multiple mode a single checked node gives its value, more give an array */
    onSelect?: (value: ByMultiple<Multiple, string | number, string | number | Array<string | number>>) => void;
    onExceed?: (checkedItem: Entity[]) => void;
    /** Renders the selected path's labels, or in multiple mode one tag per checked node */
    displayRender?: ByMultiple<Multiple, (selected: Array<ReactNode>) => ReactNode, (selected: Entity, idx: number) => ReactNode>;
    onBlur?: (e?: MouseEvent | React.KeyboardEvent | globalThis.MouseEvent) => void;
    onFocus?: (e: MouseEvent | React.KeyboardEvent) => void;
    validateStatus?: ValidateStatus;
    position?: Position;
    searchPosition?: typeof strings.SEARCH_POSITION_TRIGGER | typeof strings.SEARCH_POSITION_CUSTOM;
    /** the methods in `CascaderHandle` */
    ref?: React.Ref<CascaderHandle>;
}

// The body serves both modes, so its mode-dependent callbacks take every shape; see `Bivariant`
interface CascaderBodyProps extends Omit<CascaderProps<boolean>, 'onChange' | 'onSelect' | 'displayRender' | 'triggerRender'> {
    onChange?: Bivariant<[value: Value]>;
    onSelect?: Bivariant<[value: string | number | Array<string | number>]>;
    displayRender?: Bivariant<[selected: Array<ReactNode> | Entity, idx?: number], ReactNode>;
    // spelled out rather than TriggerRenderProps<boolean>: TS relates two instantiations of one generic interface by
    // the measured variance of `Multiple`, which a conditional type leaves invariant
    triggerRender?: Bivariant<
        [
            props: Omit<TriggerRenderProps, 'componentProps' | 'value'> & {
                componentProps: CascaderBodyProps;
                value?: string | Set<string>;
            },
        ],
        ReactNode
    >;
}

export interface CascaderState extends BasicCascaderInnerData {
    keyEntities: Entities;
}

const prefixcls = cssClasses.PREFIX;

const defaultProps = {
    borderless: false,
    leafOnly: false,
    arrowIcon: <IconChevronDown />,
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
    restTagsPopoverProps: {},
    separator: ' / ',
    size: 'default',
    treeNodeFilterProp: 'label',
    displayProp: 'label',
    treeData: [],
    showNext: strings.SHOW_NEXT_BY_CLICK,
    onExceed: noop,
    onClear: noop,
    onDropdownVisibleChange: noop,
    onListScroll: noop,
    enableLeafClick: false,
    clickToSelect: false,
    searchPosition: strings.SEARCH_POSITION_TRIGGER,
    checkRelation: strings.RELATED,
    remote: false,
} satisfies Partial<CascaderBodyProps>;

export default function Cascader<Multiple extends boolean | undefined = undefined>(rawProps: CascaderProps<Multiple>) {
    const bodyProps: CascaderBodyProps = rawProps;
    const props = useDefaultProps('Cascader', bodyProps, defaultProps);

    const {
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        'aria-label': ariaLabel,
        arrowIcon,
        clearIcon,
        expandIcon,
        defaultValue,
        dropdownStyle,
        emptyContent,
        motion,
        filterTreeNode,
        filterSorter,
        filterRender,
        treeData,
        restTagsPopoverProps,
        children,
        value,
        prefix,
        suffix,
        id,
        insetLabel,
        insetLabelId,
        style,
        bottomSlot,
        topSlot,
        triggerRender,
        onListScroll,
        loadData,
        onLoad,
        onChange,
        onExceed,
        displayRender,
        onBlur,
        onFocus,
        validateStatus,
        position,
        searchPosition,
        ref,
        borderless,
        separator,
        changeOnSelect,
        multiple,
        autoMergeValue,
        disabled,
        dropdownClassName,
        filterLeafOnly,
        placeholder,
        searchPlaceholder,
        size,
        className,
        treeNodeFilterProp,
        displayProp,
        maxTagCount,
        max,
        showRestTagsPopover,
        stopPropagation,
        showClear,
        autoAdjustOverflow,
        defaultOpen,
        onChangeWithObject,
        showNext,
        disableStrictly,
        leafOnly,
        enableLeafClick,
        clickToSelect,
        preventScroll,
        virtualizeInSearch,
        checkRelation,
        remote,
        keyMaps,
        onClear,
        onDropdownVisibleChange,
        onSearch,
        onSelect,
        ...rest
    } = props;

    const { direction } = useConfigContext();
    const { locale } = useLocale('Cascader');

    const popupId = useId();
    const selectionTextId = useId();
    const triggerRef = useRef<HTMLDivElement>(null);
    const optionContainerEl = useRef<HTMLDivElement>(null);
    const virtualListRef = useRef<VirtualListHandle>(null);
    const inputRef = useRef<InputHandle>(null);
    const tagInputRef = useRef<TagInputHandle>(null);

    const inputPlaceHolder = searchPlaceholder || placeholder;
    const mergeType = calcMergeType(autoMergeValue, leafOnly);
    const triggerSearch = Boolean(filterTreeNode) && searchPosition === strings.SEARCH_POSITION_TRIGGER;

    // A rendered inset label names the combobox and the tree, so it needs an id even when the caller gives none
    const hasPrefix = hasContent(prefix) || hasContent(insetLabel);
    const insetLabelShown = hasContent(insetLabel) && !hasContent(prefix) && typeof triggerRender !== 'function';
    const prefixId = insetLabelId ?? (insetLabelShown ? `${popupId}-inset-label` : undefined);
    const nameProps = comboboxName(ariaLabelledby, ariaLabel, insetLabelShown ? prefixId : undefined, locale.label);

    // ids are IDREFs for aria-activedescendant, so a key with spaces is encoded
    const optionId = (key: string) => `${popupId}-option-${encodeURIComponent(key)}`;

    const [foundation, state] = useFoundation<CascaderFoundation<MouseEvent | React.KeyboardEvent, React.UIEvent<HTMLUListElement>>, CascaderAdapter<MouseEvent | React.KeyboardEvent, React.UIEvent<HTMLUListElement>>, BasicCascaderProps, BasicCascaderInnerData>(
        CascaderFoundation,
        props,
        () => CascaderFoundation.getInitialState(props),
        (base) => {
            return {
                focusCombobox: () => {
                    const { preventScroll } = base.getProps();
                    if (inputRef.current) {
                        inputRef.current.focus({ preventScroll });
                    } else if (tagInputRef.current) {
                        tagInputRef.current.focus();
                    } else {
                        triggerRef.current?.focus({ preventScroll });
                    }
                },
                blurCombobox: () => {
                    inputRef.current?.blur();
                    tagInputRef.current?.blur();
                    triggerRef.current?.blur();
                },
                updateStates: (states) => base.setState(states as BasicCascaderInnerData),
                notifyChange: (value) => base.getProps().onChange?.(value),
                notifySelect: (selected) => base.getProps().onSelect?.(selected),
                notifyOnSearch: (input) => base.getProps().onSearch?.(input),
                notifyFocus: (e) => base.getProps().onFocus?.(e),
                notifyBlur: (e) => base.getProps().onBlur?.(e),
                notifyDropdownVisibleChange: (visible) => base.getProps().onDropdownVisibleChange(visible),
                notifyLoadData: (selectedOpt, callback, onReject) => {
                    const { loadData } = base.getProps();
                    if (loadData) {
                        const loading = loadData(selectedOpt);
                        loading.then(undefined, onReject);
                        // the rejection is left unhandled on this chain on purpose, so it still reaches the caller
                        void loading.then(() => {
                            // loadData updates treeData, which can change selectedKeys and activeKeys. loadingKeys
                            // and loadedKeys (set in callback) must land after that treeData update, otherwise
                            // activeKeys shifts during async loading; setTimeout orders them under batching.
                            setTimeout(callback);
                        });
                    }
                },
                notifyOnLoad: (newLoadedKeys, data) => base.getProps().onLoad?.(newLoadedKeys, data),
                notifyListScroll: (e, panel) => base.getProps().onListScroll(e, panel),
                notifyOnExceed: (data) => base.getProps().onExceed(data),
                notifyClear: () => base.getProps().onClear(),
                toggleInputShow: (showInput, cb) => {
                    const focusInTrigger = triggerRef.current?.contains(FocusTrapHandle.getActiveElement(triggerRef.current));
                    base.setState({ showInput }, () => {
                        // unmounting the focused search input would drop focus to the body; the trigger is the
                        // combobox again, so it takes focus back
                        if (!showInput && focusInTrigger) {
                            triggerRef.current?.focus({ preventScroll: true });
                        }
                        cb();
                    });
                },
                scrollToOption: (key, index) => {
                    if (virtualListRef.current) {
                        virtualListRef.current.scrollToItem(index);
                    } else {
                        optionContainerEl.current?.querySelector(`#${CSS.escape(optionId(key))}`)?.scrollIntoView({ block: 'nearest' });
                    }
                },
            };
        }
    );

    const markPressInside = useClickOutside(
        [triggerRef, optionContainerEl],
        (e) => {
            if (optionContainerEl.current) {
                foundation.handleClickOutside(e);
            }
        },
        state.isOpen
    );

    const deriveView = (s: BasicCascaderInnerData) => (multiple ? { ...s, ...CascaderFoundation.deriveMultipleState(props, s) } : s);

    const view = deriveView(state);

    // Only a keyword change is deferred; clicks, expansion and arrow keys must paint with the live state
    const deferredState = useDeferredValue(state);
    const listView = deferredState.inputValue === state.inputValue ? view : deriveView(deferredState);
    const keyEntities = view.keyEntities;
    const { inputValue, selectedKeys, checkedKeys, resolvedCheckedKeys, disabledKeys, isOpen, showInput } = view;
    const { inputValue: listInputValue, isSearching, activeKeys, selectedKeys: listSelectedKeys, checkedKeys: listCheckedKeys, halfCheckedKeys, loadedKeys, loadingKeys } = listView;
    const renderData = CascaderFoundation.getRenderData(props, listView) as Array<Entity | Data>;
    const isEmpty = !renderData || !renderData.length;
    const realKeys = mergeType === strings.NONE_MERGE_TYPE || checkRelation === strings.UN_RELATED ? checkedKeys : resolvedCheckedKeys;

    // The keyboard row is the live one, which Enter acts on; while the list lags behind, it shows only when that list
    // renders it, so aria-activedescendant never points at an option Enter would not choose or that is not rendered
    const keyboardKey = isOpen ? CascaderFoundation.getKeyboardKey({ ...listView, keyboardKey: view.keyboardKey }) : null;
    const activeDescendant = keyboardKey === null ? undefined : optionId(keyboardKey);

    // ARIA 1.2: the search input is the combobox while mounted (only when searching), else the trigger is a
    // select-only combobox exposing the selected path as its value. A triggerRender replaces the input
    const inputIsCombobox = triggerSearch && typeof triggerRender !== 'function' && (multiple || showInput);

    const comboboxProps = {
        role: 'combobox',
        'aria-activedescendant': activeDescendant,
        'aria-controls': popupId,
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-expanded': isOpen,
        'aria-haspopup': filterTreeNode && isSearching ? 'listbox' : 'tree',
        'aria-invalid': ariaInvalid,
        ...nameProps,
        'aria-required': ariaRequired,
    } as const;

    const triggerAriaProps = inputIsCombobox ? {} : { ...comboboxProps, 'aria-disabled': disabled };

    // multiple mode keeps no selectedKeys beyond the one getInitialState writes; its value also holds controlled paths without tags
    const clearable = showClear && (inputValue || (multiple ? CascaderFoundation.hasMultipleValue(props, view) : selectedKeys.size)) && !disabled;

    const handleInputChange = (input: string) => foundation.handleInputChange(input);

    const handleOptionKeyDown = (e: React.KeyboardEvent) =>
        foundation.handleOptionKeyDown(e, {
            editing: isTextEditor(e.target),
            rtl: direction === 'rtl',
        });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        handleOptionKeyDown(e);
        foundation.handleKeyDown(e);
    };

    const handleClear = (e: MouseEvent) => {
        e?.stopPropagation();
        foundation.handleClear();
    };

    const renderTagItem = (nodeKey: string, idx: number) => {
        if (keyEntities[nodeKey]) {
            const isDisabled = disabled || keyEntities[nodeKey].data.disabled || (disableStrictly && disabledKeys.has(nodeKey));
            const tagCls = clsx(`${prefixcls}-selection-tag`, {
                [`${prefixcls}-selection-tag-disabled`]: isDisabled,
            });
            if (typeof displayRender === 'function') {
                return displayRender(keyEntities[nodeKey], idx);
            }
            return (
                <Tag
                    key={`tag-${nodeKey}-${idx}`}
                    className={tagCls}
                    closable={!isDisabled}
                    color="white"
                    size={size === 'default' ? 'large' : size}
                    tagKey={nodeKey}
                    onClose={(_tagChildren, e, tagKey) => {
                        // the value has not changed yet, so the close button must not close the tag itself
                        e.preventDefault();
                        foundation.handleTagRemoveByKey(tagKey as string);
                    }}
                >
                    {keyEntities[nodeKey].data[displayProp]}
                </Tag>
            );
        }
        return null;
    };

    const renderDisplayText = (): ReactNode => {
        if (!selectedKeys.size) {
            return '';
        }
        const displayPath = CascaderFoundation.getItemPropPath([...selectedKeys][0], displayProp, keyEntities);
        if (typeof displayRender === 'function') {
            return displayRender(displayPath);
        }
        return displayPath.map((path: ReactNode, index: number) => (
            <Fragment key={`${path}-${index}`}>
                {index < displayPath.length - 1 ? (
                    <>
                        {path}
                        {separator}
                    </>
                ) : (
                    path
                )}
            </Fragment>
        ));
    };

    const renderTagInput = () => (
        <TagInput
            ref={tagInputRef}
            className={clsx(`${prefixcls}-tagInput-wrapper`)}
            {...comboboxProps}
            aria-autocomplete="list"
            disabled={disabled}
            placeholder={inputPlaceHolder}
            value={[...realKeys]}
            expandRestTagsOnClick={false}
            inputValue={inputValue}
            maxTagCount={maxTagCount}
            preventScroll={preventScroll}
            restTagsPopoverProps={restTagsPopoverProps}
            showRestTagsPopover={showRestTagsPopover}
            size={size}
            renderTagItem={renderTagItem}
            onInputChange={handleInputChange}
            onRemove={(v: string) => foundation.handleTagRemoveByKey(v)}
        />
    );

    const renderInput = () => {
        const wrappercls = clsx({
            [`${prefixcls}-search-wrapper`]: true,
            [`${prefixcls}-search-wrapper-${size}`]: size !== 'default',
        });
        const displayText = renderDisplayText();
        const spanCls = clsx({
            [`${prefixcls}-selection-placeholder`]: !displayText,
            [`${prefixcls}-selection-text-hide`]: showInput && inputValue,
            [`${prefixcls}-selection-text-inactive`]: showInput && !inputValue,
        });
        return (
            <div className={wrappercls}>
                <span id={selectionTextId} className={spanCls}>
                    {displayText ? displayText : inputPlaceHolder}
                </span>
                {/* the trigger draws its own clear button and adornments: global Input defaults must not add them */}
                {showInput && (
                    <Input
                        ref={inputRef}
                        className={clsx(`${prefixcls}-input`)}
                        addonAfter={null}
                        addonBefore={null}
                        insetLabel={null}
                        showClear={false}
                        prefix={null}
                        suffix={null}
                        {...comboboxProps}
                        aria-autocomplete="list"
                        // the selected text sits beside the input, which is empty until the user types, so the combobox has no
                        // value of its own; the text is exposed as the description
                        aria-describedby={joinIds(ariaDescribedby, inputValue ? undefined : selectionTextId)}
                        disabled={disabled}
                        value={inputValue}
                        size={size}
                        onChange={handleInputChange}
                    />
                )}
            </div>
        );
    };

    const renderContent = () => {
        const searchable = Boolean(filterTreeNode) && isSearching;
        const popoverCls = clsx(dropdownClassName, `${prefixcls}-popover`);
        return (
            <div
                ref={optionContainerEl}
                className={popoverCls}
                style={dropdownStyle}
                onKeyDown={handleKeyDown}
                // a press would focus the popup, which is hidden on close and drops the focus to body; the focus stays
                // on the trigger. A text field in a slot still takes the focus.
                onMouseDown={(e) => {
                    if (!isTextEditor(e.target)) {
                        e.preventDefault();
                    }
                }}
                onMouseDownCapture={markPressInside}
            >
                {topSlot}
                <Item
                    id={popupId}
                    multiple={multiple}
                    activeKeys={activeKeys}
                    checkedKeys={listCheckedKeys}
                    data={renderData}
                    emptyContent={emptyContent}
                    expandIcon={expandIcon}
                    halfCheckedKeys={halfCheckedKeys}
                    keyboardKey={keyboardKey}
                    keyword={listInputValue}
                    labelProps={nameProps}
                    loadData={loadData}
                    loadedKeys={loadedKeys}
                    loadingKeys={loadingKeys}
                    optionId={optionId}
                    searchable={searchable}
                    selectedKeys={listSelectedKeys}
                    separator={separator}
                    showNext={showNext}
                    virtualize={virtualizeInSearch}
                    virtualListRef={virtualListRef}
                    filterRender={filterRender}
                    onItemCheckboxClick={(item) => foundation.onItemCheckboxClick(item)}
                    onItemClick={(e, item) => foundation.handleItemClick(e, item)}
                    onItemHover={(e, item) => foundation.handleItemHover(e, item)}
                    onListScroll={(e, ind) => foundation.handleListScroll(e, ind)}
                />
                {bottomSlot}
            </div>
        );
    };

    const renderPlusN = (hiddenTag: Array<ReactNode>) => {
        const plusNCls = clsx(`${prefixcls}-selection-n`, {
            [`${prefixcls}-selection-n-disabled`]: disabled,
        });
        const renderPlusNChildren = <span className={plusNCls}>+{hiddenTag.length}</span>;
        return showRestTagsPopover ? (
            <Popover autoAdjustOverflow content={hiddenTag} position="top" showArrow trigger="hover" {...restTagsPopoverProps}>
                {renderPlusNChildren}
            </Popover>
        ) : (
            renderPlusNChildren
        );
    };

    const renderMultipleTags = () => {
        const displayTag: Array<ReactNode> = [];
        const hiddenTag: Array<ReactNode> = [];
        [...realKeys].forEach((checkedKey, idx) => {
            const notExceedMaxTagCount = typeof maxTagCount !== 'number' || maxTagCount >= idx + 1;
            const item = renderTagItem(checkedKey, idx);
            if (notExceedMaxTagCount) {
                displayTag.push(item);
            } else {
                hiddenTag.push(item);
            }
        });
        return (
            <>
                {displayTag}
                {hiddenTag.length > 0 && renderPlusN(hiddenTag)}
            </>
        );
    };

    const renderSelectContent = () => {
        if (triggerSearch) {
            return multiple ? renderTagInput() : renderInput();
        }
        if (multiple) {
            if (checkedKeys.size === 0) {
                return <span className={`${prefixcls}-selection-placeholder`}>{placeholder}</span>;
            }
            return renderMultipleTags();
        }
        const displayText = renderDisplayText();
        const spanCls = clsx({
            [`${prefixcls}-selection-placeholder`]: !displayText,
        });
        return <span className={spanCls}>{displayText ? displayText : placeholder}</span>;
    };

    const renderCustomTrigger = () => {
        let realValue: string | Set<string>;
        if (multiple) {
            // the trigger gets positions; mergeType decides which checked set they come from, whatever checkRelation is
            const keys = mergeType === strings.NONE_MERGE_TYPE ? checkedKeys : resolvedCheckedKeys;
            realValue = new Set();
            keys.forEach((key) => {
                (realValue as Set<string>).add(keyEntities[key]?.pos);
            });
        } else {
            realValue = keyEntities[[...selectedKeys][0]]?.pos;
        }
        // class props never carried ref; a triggerRender that spreads componentProps must not grab the handle
        const componentProps = { ...props };
        delete componentProps.ref;
        return <Trigger disabled={disabled} placeholder={inputPlaceHolder} value={realValue} componentProps={componentProps} inputValue={inputValue} triggerRender={triggerRender} onClear={handleClear} onRemove={(pos: string) => foundation.handleTagRemoveInTrigger(pos)} onSearch={handleInputChange} />;
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

    useDidUpdate(props, (current, previous) => {
        const optionsChanged = !isEqual(previous.treeData, current.treeData) || !isEqual(previous.keyMaps, current.keyMaps);
        // by content: an inline value is a new array on every parent render, and each change resets the search
        foundation.handleInputsChange({ optionsChanged, valueChanged: !isEqual(previous.value, current.value) }, current.value);
    });

    // the owner may clear the value while the clear button holds focus; the combobox takes it back
    const clearHandover = useFocusHandover<HTMLButtonElement>(() => (inputIsCombobox ? triggerRef.current?.querySelector('input') : triggerRef.current));

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
                        foundation.focus();
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

    const renderSelection = () => {
        const useCustomTrigger = typeof triggerRender === 'function';
        const classNames = useCustomTrigger
            ? clsx(className)
            : clsx(prefixcls, className, {
                  [`${prefixcls}-borderless`]: borderless,
                  [`${prefixcls}-focus`]: isOpen,
                  [`${prefixcls}-disabled`]: disabled,
                  [`${prefixcls}-single`]: true,
                  [`${prefixcls}-filterable`]: Boolean(filterTreeNode),
                  [`${prefixcls}-error`]: validateStatus === 'error',
                  [`${prefixcls}-warning`]: validateStatus === 'warning',
                  [`${prefixcls}-small`]: size === 'small',
                  [`${prefixcls}-large`]: size === 'large',
                  [`${prefixcls}-with-prefix`]: hasPrefix,
                  [`${prefixcls}-with-suffix`]: hasContent(suffix),
              });
        const sectionCls = clsx(`${prefixcls}-selection`, {
            [`${prefixcls}-selection-multiple`]: multiple && checkedKeys.size > 0,
        });
        const inner = useCustomTrigger
            ? renderCustomTrigger()
            : [
                  <Fragment key="prefix">{hasPrefix && renderTriggerPrefix(prefixcls, prefix, insetLabel, prefixId)}</Fragment>,
                  <Fragment key="selection">
                      <div className={sectionCls}>{renderSelectContent()}</div>
                  </Fragment>,
                  <Fragment key="suffix">{hasContent(suffix) && renderTriggerSuffix(prefixcls, suffix)}</Fragment>,
                  <Fragment key="clearbtn">{renderClearBtn()}</Fragment>,
                  <Fragment key="arrow">{renderArrow()}</Fragment>,
              ];
        return (
            <div
                {...rest}
                ref={triggerRef}
                id={id}
                className={classNames}
                style={style}
                {...triggerAriaProps}
                tabIndex={disabled || inputIsCombobox ? -1 : 0}
                onClick={(e) => {
                    rest.onClick?.(e);
                    foundation.handleClick(e);
                }}
                onKeyDown={(e) => {
                    rest.onKeyDown?.(e);
                    if (!isInnerControlKey(e)) {
                        foundation.handleSelectionKeyDown(e);
                    }
                    foundation.handleKeyDown(e);
                }}
                // ahead of the search input: an Enter that picks the current option must not reach TagInput, which
                // would also take the typed text as a new tag
                onKeyDownCapture={(e) => {
                    rest.onKeyDownCapture?.(e);
                    if (!isInnerControlKey(e) && handleOptionKeyDown(e)) {
                        // stopping it here also skips the bubble handler above, so the owner hears the key now
                        rest.onKeyDown?.(e);
                        e.stopPropagation();
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

    useImperativeHandle(
        props.ref,
        () => ({
            open: () => foundation.open(),
            close: () => foundation.close(undefined),
            focus: () => foundation.focus(),
            blur: () => foundation.blur(),
            search: (value: string) => foundation.handleInputChange(value),
        }),
        [foundation]
    );

    return (
        <Popover
            // An empty list has no columns to size it, so it matches the trigger's live width
            style={isEmpty ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined}
            role="presentation"
            afterClose={() => foundation.endSearching()}
            autoAdjustOverflow={autoAdjustOverflow}
            content={renderContent()}
            motion={motion}
            position={position ?? (direction === 'rtl' ? 'bottomRight' : 'bottomLeft')}
            stopPropagation={stopPropagation}
            trigger="custom"
            visible={isOpen}
            onOpen={() => foundation.handlePopoverOpen()}
        >
            {renderSelection()}
        </Popover>
    );
}
