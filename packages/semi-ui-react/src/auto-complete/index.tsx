import type React from 'react';
import { type CSSProperties, type ReactNode, useId, useImperativeHandle, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { isEqualWith } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/auto-complete/constants';
import AutoCompleteFoundation, { type AutoCompleteAdapter, type StateOptionItem, type DataItem } from '@fibrae/semi-foundation/auto-complete/foundation';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { isInnerControlKey } from '@fibrae/semi-foundation/utils/a11y';
import { centerInScroller } from '@fibrae/semi-foundation/utils/dom';
import { noop } from '@fibrae/semi-foundation/utils/function';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/auto-complete/auto-complete.scss';
import type { ElementProps } from '../_base/base';
import type { ValidateStatus } from '../_base/base-component';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';
import { hasContent, isSameNode } from '../_utils';
import { useConfigContext } from '../config-provider/context';
import Input from '../input';
import Popover from '../popover';
import Option from '../select/option';
import Spin from '../spin';
import type { Position } from '../tooltip';
import Trigger from '../trigger';

const prefixCls = cssClasses.PREFIX;

/**
 * AutoComplete is an Input with optional suggestions, not a selector. Unlike Select:
 * 1. Expanding does not clear the input value
 * 2. renderSelectedItem returns only a string
 * 3. value is only a string (it is shown in the Input)
 */

export interface BaseDataItem extends DataItem {
    label?: React.ReactNode;
}

export type AutoCompleteItems = BaseDataItem | string | number;

export interface AutoCompleteProps<T extends AutoCompleteItems> extends ElementProps<'div', 'prefix' | 'defaultValue' | 'onChange' | 'onSelect' | 'onKeyDown' | 'children' | 'tabIndex'> {
    autoAdjustOverflow?: boolean;
    autoFocus?: boolean;
    className?: string;
    clearIcon?: ReactNode;
    data?: T[];
    disabled?: boolean;
    defaultOpen?: boolean;
    defaultValue?: string | number;
    defaultActiveFirstOption?: boolean;
    dropdownMatchSelectWidth?: boolean;
    dropdownClassName?: string;
    dropdownStyle?: React.CSSProperties;
    emptyContent?: React.ReactNode;
    insetLabel?: React.ReactNode;
    insetLabelId?: string;
    id?: string;
    loading?: boolean;
    motion?: boolean;
    maxHeight?: string | number;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    onChange?: (value: string | number) => void;
    onSearch?: (inputValue: string) => void;
    /** receives the option's value, or the option object when onSelectWithObject is set */
    onSelect?: (value: string | number | BaseDataItem) => void;
    onClear?: () => void;
    onChangeWithObject?: boolean;
    onSelectWithObject?: boolean;
    onDropdownVisibleChange?: (visible: boolean) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    prefix?: React.ReactNode;
    placeholder?: string;
    position?: Position;
    /** the root div that wraps the input (or the `triggerRender` output) */
    ref?: React.Ref<HTMLDivElement>;
    renderItem?: (option: T) => React.ReactNode;
    /** a string or number item arrives as { value, label }, an object item as itself */
    renderSelectedItem?: (option: T extends string | number ? BaseDataItem : T) => string;
    size?: Size;
    style?: React.CSSProperties;
    suffix?: React.ReactNode;
    showClear?: boolean;
    triggerRender?: (props?: any) => React.ReactNode;
    stopPropagation?: boolean | string;
    value?: string | number;
    validateStatus?: ValidateStatus;
}

interface AutoCompleteState {
    inputValue?: string | number;
    options: StateOptionItem[];
    visible: boolean;
    focusIndex: number;
    selection: Map<any, any>;
}

const defaultProps = {
    stopPropagation: true,
    motion: true,
    data: [],
    showClear: false,
    size: 'default',
    onFocus: noop,
    onSearch: noop,
    onClear: noop,
    onBlur: noop,
    onSelect: noop,
    onChange: noop,
    onSelectWithObject: false,
    onDropdownVisibleChange: noop,
    defaultActiveFirstOption: false,
    dropdownMatchSelectWidth: true,
    loading: false,
    maxHeight: 300,
    validateStatus: 'default',
    autoFocus: false,
    emptyContent: null,
    onKeyDown: noop,
} satisfies Partial<AutoCompleteProps<any>>;

function AutoComplete<T extends AutoCompleteItems>(rawProps: AutoCompleteProps<T>) {
    const props = useDefaultProps('AutoComplete', rawProps, defaultProps);

    const {
        'aria-describedby': ariaDescribedby,
        'aria-errormessage': ariaErrormessage,
        'aria-invalid': ariaInvalid,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-required': ariaRequired,
        autoAdjustOverflow,
        autoFocus,
        className,
        clearIcon,
        data,
        disabled,
        defaultOpen,
        defaultValue,
        defaultActiveFirstOption,
        dropdownMatchSelectWidth,
        dropdownClassName,
        dropdownStyle,
        emptyContent,
        insetLabel,
        insetLabelId,
        id,
        loading,
        motion,
        maxHeight,
        onFocus,
        onBlur,
        onChange,
        onSearch,
        onSelect,
        onClear,
        onChangeWithObject,
        onSelectWithObject,
        onDropdownVisibleChange,
        onKeyDown,
        prefix,
        placeholder,
        position,
        ref,
        renderItem,
        renderSelectedItem,
        size,
        style,
        suffix,
        showClear,
        triggerRender,
        stopPropagation,
        value,
        validateStatus,
        // Form passes the field name; it belongs on the native input
        name,
        ...rest
    } = props as AutoCompleteProps<T> & { name?: string };

    const { direction } = useConfigContext();

    const triggerRef = useRef<HTMLDivElement>(null);
    const optionContainerEl = useRef<HTMLDivElement>(null);
    const optionListId = useId();

    const [foundation, state] = useFoundation<AutoCompleteFoundation<AutoCompleteProps<T>, AutoCompleteState, React.FocusEvent>, AutoCompleteAdapter<AutoCompleteProps<T>, AutoCompleteState, React.FocusEvent>, AutoCompleteProps<T>, AutoCompleteState>(
        AutoCompleteFoundation,
        props,
        () => AutoCompleteFoundation.getInitialState(props),
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateScrollTop: (index) => {
                const destNode = optionContainerEl.current?.querySelector<HTMLDivElement>(`.${prefixCls}-option:nth-child(${index + 1})`);
                if (destNode) {
                    centerInScroller(destNode, destNode.parentNode as HTMLDivElement);
                }
            },
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleListVisible: (isShow) => base.setState({ visible: isShow }),
            updateOptionList: (optionList) => base.setState({ options: optionList }),
            updateSelection: (selection) => base.setState({ selection }),
            notifySearch: (inputValue) => base.getProps().onSearch(inputValue),
            notifyChange: (value) => base.getProps().onChange(value),
            notifySelect: (option) => base.getProps().onSelect(option),
            notifyDropdownVisibleChange: (isVisible) => base.getProps().onDropdownVisibleChange(isVisible),
            notifyClear: () => base.getProps().onClear(),
            notifyFocus: (event) => base.getProps().onFocus(event),
            notifyBlur: (event) => base.getProps().onBlur(event),
            notifyKeyDown: (e) => base.getProps().onKeyDown(e),
        })
    );

    const markPressInside = useClickOutside(
        [triggerRef, optionContainerEl],
        (e) => {
            if (optionContainerEl.current) {
                foundation.handleClickOutside(e);
            }
        },
        state.visible
    );

    const useCustomTrigger = typeof props.triggerRender === 'function';
    const { inputValue, selection, visible, options, focusIndex } = state;
    const insetLabelShown = hasContent(insetLabel) && !hasContent(prefix) && !useCustomTrigger;
    const prefixId = insetLabelId ?? (insetLabelShown ? `${optionListId}-inset-label` : undefined);
    const nameProps = comboboxName(ariaLabelledby, ariaLabel, insetLabelShown ? prefixId : undefined, undefined);

    const innerProps = {
        disabled,
        placeholder,
        autoFocus,
        onChange: (v: string) => foundation.handleSearch(v),
        onClear: () => foundation.handleClear(),
        ...nameProps,
        'aria-invalid': ariaInvalid,
        'aria-errormessage': ariaErrormessage,
        'aria-describedby': ariaDescribedby,
        'aria-required': ariaRequired,
        suffix,
        prefix: hasContent(prefix) ? prefix : insetLabel,
        insetLabelId: prefixId,
        showClear,
        validateStatus,
        size,
        onBlur: (e: React.FocusEvent) => foundation.handleBlur(e),
        onFocus: (e: React.FocusEvent) => foundation.handleFocus(e),
        clearIcon,
    };

    const inputId = id ?? `${optionListId}-input`;
    const shownValue = typeof value !== 'undefined' ? value : inputValue;

    // class props never carried ref; a triggerRender that spreads componentProps must not grab the root's ref
    const componentProps = { ...props };

    useDidUpdate(props.data, (data, prev) => {
        if (!isEqualWith(data, prev, isSameNode)) {
            foundation.handleDataChange(data);
        }
    });

    useDidUpdate(props.value, (value) => foundation.handleValueChange(value));

    useImperativeHandle(props.ref, () => triggerRef.current, []);

    delete componentProps.ref;

    let optionsNode: React.ReactNode;

    const shownOptions = useMemo(() => options.filter((option) => option.show), [options]);

    // the spinner replaces the options while loading, and a stale focusIndex can point past a shorter list
    const activeDescendant = visible && !loading && focusIndex !== -1 && focusIndex < shownOptions.length ? `${optionListId}-option-${focusIndex}` : undefined;

    const input = (
        <div
            {...rest}
            ref={triggerRef}
            // with the default trigger the id belongs on the combobox input, where a label's `for` can find it
            id={useCustomTrigger ? id : undefined}
            className={clsx(!useCustomTrigger && { [prefixCls]: true, [`${prefixCls}-disabled`]: disabled }, className)}
            style={style}
            // the Popover trigger adds tabindex 0 by default; only the input should take focus
            tabIndex={-1}
            onClick={(e) => {
                rest.onClick?.(e);
                foundation.handleInputClick(e);
            }}
            onKeyDown={(e) => {
                // a control inside the trigger (the clear button, a custom trigger's button) keeps its own keys
                if (isInnerControlKey(e)) {
                    onKeyDown(e);
                } else {
                    foundation.handleKeyDown(e);
                }
            }}
            onMouseDownCapture={(e) => {
                rest.onMouseDownCapture?.(e);
                markPressInside(e);
            }}
        >
            {useCustomTrigger ? (
                <Trigger {...innerProps} value={Array.from(selection.values())} componentProps={componentProps} inputValue={shownValue as string} triggerRender={triggerRender} />
            ) : (
                // the host's own values are forwarded; global Input defaults must not add adornments
                <Input
                    {...innerProps}
                    id={inputId}
                    name={name}
                    aria-activedescendant={activeDescendant}
                    aria-autocomplete="list"
                    aria-controls={optionListId}
                    aria-expanded={visible}
                    aria-haspopup="listbox"
                    role="combobox"
                    value={shownValue}
                    addonAfter={null}
                    addonBefore={null}
                    insetLabel={null}
                    prefix={innerProps.prefix ?? null}
                    suffix={suffix ?? null}
                />
            )}
        </div>
    );

    // kept while the options are unchanged, so hover, which only moves focusIndex, lets memo(Option) skip the
    // options whose `focused` stays the same
    const optionHandlers = useMemo(
        () =>
            shownOptions.map((option, optionIndex) => ({
                onMouseEnter: () => foundation.handleOptionMouseEnter(optionIndex),
                onSelect: () => foundation.handleSelect(option, optionIndex),
            })),
        [shownOptions, foundation]
    );

    if (options.length === 0) {
        optionsNode = emptyContent;
    } else {
        optionsNode = shownOptions.map((option, optionIndex) => {
            const renderedLabel = typeof renderItem === 'function' ? renderItem(option._source as T) : undefined;
            return (
                <Option
                    key={option.key ?? option.label + option.value + optionIndex}
                    // item fields named like the row's own props (selected, empty, inputValue) stay out
                    {...getDataAttr(option)}
                    className={option.className}
                    style={option.style}
                    disabled={option.disabled}
                    value={option.value}
                    // the highlighted option is the combobox's active descendant, which APG marks selected
                    current={optionIndex === focusIndex}
                    focused={optionIndex === focusIndex}
                    label={option.label}
                    prefixCls={cssClasses.PREFIX_OPTION}
                    semiOptionId={`${optionListId}-option-${optionIndex}`}
                    showTick={false}
                    {...optionHandlers[optionIndex]}
                >
                    {renderedLabel ?? option.label}
                </Option>
            );
        });
    }

    const optionList = (
        <div
            ref={optionContainerEl}
            id={optionListId}
            className={clsx(`${prefixCls}-option-list`, dropdownClassName)}
            style={{ maxHeight, ...dropdownStyle }}
            // the combobox's name source, never the input itself: accname would read its typed value
            {...nameProps}
            role="listbox"
            onMouseDown={(e) => e.preventDefault()}
            onMouseDownCapture={markPressInside}
        >
            {!loading ? (
                optionsNode
            ) : (
                <div className={`${prefixCls}-loading-wrapper`}>
                    <Spin />
                </div>
            )}
        </div>
    );

    const dropdownAnchorStyle: CSSProperties | undefined = dropdownMatchSelectWidth ? { minWidth: 'var(--semi-tooltip-trigger-width)' } : undefined;

    return (
        <Popover
            style={dropdownAnchorStyle}
            // the listbox inside is the combobox's popup
            role="presentation"
            autoAdjustOverflow={autoAdjustOverflow}
            content={optionList}
            // the arrow keys move the highlight through aria-activedescendant, never the focus into the list
            disableArrowKeyDown
            motion={motion}
            position={position ?? (direction === 'rtl' ? 'bottomRight' : 'bottomLeft')}
            stopPropagation={stopPropagation}
            trigger="custom"
            visible={visible}
        >
            {input}
        </Popover>
    );
}

export default AutoComplete;
