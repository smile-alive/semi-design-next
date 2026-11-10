<script lang="ts">
    import { tick, untrack } from 'svelte';
    import FocusTrapHandle from '@fibrae/semi-foundation/base/focus-handle';
    import { cssClasses } from '@fibrae/semi-foundation/components/tag-input/constants';
    import TagInputFoundation, { type OnSortEndProps, type TagInputAdapter, type TagInputBaseProps, type TagInputBaseState, type TagSortIds } from '@fibrae/semi-foundation/components/tag-input/foundation';
    import { focusTagStop, getFocusedTagStop } from '@fibrae/semi-foundation/components/tag-input/utils/tag-focus';
    import '@fibrae/semi-foundation/components/tag-input/tag-input.scss';
    import { IconClear } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../../base/use-default-props.js';
    import useFoundation from '../../base/use-foundation.svelte.js';
    import useClickOutside from '../../hooks/use-click-outside.svelte.js';
    import watch from '../../hooks/watch.svelte.js';
    import type SortableComponent from '../../internal/sortable/sortable.svelte';
    import { splitControlAttrs } from '../../utils/control-attrs.js';
    import { type SlotKind, trackSlotKind } from '../../utils/slot-kind.js';
    import { getInputGroupInScope, setInputGroupContext } from '../input/context.js';
    import { Input } from '../input/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { Popover } from '../popover/index.js';
    import { useNestedPopups } from '../tooltip/context.js';
    import type { TooltipTriggerProps } from '../tooltip/index.js';
    import type { RestTagsPopoverProps, TagInputProps } from './interface.js';
    import TagItem from './tag-item.svelte';

    type Foundation = TagInputFoundation<TagInputBaseProps, Event>;
    type Adapter = TagInputAdapter<TagInputBaseProps, Event>;

    const defaults = useDefaultProps('TagInput');

    // No fallback on `value` and `inputValue`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        inputValue = $bindable(),
        disabled: disabledProp,
        maxLength = defaults('maxLength'),
        max = defaults('max'),
        maxTagCount = defaults('maxTagCount'),
        showRestTagsPopover = defaults('showRestTagsPopover', true),
        restTagsPopoverProps = defaults('restTagsPopoverProps'),
        showContentTooltip = defaults('showContentTooltip', true),
        allowDuplicates = defaults('allowDuplicates', true),
        addOnBlur = defaults('addOnBlur', false),
        draggable = defaults('draggable', false),
        expandRestTagsOnClick = defaults('expandRestTagsOnClick', true),
        placeholder = defaults('placeholder'),
        insetLabelId,
        separator = defaults('separator', ','),
        showClear = defaults('showClear', false),
        size: sizeProp,
        split = defaults('split'),
        validateStatus = defaults('validateStatus', 'default'),
        autofocus = defaults('autofocus', false),
        preventScroll = defaults('preventScroll'),
        onChange,
        onInputChange,
        onAdd,
        onRemove,
        onExceed,
        onInputExceed,
        onFocus,
        onBlur,
        onKeyDown,
        onclick,
        prefix,
        suffix,
        insetLabel,
        clearIcon,
        tag,
        ...rest
    }: TagInputProps = $props();

    const locale = useLocale('TagInput');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let wrapper = $state<HTMLDivElement>();

    // explicit type: the adapter reads this instance while the template reads foundation state, which would make inference circular
    let input = $state<ReturnType<typeof Input>>();
    let clearButton = $state<HTMLButtonElement>();
    let prefixKind = $state<SlotKind>();
    let suffixKind = $state<SlotKind>();
    let Sortable = $state.raw<typeof SortableComponent>();

    // not reactive: only the focus handlers read it, to ignore the blur dnd-kit causes when it moves the picked-up handle
    let dragging = false;
    let sortable = false;
    let sortIds = $state.raw<TagSortIds>(untrack(() => TagInputFoundation.getSortIds(value ?? [])));

    // These describe the text input, not the root. A combobox built on TagInput (Cascader, TreeSelect) makes the input
    // itself the combobox (ARIA 1.2), hence the role. The root is a group, not a focus target, so a tabindex (Tooltip
    // injects 0) goes to the input as well.
    const controlKeys = new Set(['id', 'name', 'role', 'tabindex', 'aria-activedescendant', 'aria-autocomplete', 'aria-controls', 'aria-describedby', 'aria-errormessage', 'aria-expanded', 'aria-haspopup', 'aria-invalid', 'aria-label', 'aria-labelledby', 'aria-required']);

    // an InputGroup supplies size and disabled when the control is given none; the controls inside this one must not read it again
    const group = getInputGroupInScope();
    const disabled = $derived(disabledProp ?? group?.disabled ?? defaults('disabled') ?? false);
    const size = $derived(sizeProp ?? group?.size ?? defaults('size', 'default'));
    const prefixCls = cssClasses.PREFIX;

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: TagInputBaseProps = {
        get value() {
            return value;
        },
        get inputValue() {
            return inputValue;
        },
        get disabled() {
            return disabled;
        },
        get autoFocus() {
            return autofocus;
        },
        get maxLength() {
            return maxLength;
        },
        get max() {
            return max;
        },
        get allowDuplicates() {
            return allowDuplicates;
        },
        get addOnBlur() {
            return addOnBlur;
        },
        get separator() {
            return separator;
        },
        get split() {
            return split;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, TagInputBaseProps, TagInputBaseState>(
        TagInputFoundation,
        foundationProps,
        (view) => TagInputFoundation.getInitialState(view),
        () => ({
            focusInput: () => focusInput(),
            // Every text change passes through here before the notification, and the Firefox IME path has no notification
            // at all, so the write-back lives here: a bound parent or the local override always shows what was set
            syncInputValue: (next) => {
                inputValue = next;
            },
            notifyBlur: (event) => onBlur?.(event),
            notifyFocus: (event) => onFocus?.(event),
            notifyInputChange: (next, event) => onInputChange?.(next, event),
            notifyTagChange: (next) => {
                value = next;
                onChange?.(next);
            },
            notifyTagAdd: (added) => onAdd?.(added),
            notifyTagRemove: (removed, index) => onRemove?.(removed, index),
            notifyKeyDown: (event) => onKeyDown?.(event),
            notifyInputExceed: (text) => onInputExceed?.(text),
            notifyExceed: (list) => onExceed?.(list),
            getInput: () => input?.getInput() ?? null,
            getRoot: () => root ?? null,
        })
    );

    const attrs = $derived(splitControlAttrs(rest, (key) => controlKeys.has(key)));
    const tags = $derived(TagInputFoundation.getTagsArray({ value }, states()) ?? []);
    const inputText = $derived(TagInputFoundation.getInputValue({ inputValue }, states()) ?? '');
    const popoverProps = $derived({ autoAdjustOverflow: true, position: 'top', showArrow: true, trigger: 'hover', ...restTagsPopoverProps } satisfies RestTagsPopoverProps);
    const draggableActive = $derived(Boolean(states().active && draggable));
    const sorting = $derived(draggableActive && tags.length > 0);
    const visibleCount = $derived(TagInputFoundation.getVisibleCount({ maxTagCount, expandRestTagsOnClick }, { active: states().active, sorting }, tags.length));
    const shownTags = $derived(tags.slice(0, visibleCount));
    const restTags = $derived(tags.slice(visibleCount));
    const restCount = $derived(restTags.length);
    const clearable = $derived((inputText !== '' || tags.length > 0) && !disabled);
    const insetLabelShown = $derived(!prefix && Boolean(insetLabel));

    // a rendered inset label names the input (WCAG 2.5.3), so it needs an id even when the caller gives none
    const prefixId = $derived(insetLabelId ?? (insetLabelShown ? `${uid}-inset-label` : undefined));
    const insetNameId = $derived(insetLabelShown ? prefixId : undefined);

    // the value under validation is the text field's, and group does not support aria-invalid
    const ariaInvalid = $derived(rest['aria-invalid'] ?? (validateStatus === 'error' ? true : undefined));

    // a Form label reaches the input through `id`; without any name source it would have no name
    const ariaLabel = $derived(rest['aria-label'] ?? (rest['aria-labelledby'] || rest.id || insetNameId ? undefined : locale().locale.input));
    const ariaLabelledby = $derived(rest['aria-labelledby'] ?? (rest['aria-label'] ? undefined : insetNameId));
    const trackPrefix = trackSlotKind((kind) => (prefixKind = kind));
    const trackSuffix = trackSlotKind((kind) => (suffixKind = kind));

    setInputGroupContext(undefined);

    const focusInput = () => {
        input?.getInput()?.focus({ preventScroll });
    };

    const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        onclick?.(event);
        foundation.handleClick();
    };

    const handleSortEnd = (move: OnSortEndProps) => {
        sortIds = { ...sortIds, move };
        foundation.handleSortEnd(move);
    };

    const handleClear = (event: MouseEvent) => {
        foundation.handleClearBtn(event);
        focusInput();
    };

    const handleTagClose = (index: number, event?: Event) => {
        // Tag hides itself unless its close event is prevented; the value decides
        if (event instanceof Event) {
            event.preventDefault();
        }
        if (disabled) {
            return;
        }
        // a removed node fires no blur either, so the input takes the focus first
        if (root?.contains(FocusTrapHandle.getActiveElement(root))) {
            focusInput();
        }
        foundation.handleTagClose(index);
    };

    const handleFocusIn = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        rest.onfocusin?.(event);
        foundation.handleInputFocus(event);
    };

    const handleFocusOut = (event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) => {
        rest.onfocusout?.(event);
        // Chromium blurs the picked-up handle when dnd-kit moves it; ending the active state would unmount the list
        if (!dragging) {
            foundation.handleInputBlur(event);
        }
    };

    const handleDragging = (on: boolean) => {
        dragging = on;
    };

    // prefix and suffix hand the focus to the input, so the press must not move it first
    const keepFocus = (event: MouseEvent) => event.preventDefault();

    watch(() => [inputText, tags.length === 0, placeholder, size], foundation.fitInputWidth);

    // the sort ids are settled before the DOM patch, or one frame would show tags under the wrong ids
    $effect.pre(() => {
        sortIds = TagInputFoundation.getSortIds(
            tags,
            untrack(() => sortIds)
        );
    });

    $effect(() => {
        if (draggableActive && !Sortable) {
            void import('../../internal/sortable/sortable.svelte').then((module) => {
                Sortable = module.default;
            });
        }
    });

    // Switching plain/sortable lists rebuilds every tag, so the input holds focus during the patch; the same tag then
    // takes it back.
    $effect.pre(() => {
        const now = Boolean(Sortable && sorting);
        if (now === sortable) {
            return;
        }
        sortable = now;
        untrack(() => {
            const stop = getFocusedTagStop(wrapper ?? null);
            if (stop >= 0) {
                // the tag takes focus back right after; do not scroll the input into view
                input?.getInput()?.focus({ preventScroll: true });
                void tick().then(() => focusTagStop(wrapper ?? null, stop));
            }
        });
    });

    // A removed node fires no blur, so a focused clear button would drop focus to the body; this pre-flush effect runs
    // before the DOM patch removes it.
    $effect.pre(() => {
        if (!clearable && clearButton && clearButton === FocusTrapHandle.getActiveElement(clearButton)) {
            focusInput();
        }
    });

    // mousedown: a press inside released outside makes a click on their common ancestor, which reads as outside
    useClickOutside([() => root], foundation.deactivate, () => Boolean(states().active), useNestedPopups());

    export function focus() {
        foundation.focus();
    }

    export function blur() {
        foundation.blur();
    }
</script>

{#snippet restTrigger({ props }: { props: TooltipTriggerProps })}
    <span {...props} class={[`${prefixCls}-wrapper-n`, { [`${prefixCls}-wrapper-n-disabled`]: disabled }]}>+{restCount}</span>
{/snippet}

{#snippet restTagList()}
    {#each restTags as value, index (`${shownTags.length + index}-${value}`)}
        <TagItem {disabled} {draggableActive} index={shownTags.length + index} onClose={(event) => handleTagClose(shownTags.length + index, event)} {showContentTooltip} {size} {tag} {value} withHandle={false} />
    {/each}
{/snippet}

<div
    bind:this={root}
    {...attrs.root}
    aria-disabled={disabled || undefined}
    class={[
        prefixCls,
        attrs.root.class,
        {
            [`${prefixCls}-focus`]: states().focusing || states().active,
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-error`]: validateStatus === 'error',
            [`${prefixCls}-warning`]: validateStatus === 'warning',
            [`${prefixCls}-small`]: size === 'small',
            [`${prefixCls}-large`]: size === 'large',
            [`${prefixCls}-with-prefix`]: Boolean(prefix || insetLabel),
            [`${prefixCls}-with-suffix`]: Boolean(suffix),
        },
    ]}
    role="group"
    onclick={handleClick}
    onfocusin={handleFocusIn}
    onfocusout={handleFocusOut}
>
    {#if prefix || insetLabel}
        <div
            {@attach trackPrefix}
            class={[`${prefixCls}-prefix`, { [`${prefixCls}-inset-label`]: Boolean(insetLabel), [`${prefixCls}-prefix-text`]: prefixKind === 'text', [`${prefixCls}-prefix-icon`]: prefixKind === 'icon' }]}
            id={prefixId}
            x-semi-prop="prefix"
            onclick={foundation.handleClickPrefixOrSuffix}
            onmousedown={keepFocus}
        >
            {#if prefix}
                {@render prefix()}
            {:else if insetLabel}
                {@render insetLabel()}
            {/if}
        </div>
    {/if}
    <div bind:this={wrapper} class={`${prefixCls}-wrapper`}>
        {#if Sortable && sorting}
            <Sortable class={`${prefixCls}-sortable-list`} dragHandleLabel={locale().locale.dragSort} dragOverlayClass={`${prefixCls}-drag-item-move`} items={sortIds.ids} onDragging={handleDragging} onSortEnd={handleSortEnd} prefix={prefixCls} transition={null}>
                {#snippet item({ id })}
                    <!-- the list shows a preview order while dragging, so the tag is found by its id, not by the position -->
                    {@const index = sortIds.ids.indexOf(String(id))}
                    {#if index >= 0}
                        <TagItem {disabled} draggableActive {index} onClose={(event) => handleTagClose(index, event)} {showContentTooltip} {size} {tag} value={tags[index]} withHandle />
                    {/if}
                {/snippet}
            </Sortable>
        {:else}
            {#each shownTags as value, index (`${index}-${value}`)}
                <TagItem {disabled} {draggableActive} {index} onClose={(event) => handleTagClose(index, event)} {showContentTooltip} {size} {tag} {value} withHandle={false} />
            {/each}
            {#if restCount > 0}
                {#if showRestTagsPopover}
                    <Popover {...popoverProps} child={restTrigger} content={restTagList} />
                {:else}
                    <span class={[`${prefixCls}-wrapper-n`, { [`${prefixCls}-wrapper-n-disabled`]: disabled }]}>+{restCount}</span>
                {/if}
            {/if}
        {/if}
        <Input
            bind:this={input}
            bind:value={() => inputText, () => {}}
            {...attrs.control}
            aria-invalid={ariaInvalid}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            class={[`${prefixCls}-wrapper-input`, `${prefixCls}-wrapper-input-${size}`]}
            {disabled}
            onChange={foundation.handleInputChange}
            onCompositionEnd={foundation.handleInputCompositionEnd}
            onCompositionStart={foundation.handleInputCompositionStart}
            onKeyDown={foundation.handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            {preventScroll}
            showClear={false}
            {size}
        />
    </div>
    {#if showClear}
        {#if clearable}
            <button aria-label={locale().locale.clear} bind:this={clearButton} class={`${prefixCls}-clearBtn`} type="button" onclick={handleClear}>
                {#if clearIcon}
                    {@render clearIcon()}
                {:else}
                    <IconClear />
                {/if}
            </button>
        {:else}
            <span class={`${prefixCls}-clearBtn-placeholder`}></span>
        {/if}
    {/if}
    {#if suffix}
        <div {@attach trackSuffix} class={[`${prefixCls}-suffix`, { [`${prefixCls}-suffix-text`]: suffixKind === 'text', [`${prefixCls}-suffix-icon`]: suffixKind === 'icon' }]} x-semi-prop="suffix" onclick={foundation.handleClickPrefixOrSuffix} onmousedown={keepFocus}>
            {@render suffix()}
        </div>
    {/if}
</div>
