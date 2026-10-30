<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/rating/constants';
    import RatingFoundation, { type RatingAdapter, type RatingBaseProps, type RatingFocusEvent, type RatingState } from '@fibrae/semi-foundation/rating/foundation';
    import FocusTrapHandle from '@fibrae/semi-foundation/utils/focus-handle';
    import '@fibrae/semi-foundation/rating/rating.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import { getConfigContext } from '../config-provider/context.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { TooltipTriggerProps } from '../tooltip/interface.js';
    import Tooltip from '../tooltip/tooltip.svelte';
    import type { RatingProps } from './interface.js';
    import RatingItem from './item.svelte';

    type ClickEvent = MouseEvent | KeyboardEvent;

    // the DOM typings give relatedTarget as an EventTarget, but a focus event's is a Node or null
    type ListFocusEvent = FocusEvent & RatingFocusEvent;
    type Foundation = RatingFoundation<RatingBaseProps, RatingState, ClickEvent, ListFocusEvent, KeyboardEvent>;
    type Adapter = RatingAdapter<RatingBaseProps, RatingState, ClickEvent, ListFocusEvent, KeyboardEvent>;

    const defaults = useDefaultProps('Rating');

    // No fallback on `value`: a bound `undefined` (form reset) would throw with one
    let {
        value = $bindable(),
        count = defaults('count', 5),
        allowHalf = defaults('allowHalf', false),
        allowClear = defaults('allowClear', true),
        disabled = defaults('disabled', false),
        size = defaults('size', 'default'),
        tooltips = defaults('tooltips'),
        prefixCls = defaults('prefixCls', cssClasses.PREFIX),
        autofocus = defaults('autofocus'),
        preventScroll = defaults('preventScroll'),
        character = defaults('character'),
        onChange,
        onHoverChange,
        onClick,
        onFocus,
        onBlur,
        onKeyDown,
        ...rest
    }: RatingProps = $props();

    const config = getConfigContext();
    const locale = useLocale('Rating');

    let list: HTMLUListElement | null = $state(null);
    const stars: Record<number, { starFocus: (value: number) => void; getDomNode: () => HTMLLIElement | null } | undefined> = $state({});

    // A wrapping Tooltip gives its trigger tabindex 0, which cannot be told apart from a caller's: the radios hold the one
    // roving Tab stop. A radiogroup has no control to carry a name.
    const DROPPED_ATTRS = new Set(['tabindex', 'name']);

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: RatingBaseProps = {
        get value() {
            return value;
        },
        // an unset value starts empty, and a value that goes back to undefined returns to it
        defaultValue: 0,
        get count() {
            return count;
        },
        get allowHalf() {
            return allowHalf;
        },
        get allowClear() {
            return allowClear;
        },
        get preventScroll() {
            return preventScroll;
        },
        get autoFocus() {
            return autofocus ?? undefined;
        },
        get disabled() {
            return disabled;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, RatingBaseProps, RatingState>(
        RatingFoundation,
        foundationProps,
        (view) => RatingFoundation.getInitialState(view),
        (base) => ({
            focusStar: (starValue) => {
                // a value between radios has no radio to focus: Tab's landing radio stands in, as for focus()
                if (!RatingFoundation.isRadioValue(starValue, count, allowHalf)) {
                    focusTabStop();
                    return;
                }
                const index = Math.ceil(starValue) - 1;
                stars[index < 0 ? count : index]?.starFocus(starValue);
            },
            getStarDOM: (index) => stars[index]?.getDomNode() ?? null,
            setHover: (hoverValue, clearedValue) => base.setState({ hoverValue, clearedValue }),
            notifyHoverChange: (hoverValue) => onHoverChange?.(hoverValue),
            setValue: (next) => base.setState({ value: next }),
            notifyChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                value = next;
                onChange?.(next);
            },
            setClearedValue: (clearedValue) => base.setState({ clearedValue }),
            notifyClick: (event, index) => onClick?.(event, index),
            notifyFocus: (event) => onFocus?.(event),
            notifyBlur: (event) => onBlur?.(event),
            notifyKeyDown: (event) => onKeyDown?.(event),
            setFocusVisibleStar: (focusVisibleStar) => base.setState({ focusVisibleStar }),
        }),
        { context: () => config }
    );

    const shown = $derived(RatingFoundation.deriveValue({ value }, states()));
    const starIndexes = $derived(Array.from({ length: count + 1 }, (_, index) => index));
    const onRadio = $derived(RatingFoundation.isRadioValue(shown, count, allowHalf));
    const customUnit = $derived(typeof character === 'string' ? character : undefined);
    const rootAttrs = $derived(Object.fromEntries(Object.entries(rest).filter(([key]) => !DROPPED_ATTRS.has(key))));

    // a function replacer keeps `$&` and `$$` in a custom unit literal
    const groupLabel = $derived.by(() => {
        const { label, star, stars: plural } = locale().locale;
        return (
            rest['aria-label'] ||
            label
                .replace('${value}', String(shown))
                .replace('${count}', String(count))
                .replace('${unit}', () => customUnit ?? (shown === 1 ? star : plural))
        );
    });

    const tipVisible = (index: number) => RatingFoundation.isTipVisible(index, states().hoverValue, states().focusVisibleStar, tooltips?.[index]);

    const focusTabStop = () => list?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus({ preventScroll });

    const handleFocusin = (event: FocusEvent & { currentTarget: EventTarget & HTMLUListElement }) => {
        rest.onfocusin?.(event);
        if (!disabled) {
            foundation.handleFocus(event as ListFocusEvent);
        }
    };

    // not gated by disabled: focus that was inside before the rating was disabled must still be released
    const handleFocusout = (event: FocusEvent & { currentTarget: EventTarget & HTMLUListElement }) => {
        rest.onfocusout?.(event);
        foundation.handleBlur(event as ListFocusEvent);
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (!disabled) {
            foundation.handleKeyDown(event, shown);
        }
    };

    const handleStarFocus = (event: FocusEvent, index: number) => {
        if (!disabled && event.target instanceof Element) {
            foundation.handleStarFocus({ target: event.target }, index);
        }
    };

    // a hover that began before the rating was disabled must still end
    const handleMouseleave = (event: MouseEvent & { currentTarget: EventTarget & HTMLUListElement }) => {
        rest.onmouseleave?.(event);
        foundation.handleMouseLeave();
    };

    watch(
        () => value,
        (next) => {
            if (next === undefined) {
                foundation.resetValue();
            }
        }
    );

    /** Focuses the radio that Tab would reach */
    export function focus() {
        if (!disabled) {
            focusTabStop();
        }
    }

    export function blur() {
        const active = FocusTrapHandle.getActiveElement(list);
        if (!disabled && active instanceof HTMLElement && list?.contains(active)) {
            active.blur();
        }
    }
</script>

{#snippet star(index: number, trigger?: TooltipTriggerProps)}
    <RatingItem
        {allowHalf}
        bind:this={stars[index]}
        {character}
        {count}
        {disabled}
        displayValue={states().hoverValue === undefined ? shown : states().hoverValue}
        firstTabStop={index === 0 && !onRadio}
        {index}
        onPick={(event) => foundation.handleClick(event, index)}
        onPreview={(event) => foundation.handleHover(event, index)}
        onRadioFocus={(event) => handleStarFocus(event, index)}
        onSelect={(event, selected) => foundation.handleSelect(event, index, selected)}
        prefixCls={`${prefixCls}-star`}
        {preventScroll}
        size={index === count ? 0 : size}
        {trigger}
        unit={customUnit}
        value={shown}
    />
{/snippet}

<ul {...rootAttrs} aria-label={groupLabel} bind:this={list} class={[prefixCls, rest.class, { [`${prefixCls}-disabled`]: disabled }]} role="radiogroup" tabindex="-1" onfocusin={handleFocusin} onfocusout={handleFocusout} onkeydown={handleKeydown} onmouseleave={handleMouseleave}>
    {#each starIndexes as index (index)}
        <!-- Escape cannot hide the tip the rating drives, so closeOnEsc is off and the key goes on to the layer below -->
        {#if tooltips}
            <Tooltip closeOnEsc={false} trigger="custom" visible={tipVisible(index)}>
                {#snippet child({ props })}
                    {@render star(index, props)}
                {/snippet}
                {#snippet content()}
                    {tooltips?.[index] ?? ''}
                {/snippet}
            </Tooltip>
        {:else}
            {@render star(index)}
        {/if}
    {/each}
</ul>
