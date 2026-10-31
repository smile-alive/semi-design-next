import { type JSX, type Ref, For, Show, children, createMemo, createUniqueId, mergeProps, onCleanup, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/auto-complete/constants';
import AutoCompleteFoundation, { type AutoCompleteAdapter, type AutoCompleteBaseProps, type AutoCompleteBaseState, type DataItem } from '@fibrae/semi-foundation/auto-complete/foundation';
import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
import { isInnerControlKey } from '@fibrae/semi-foundation/utils/a11y';
import { centerInScroller, toCssLength } from '@fibrae/semi-foundation/utils/dom';
import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
import type { Size } from '@fibrae/semi-foundation/utils/type';
import '@fibrae/semi-foundation/auto-complete/auto-complete.scss';
import callHandler from '../_base/call-handler';
import { isNativeInputKey, omitFormInjected, splitControlAttrs } from '../_base/control-attrs';
import type { ElementProps } from '../_base/element-props';
import forwardFocus from '../_base/forward-focus';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import useClickOutside from '../_base/use-click-outside';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';
import useConfig from '../config-provider/use-config';
import type { InputGroupContextValue } from '../input/context';
import InputGroupBoundary from '../input/group-boundary';
import Input, { type ValidateStatus } from '../input/input';
import Popover from '../popover';
import { OptionView } from '../select/option';
import Spin from '../spin';
import type { Position, TooltipProps } from '../tooltip';
import { useSpecialTrigger } from '../tooltip/context';

const prefixCls = cssClasses.PREFIX;

/**
 * AutoComplete is an Input with optional suggestions, not a selector. Unlike Select:
 * 1. Expanding does not clear the input value
 * 2. renderSelectedItem returns only a string
 * 3. value is only a string (it is shown in the Input)
 */

/** An object item of `data`; fields other than these are kept and passed back in callbacks */
export interface BaseDataItem extends DataItem {
    /** Text of the row; markup goes through `renderItem` */
    label?: string | number;
    disabled?: boolean;
    class?: string;
    style?: JSX.CSSProperties | string;
}

export type AutoCompleteItems = BaseDataItem | string | number;

type ComboboxAria = Pick<JSX.AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-errormessage' | 'aria-invalid' | 'aria-required'>;

/** What `triggerRender` receives: wire `onChange`, `onFocus` and `onBlur` to the custom trigger's text field */
export interface AutoCompleteTriggerRenderProps<T extends AutoCompleteItems = AutoCompleteItems> extends ComboboxAria {
    /** The selected item, if any */
    value: BaseDataItem[];
    inputValue?: string | number;
    disabled?: boolean;
    placeholder?: string;
    autofocus?: boolean;
    size: Size;
    validateStatus?: ValidateStatus;
    showClear?: boolean;
    insetLabelId?: string;
    /** `prefix`, or `insetLabel` without a prefix */
    prefix: JSX.Element;
    suffix: JSX.Element;
    clearIcon: JSX.Element;
    /** Updates the input text: reports `onSearch` and `onChange` and opens the list */
    onChange: (value: string) => void;
    onClear: () => void;
    onFocus: (e: FocusEvent) => void;
    onBlur: (e: FocusEvent) => void;
    componentProps: Omit<AutoCompleteProps<T>, 'ref'>;
}

export interface AutoCompleteProps<T extends AutoCompleteItems = AutoCompleteItems> extends ElementProps<'div', 'prefix' | 'placeholder' | 'onChange' | 'onSelect' | 'onFocus' | 'onBlur' | 'children' | 'tabIndex' | 'tabindex' | 'ref'> {
    autoAdjustOverflow?: boolean;
    autofocus?: boolean;
    clearIcon?: JSX.Element;
    data?: T[];
    disabled?: boolean;
    defaultOpen?: boolean;
    defaultValue?: string | number;
    defaultActiveFirstOption?: boolean;
    dropdownMatchSelectWidth?: boolean;
    dropdownClassName?: string;
    dropdownStyle?: JSX.CSSProperties | string;
    emptyContent?: JSX.Element;
    insetLabel?: JSX.Element;
    insetLabelId?: string;
    /** Lands on the combobox input, where a label's `for` finds it; on the root with `triggerRender` */
    id?: string;
    loading?: boolean;
    motion?: boolean;
    maxHeight?: string | number;
    /** Fires as focus enters the input wrapper; moving to the clear button does not fire it */
    onFocus?: (e: FocusEvent) => void;
    /** Fires as focus leaves the input wrapper */
    onBlur?: (e: FocusEvent) => void;
    onChange?: (value: string | number) => void;
    onSearch?: (inputValue: string) => void;
    /** Receives the option's value, or the option object when onSelectWithObject is set */
    onSelect?: (value: string | number | BaseDataItem) => void;
    onClear?: () => void;
    onChangeWithObject?: boolean;
    onSelectWithObject?: boolean;
    onDropdownVisibleChange?: (visible: boolean) => void;
    prefix?: JSX.Element;
    placeholder?: string;
    position?: Position;
    /** The root div that wraps the input (or the `triggerRender` output); its `focus()` and `blur()` act on the input */
    ref?: Ref<HTMLDivElement>;
    renderItem?: (option: T) => JSX.Element;
    /** A string or number item arrives as { value, label }, an object item as itself */
    renderSelectedItem?: (option: T extends string | number ? BaseDataItem : T) => string;
    size?: Size;
    suffix?: JSX.Element;
    showClear?: boolean;
    triggerRender?: (props: AutoCompleteTriggerRenderProps<T>) => JSX.Element;
    stopPropagation?: TooltipProps['stopPropagation'];
    value?: string | number;
    validateStatus?: ValidateStatus;
}

interface AutoCompleteState extends AutoCompleteBaseState {
    selection: Map<unknown, BaseDataItem>;
}

type Foundation = AutoCompleteFoundation<AutoCompleteBaseProps, AutoCompleteState, FocusEvent>;
type Adapter = AutoCompleteAdapter<AutoCompleteBaseProps, AutoCompleteState, FocusEvent>;

const defaultProps = {
    stopPropagation: true,
    motion: true,
    data: [],
    showClear: false,
    size: 'default',
    onSelectWithObject: false,
    defaultActiveFirstOption: false,
    dropdownMatchSelectWidth: true,
    loading: false,
    maxHeight: 300,
    validateStatus: 'default',
    autofocus: false,
    emptyContent: null,
} satisfies Partial<AutoCompleteProps>;

export default function AutoComplete<T extends AutoCompleteItems = AutoCompleteItems>(props: AutoCompleteProps<T>) {
    return <InputGroupBoundary>{(inGroup) => <AutoCompleteControl {...props} inGroup={inGroup} />}</InputGroupBoundary>;
}

function AutoCompleteControl<T extends AutoCompleteItems = AutoCompleteItems>(all: AutoCompleteProps<T> & { inGroup?: InputGroupContextValue }) {
    const [own, rawProps] = splitProps(all, ['inGroup']);
    const defaulted = useDefaultProps('AutoComplete', rawProps, defaultProps);

    const config = useConfig();

    const listboxId = createUniqueId();
    let root: HTMLDivElement | undefined;
    let input: HTMLInputElement | undefined;
    let listbox: HTMLDivElement | undefined;

    // fixed for the instance's lifetime: the layer and the context value are
    const inGroup = untrack(() => own.inGroup);

    // as Input: own value, then the group's, then the global default
    const props = mergeProps(defaulted, {
        get size() {
            return rawProps.size ?? inGroup?.view().size ?? defaulted.size;
        },
        get disabled() {
            return rawProps.disabled ?? inGroup?.view().disabled ?? defaulted.disabled;
        },
    });

    // validateStatus, insetLabel and insetLabelId are read from props: the Form-injected keys never reach the split
    const [local, rest] = splitProps(omitFormInjected(props), [
        'autoAdjustOverflow',
        'autofocus',
        'class',
        'clearIcon',
        'data',
        'defaultActiveFirstOption',
        'defaultOpen',
        'defaultValue',
        'disabled',
        'dropdownClassName',
        'dropdownMatchSelectWidth',
        'dropdownStyle',
        'emptyContent',
        'id',
        'loading',
        'maxHeight',
        'motion',
        'onBlur',
        'onChange',
        'onChangeWithObject',
        'onClear',
        'onClick',
        'onDropdownVisibleChange',
        'onFocus',
        'onKeyDown',
        'onMouseDown',
        'onSearch',
        'onSelect',
        'onSelectWithObject',
        'placeholder',
        'position',
        'prefix',
        'ref',
        'renderItem',
        'renderSelectedItem',
        'showClear',
        'size',
        'stopPropagation',
        'style',
        'suffix',
        'triggerRender',
        'value',
    ]);

    // aria-*, name and an outer Tooltip's tabIndex name and focus the combobox input; the rest lands on the root
    const [control, rootAttrs] = splitControlAttrs(rest, isNativeInputKey);
    const [, componentProps] = splitProps(props, ['ref']);

    const { foundation, state } = useFoundation<Foundation, Adapter, AutoCompleteBaseProps, AutoCompleteState>(
        AutoCompleteFoundation,
        props as AutoCompleteBaseProps,
        (view) => AutoCompleteFoundation.getInitialState(view) as AutoCompleteState,
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateScrollTop: (index) => {
                // the rows are the listbox's direct children
                const destNode = listbox?.children[index] as HTMLElement | undefined;
                if (listbox && destNode) {
                    centerInScroller(destNode, listbox);
                }
            },
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleListVisible: (visible) => base.setState({ visible }),
            updateOptionList: (options) => base.setState({ options }),
            updateSelection: (selection) => base.setState({ selection }),
            notifySearch: (inputValue) => local.onSearch?.(inputValue),
            notifyChange: (value) => local.onChange?.(value),
            notifySelect: (option) => local.onSelect?.(option as string | number | BaseDataItem),
            notifyDropdownVisibleChange: (visible) => local.onDropdownVisibleChange?.(visible),
            notifyClear: () => local.onClear?.(),
            notifyFocus: (event) => local.onFocus?.(event as FocusEvent),
            notifyBlur: (event) => local.onBlur?.(event as FocusEvent),
            notifyKeyDown: (event) => callHandler(local.onKeyDown, event),
        })
    );

    const markPressInside = useClickOutside(
        [() => root, () => listbox],
        (e) => {
            // without a rendered list there is nothing to close
            if (listbox) {
                foundation.handleClickOutside(e);
            }
        },
        () => state().visible
    );

    const registerTrigger = useSpecialTrigger(
        () => ({ disabled: local.disabled }),
        () => local.ref
    );

    const prefixNode = children(() => local.prefix);
    const insetLabelNode = children(() => props.insetLabel);
    const suffixNode = children(() => local.suffix);
    const clearIcon = children(() => local.clearIcon);

    // a value Solid sees change identity on every read (a spread signal object) is compared by content
    const data = createMemo(() => local.data, undefined, { equals: isEqual });
    const shownOptions = createMemo(() => state().options.filter((option) => option.show));

    // the getters read the helpers below only when the custom trigger renders
    const triggerRenderProps: AutoCompleteTriggerRenderProps<T> = {
        get value() {
            return [...state().selection.values()];
        },
        get inputValue() {
            return shownValue();
        },
        get disabled() {
            return local.disabled;
        },
        get placeholder() {
            return local.placeholder;
        },
        get autofocus() {
            return local.autofocus;
        },
        get size() {
            return local.size;
        },
        get validateStatus() {
            return props.validateStatus;
        },
        get showClear() {
            return local.showClear;
        },
        get insetLabelId() {
            return prefixId();
        },
        get prefix() {
            return labelNode();
        },
        get suffix() {
            return suffixNode();
        },
        get clearIcon() {
            return clearIcon();
        },
        get 'aria-label'() {
            return name()['aria-label'];
        },
        get 'aria-labelledby'() {
            return name()['aria-labelledby'];
        },
        get 'aria-describedby'() {
            return control['aria-describedby'];
        },
        get 'aria-errormessage'() {
            return control['aria-errormessage'];
        },
        get 'aria-invalid'() {
            return control['aria-invalid'];
        },
        get 'aria-required'() {
            return control['aria-required'];
        },
        onChange: foundation.handleSearch,
        onClear: foundation.handleClear,
        onFocus: foundation.handleFocus,
        onBlur: foundation.handleBlur,
        componentProps: componentProps as Omit<AutoCompleteProps<T>, 'ref'>,
    };

    const shownValue = () => (local.value !== undefined ? local.value : state().inputValue);

    const optionId = (index: number) => `${listboxId}-option-${index}`;

    const inputId = () => local.id ?? `${listboxId}-input`;

    // Input's own rule for rendering the inset label: a prefix takes its place
    const insetLabelShown = () => hasContent(insetLabelNode()) && !hasContent(prefixNode()) && !local.triggerRender;

    const prefixId = () => props.insetLabelId ?? (insetLabelShown() ? `${listboxId}-inset-label` : undefined);

    // The listbox binds it too: the combobox's name source, never the input itself, whose typed value accname would read
    const name = () => comboboxName(control['aria-labelledby'], control['aria-label'], insetLabelShown() ? prefixId() : undefined, undefined);

    const labelNode = () => (hasContent(prefixNode()) ? prefixNode() : insetLabelNode());

    // the spinner replaces the options while loading, and a stale focusIndex can point past a shorter list
    const activeDescendant = () => {
        const { visible, focusIndex } = state();
        return visible && !local.loading && focusIndex !== -1 && focusIndex < shownOptions().length ? optionId(focusIndex) : undefined;
    };

    const listStyle = (): JSX.CSSProperties | string => {
        const maxHeight = toCssLength(local.maxHeight);
        const own = local.dropdownStyle;
        return typeof own === 'string' ? `max-height: ${maxHeight}; ${own}` : { 'max-height': maxHeight, ...own };
    };

    const position = () => local.position ?? (config().direction === 'rtl' ? 'bottomRight' : 'bottomLeft');

    const handleClick = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onClick, e);
        foundation.handleInputClick(e);
    };

    const handleKeyDown = (e: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        // a control inside the trigger (the clear button, a custom trigger's button) keeps its own keys
        if (isInnerControlKey(e)) {
            callHandler(local.onKeyDown, e);
        } else {
            foundation.handleKeyDown(e);
        }
    };

    const handleMouseDown = (e: MouseEvent & { currentTarget: HTMLDivElement; target: Element }) => {
        callHandler(local.onMouseDown, e);
        markPressInside(e);
    };

    const rootOwn = mergeProps(rootAttrs, {
        get id() {
            // with the default trigger the id belongs on the combobox input
            return local.triggerRender ? local.id : undefined;
        },
        get class() {
            return local.triggerRender ? clsx(local.class) : clsx(prefixCls, { [`${prefixCls}-disabled`]: local.disabled }, local.class);
        },
        get style() {
            return local.style;
        },
        // the Popover trigger takes tabindex 0 by default; only the input takes focus
        tabIndex: -1,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        onMouseDown: handleMouseDown,
    });

    // a press in the list, its padding and scrollbar included, keeps the focus in the input
    const handleListMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        markPressInside(e);
    };

    const setRoot = (node: HTMLDivElement) => {
        root = node;
        forwardFocus(node, () => input);
        registerTrigger(node);
    };

    const setListbox = (node: HTMLDivElement) => {
        listbox = node;
        onCleanup(() => {
            if (listbox === node) {
                listbox = undefined;
            }
        });
    };

    const renderInput = () => (
        <Input
            {...control}
            inputRef={(node) => (input = node)}
            id={inputId()}
            role="combobox"
            aria-activedescendant={activeDescendant()}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={state().visible}
            aria-haspopup="listbox"
            aria-label={name()['aria-label']}
            aria-labelledby={name()['aria-labelledby']}
            value={shownValue()}
            disabled={local.disabled}
            placeholder={local.placeholder}
            autofocus={local.autofocus}
            size={local.size}
            validateStatus={props.validateStatus}
            showClear={local.showClear}
            clearIcon={clearIcon()}
            // the host's own adornments only: global Input defaults must not add any
            prefix={labelNode() ?? null}
            suffix={suffixNode() ?? null}
            insetLabel={null}
            insetLabelId={prefixId()}
            addonBefore={null}
            addonAfter={null}
            onChange={foundation.handleSearch}
            onClear={foundation.handleClear}
            onFocus={foundation.handleFocus}
            onBlur={foundation.handleBlur}
        />
    );

    const renderList = () => (
        <div ref={setListbox} id={listboxId} class={clsx(`${prefixCls}-option-list`, local.dropdownClassName)} style={listStyle()} aria-label={name()['aria-label']} aria-labelledby={name()['aria-labelledby']} role="listbox" onMouseDown={handleListMouseDown}>
            <Show
                when={!local.loading}
                fallback={
                    <div class={`${prefixCls}-loading-wrapper`}>
                        <Spin />
                    </div>
                }
            >
                <Show when={state().options.length > 0} fallback={local.emptyContent}>
                    <For each={shownOptions()}>
                        {(option, index) => (
                            <OptionView
                                // item fields named like the row's own props (selected, empty, inputValue) stay out
                                {...getDataAttr(option)}
                                class={option.class as string | undefined}
                                style={option.style as JSX.CSSProperties | string | undefined}
                                disabled={option.disabled as boolean | undefined}
                                // the highlighted option is the combobox's active descendant, which APG marks selected
                                current={index() === state().focusIndex}
                                focused={index() === state().focusIndex}
                                prefixCls={cssClasses.PREFIX_OPTION}
                                semiOptionId={optionId(index())}
                                showTick={false}
                                onMouseEnter={() => foundation.handleOptionMouseEnter(index())}
                                onSelect={() => foundation.handleSelect(option, index())}
                            >
                                <Show when={local.renderItem} keyed fallback={option.label as BaseDataItem['label']}>
                                    {(render) => render(option._source as T)}
                                </Show>
                            </OptionView>
                        )}
                    </For>
                </Show>
            </Show>
        </div>
    );

    useWatch(data, (next) => foundation.handleDataChange(next ?? []));
    useWatch(() => local.value, foundation.handleValueChange);

    return (
        <Popover
            style={local.dropdownMatchSelectWidth ? { 'min-width': 'var(--semi-tooltip-trigger-width)' } : undefined}
            // the listbox inside is the combobox's popup
            role="presentation"
            autoAdjustOverflow={local.autoAdjustOverflow}
            content={renderList}
            // the arrow keys move the highlight through aria-activedescendant, never the focus into the list
            disableArrowKeyDown
            motion={local.motion}
            position={position()}
            stopPropagation={local.stopPropagation}
            trigger="custom"
            visible={state().visible}
        >
            {(getTriggerProps) => (
                <div
                    {...(getTriggerProps(
                        mergeProps(rootOwn, {
                            // the spread memoizes this call and tracks the read; a spread signal object would call the ref again on any change
                            ref: untrack(() => mergeRefs<HTMLDivElement>(setRoot, local.ref)),
                        })
                    ) as JSX.HTMLAttributes<HTMLDivElement>)}
                >
                    <Show when={local.triggerRender} keyed fallback={renderInput()}>
                        {(render) => render(triggerRenderProps)}
                    </Show>
                </div>
            )}
        </Popover>
    );
}
