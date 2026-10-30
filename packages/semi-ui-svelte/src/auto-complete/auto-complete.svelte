<script lang="ts" generics="T extends AutoCompleteItems = AutoCompleteItems">
    import { untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/auto-complete/constants';
    import AutoCompleteFoundation, { type AutoCompleteAdapter, type AutoCompleteBaseProps, type StateOptionItem } from '@fibrae/semi-foundation/auto-complete/foundation';
    import { comboboxName } from '@fibrae/semi-foundation/select/combobox-name';
    import { isInnerControlKey } from '@fibrae/semi-foundation/utils/a11y';
    import { centerInScroller, toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import getDataAttr from '@fibrae/semi-foundation/utils/get-data-attr';
    import '@fibrae/semi-foundation/auto-complete/auto-complete.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useClickOutside from '../_base/use-click-outside.svelte.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { useConfig } from '../config-provider/index.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { Input } from '../input/index.js';
    import { Popover } from '../popover/index.js';
    import Option from '../select/option.svelte';
    import { Spin } from '../spin/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import type { AutoCompleteDataItem, AutoCompleteItems, AutoCompleteProps, AutoCompleteTriggerSnippetProps } from './interface.js';

    interface AutoCompleteState {
        inputValue?: string | number;
        options: StateOptionItem[];
        visible: boolean;
        focusIndex: number;
        selection: Map<unknown, AutoCompleteDataItem>;
    }

    type Foundation = AutoCompleteFoundation<AutoCompleteBaseProps, AutoCompleteState, FocusEvent>;
    type Adapter = AutoCompleteAdapter<AutoCompleteBaseProps, AutoCompleteState, FocusEvent>;

    const defaults = useDefaultProps('AutoComplete');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        data = defaults('data', []) as T[],
        autofocus = defaults('autofocus', false),
        autoAdjustOverflow = defaults('autoAdjustOverflow'),
        defaultActiveFirstOption = defaults('defaultActiveFirstOption', false),
        defaultOpen = defaults('defaultOpen'),
        disabled: disabledProp,
        dropdownClassName = defaults('dropdownClassName'),
        dropdownMatchSelectWidth = defaults('dropdownMatchSelectWidth', true),
        dropdownStyle = defaults('dropdownStyle'),
        // no global default: a global id would repeat on every instance
        insetLabelId,
        loading = defaults('loading', false),
        maxHeight = defaults('maxHeight', 300),
        motion = defaults('motion', true),
        onSelectWithObject = defaults('onSelectWithObject', false),
        placeholder = defaults('placeholder'),
        position = defaults('position'),
        renderSelectedItem = defaults('renderSelectedItem'),
        showClear = defaults('showClear', false),
        size: sizeProp,
        stopPropagation = defaults('stopPropagation', true),
        validateStatus = defaults('validateStatus', 'default'),
        onChange,
        onSearch,
        onSelect,
        onClear,
        onFocus,
        onBlur,
        onDropdownVisibleChange,
        prefix,
        suffix,
        insetLabel,
        clearIcon,
        emptyContent,
        item,
        trigger,
        ...rest
    }: AutoCompleteProps<T> = $props();

    const config = useConfig();

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let listbox = $state<HTMLDivElement>();
    let input = $state<Input>();
    let previousData: unknown;
    const controlKeys = new Set(['id', 'name', 'aria-describedby', 'aria-errormessage', 'aria-invalid', 'aria-label', 'aria-labelledby', 'aria-required']);

    const nestedPopups = useNestedPopups();

    // an InputGroup supplies size and disabled when the control is given none; the controls inside this one must not read it again
    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled'));
    const size = $derived(sizeProp ?? group?.size ?? defaults('size', 'default'));
    const prefixCls = cssClasses.PREFIX;
    const listId = `${uid}-listbox`;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: AutoCompleteBaseProps = {
        get data() {
            return data;
        },
        get defaultActiveFirstOption() {
            return defaultActiveFirstOption;
        },
        get defaultOpen() {
            return defaultOpen;
        },
        get disabled() {
            return disabled;
        },
        get loading() {
            return loading;
        },
        get onSelectWithObject() {
            return onSelectWithObject;
        },
        get renderSelectedItem() {
            return renderSelectedItem as AutoCompleteBaseProps['renderSelectedItem'];
        },
        get value() {
            return value;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, AutoCompleteBaseProps, AutoCompleteState>(
        AutoCompleteFoundation,
        foundationProps,
        (view) => AutoCompleteFoundation.getInitialState(view),
        (base) => ({
            updateFocusIndex: (focusIndex) => base.setState({ focusIndex }),
            updateScrollTop: (index) => {
                // the rows are the listbox's direct children
                const destNode = listbox?.children[index];
                if (listbox && destNode instanceof HTMLElement) {
                    centerInScroller(destNode, listbox);
                }
            },
            updateInputValue: (inputValue) => base.setState({ inputValue }),
            toggleListVisible: (visible) => base.setState({ visible }),
            updateOptionList: (options) => base.setState({ options }),
            updateSelection: (selection) => base.setState({ selection }),
            notifySearch: (inputValue) => onSearch?.(inputValue),
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
            },
            notifySelect: (option) => onSelect?.(option as string | number | AutoCompleteDataItem),
            notifyDropdownVisibleChange: (visible) => onDropdownVisibleChange?.(visible),
            notifyClear: () => onClear?.(),
            // the adapter declares the event optional, the foundation always passes it
            notifyFocus: (event) => onFocus?.(event as FocusEvent),
            notifyBlur: (event) => onBlur?.(event as FocusEvent),
            notifyKeyDown: (event) => rest.onkeydown?.(event),
        })
    );

    const visibleOptions = $derived(states().options.filter((option) => option.show));
    const resolvedPosition = $derived(position ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));

    // A controlled value the parent holds back shows over the typed text; unbound, the value follows the typing
    const shownValue = $derived(value === undefined ? states().inputValue : value);

    // the spinner replaces the options while loading, and a stale focusIndex can point past a shorter list
    const activeDescendant = $derived.by(() => {
        const { visible, focusIndex } = states();
        return visible && !loading && focusIndex !== -1 && focusIndex < visibleOptions.length ? optionId(focusIndex) : undefined;
    });

    const attrs = $derived(splitControlAttrs(rest, (key) => controlKeys.has(key)));
    const inputId = $derived((rest.id as string | undefined) ?? `${uid}-input`);

    // A rendered inset label names the combobox and the listbox, so it needs an id even when the caller gives none; the
    // condition is Input's own for rendering it
    const insetLabelShown = $derived(!trigger && !prefix && Boolean(insetLabel));
    const prefixId = $derived(insetLabelId ?? (insetLabelShown ? `${uid}-inset-label` : undefined));

    // The listbox binds it too: the combobox's name source, never the input itself, whose typed value accname would read
    const nameAttrs = $derived(comboboxName(rest['aria-labelledby'] ?? undefined, rest['aria-label'] ?? undefined, insetLabelShown ? prefixId : undefined, undefined));
    const inputAttrs = $derived({ ...attrs.control, ...nameAttrs });

    const triggerSnippetProps: AutoCompleteTriggerSnippetProps = $derived.by(() => {
        const { id: _id, name: _name, ...controlAttrs } = attrs.control;
        return {
            value: [...states().selection.values()],
            inputValue: shownValue,
            placeholder,
            disabled: Boolean(disabled),
            autofocus,
            size,
            validateStatus,
            showClear,
            insetLabelId,
            onChange: foundation.handleSearch,
            onClear: foundation.handleClear,
            onFocus: foundation.handleFocus,
            onBlur: foundation.handleBlur,
            controlAttrs,
        };
    });

    setInputGroupContext(undefined);

    // a press would move the focus out of the input; the options and the list itself are not focus targets
    const keepFocusOnPress = (event: MouseEvent) => {
        event.preventDefault();
    };

    const optionId = (index: number) => {
        return `${uid}-option-${index}`;
    };

    const optionProps = (option: StateOptionItem, index: number) => {
        // item fields that share a name with the row's own props stay out: only class, style and data-* go along
        return {
            id: optionId(index),
            class: option.class,
            dataAttrs: getDataAttr(option),
            current: index === states().focusIndex,
            disabled: option.disabled,
            focused: index === states().focusIndex,
            label: option.label ?? option.value,
            prefixCls: cssClasses.PREFIX_OPTION,
            showTick: false,
            style: option.style,
            onMouseEnter: () => foundation.handleOptionMouseEnter(index),
            onSelect: () => foundation.handleSelect(option, index),
        };
    };

    const handleKeyDown = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        // a control inside the trigger (the clear button, a custom trigger's button) keeps its own keys
        if (isInnerControlKey(event)) {
            rest.onkeydown?.(event);
        } else {
            foundation.handleKeyDown(event);
        }
    };

    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        foundation.handleInputClick(event);
        rest.onclick?.(event);
    };

    // A snapshot of the items, so an array changed in place (push, an edited field) is noticed as well; the items are
    // flat data, nodes go in the item snippet.
    $effect.pre(() => {
        const next = data.map((entry) => (typeof entry === 'object' ? { ...entry } : entry));
        const before = previousData;
        previousData = next;
        if (before !== undefined && !isEqual(before, next)) {
            untrack(() => foundation.handleDataChange(data));
        }
    });

    // Typing writes the text to `value`; running the foundation on that echo would pass the text through
    // renderSelectedItem, which expects a data item, and rewrite what the user typed
    watch(
        () => value,
        (next) => {
            if (!Object.is(next, states().inputValue)) {
                foundation.handleValueChange(next);
            }
        }
    );

    useClickOutside(
        [() => root, () => listbox],
        (event) => {
            // without a rendered list there is nothing to close
            if (listbox) {
                foundation.handleClickOutside(event);
            }
        },
        () => states().visible,
        nestedPopups
    );

    export function focus(options?: FocusOptions) {
        input?.focus(options);
    }

    export function blur() {
        input?.blur();
    }

    /** The root div, which wraps the input or the custom trigger */
    export function getNativeElement() {
        return root;
    }
</script>

{#snippet triggerNode({ props }: { props: TooltipTriggerProps })}
    <!-- Tooltip gives a trigger without a tabindex 0; only the input inside takes the focus -->
    <div bind:this={root} {...props} {...attrs.root} class={trigger ? rest.class : [prefixCls, rest.class, { [`${prefixCls}-disabled`]: disabled }]} id={trigger ? (rest.id as string | undefined) : undefined} tabindex={-1} onclick={handleClick} onkeydown={handleKeyDown}>
        {#if trigger}
            {@render trigger(triggerSnippetProps)}
        {:else}
            <Input
                bind:this={input}
                {...inputAttrs}
                aria-activedescendant={activeDescendant}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={states().visible}
                aria-haspopup="listbox"
                {autofocus}
                bind:value={() => shownValue, () => undefined}
                {clearIcon}
                {disabled}
                id={inputId}
                {insetLabel}
                insetLabelId={prefixId}
                onBlur={foundation.handleBlur}
                onChange={foundation.handleSearch}
                onClear={foundation.handleClear}
                onFocus={foundation.handleFocus}
                {placeholder}
                {prefix}
                role="combobox"
                {showClear}
                {size}
                {suffix}
                {validateStatus}
            />
        {/if}
    </div>
{/snippet}

{#snippet panel()}
    <div bind:this={listbox} id={listId} {...nameAttrs} class={[`${prefixCls}-option-list`, dropdownClassName]} role="listbox" style={[`max-height: ${toCssLength(maxHeight)}`, dropdownStyle].filter(Boolean).join('; ')} onmousedown={keepFocusOnPress}>
        {#if loading}
            <div class={`${prefixCls}-loading-wrapper`}>
                <Spin />
            </div>
        {:else if states().options.length === 0}
            {@render emptyContent?.()}
        {:else}
            {#each visibleOptions as option, index (option.key ?? `${option.label}${option.value}${index}`)}
                {#if item}
                    <Option {...optionProps(option, index)}>
                        {@render item({ item: option._source as T, index })}
                    </Option>
                {:else}
                    <Option {...optionProps(option, index)} />
                {/if}
            {/each}
        {/if}
    </div>
{/snippet}

<!-- the listbox inside is the combobox's popup; the arrow keys move the highlight through aria-activedescendant, never the focus into the list -->
<Popover
    {autoAdjustOverflow}
    bind:visible={() => states().visible, () => undefined}
    child={triggerNode}
    content={panel}
    disableArrowKeyDown
    {motion}
    position={resolvedPosition}
    role="presentation"
    {stopPropagation}
    style={dropdownMatchSelectWidth ? 'min-width: var(--semi-tooltip-trigger-width)' : undefined}
    trigger="custom"
/>
