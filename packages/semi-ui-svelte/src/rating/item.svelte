<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/rating/constants';
    import RatingFoundation from '@fibrae/semi-foundation/rating/foundation';
    import { IconStar } from '@fibrae/semi-icons-svelte';
    import useLocale from '../locale/use-locale.svelte.js';
    import type { RatingItemProps } from './interface.js';

    let { value, displayValue, index, prefixCls, allowHalf, disabled, count, size, unit, preventScroll, firstTabStop = false, character, trigger, onPreview, onPick, onSelect, onRadioFocus }: RatingItemProps = $props();

    const locale = useLocale('Rating');

    let li: HTMLLIElement | null = $state(null);
    let first: HTMLDivElement | null = $state(null);
    let second: HTMLDivElement | null = $state(null);

    const isEmpty = $derived(index === count);
    const isCustomSize = $derived(typeof size === 'number');
    const model = $derived(RatingFoundation.getItemModel({ index, count, allowHalf, value, displayValue, disabled, firstTabStop }));
    const iconSize = $derived(isCustomSize ? 'inherit' : size === 'small' ? 'default' : 'extra-large');
    const sizeStyle = $derived(isCustomSize ? `width: ${size}px; height: ${size}px; font-size: ${size}px` : undefined);

    // A wrapping Tooltip injects a Tab stop: the radios keep the roving tabindex, and only the description reaches them
    const triggerParts = $derived.by(() => {
        const { tabindex: _tabindex, 'aria-describedby': describedby, ...root } = trigger ?? {};
        return { root, describedby };
    });

    // a function replacer keeps `$&` and `$$` in a custom unit literal
    const itemName = (n: number) =>
        locale()
            .locale.itemLabel.replace('${value}', String(n))
            .replace('${unit}', () => unit ?? (n === 1 ? locale().locale.star : locale().locale.stars));

    const radioValueOf = (target: EventTarget | null) => (target === first ? model.firstValue : target === second ? model.secondValue : undefined);

    // a disabled radio can still take focus by a click, but it reports nothing
    const handleFocus = (event: FocusEvent) => {
        if (!disabled) {
            onRadioFocus(event);
        }
    };

    const handleClick = (event: MouseEvent) => {
        if (disabled) {
            return;
        }
        const radioValue = RatingFoundation.resolveClickRadio(event.detail, radioValueOf(event.target));
        if (radioValue === undefined) {
            onPick(event);
        } else {
            onSelect(event, radioValue);
        }
    };

    const handleMousemove = (event: MouseEvent) => {
        if (!disabled) {
            onPreview(event);
        }
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (disabled) {
            return;
        }
        const { preventDefault, selectValue } = RatingFoundation.resolveKeyActivation(event.key, radioValueOf(event.target), value);
        if (preventDefault) {
            event.preventDefault();
        }
        if (selectValue !== undefined) {
            onSelect(event, selectValue);
        }
    };

    /** Focuses the radio of this star that stands for `starValue`: the first half for a half value */
    export function starFocus(starValue: number) {
        const radio = RatingFoundation.isFirstRadio(starValue, index, allowHalf) ? first : second;
        radio?.focus({ preventScroll });
    }

    export function getDomNode() {
        return li;
    }
</script>

{#snippet face()}
    {#if typeof character === 'function'}
        {@render character()}
    {:else if character !== undefined}
        {character}
    {:else}
        <IconStar size={iconSize} style="display: block" />
    {/if}
{/snippet}

<li
    {...triggerParts.root}
    bind:this={li}
    class={[
        prefixCls,
        {
            [`${prefixCls}-half`]: model.isHalf,
            [`${prefixCls}-full`]: model.isFull,
            [`${prefixCls}-${size}`]: !isCustomSize,
        },
    ]}
    role="none"
    style={sizeStyle}
>
    <div class={[`${prefixCls}-wrapper`, { [`${prefixCls}-disabled`]: disabled }]} role="presentation" onclick={handleClick} onkeydown={handleKeydown} onmousemove={handleMousemove}>
        {#if allowHalf && !isEmpty}
            <div
                aria-checked={value === model.firstValue}
                aria-describedby={triggerParts.describedby}
                aria-disabled={disabled}
                aria-label={itemName(model.firstValue)}
                aria-posinset={2 * index + 1}
                aria-setsize={model.setSize}
                bind:this={first}
                class={[`${prefixCls}-first`, `${cssClasses.PREFIX}-no-focus`]}
                role="radio"
                style:width={model.firstWidth}
                tabindex={model.firstTabIndex}
                onfocus={handleFocus}
            >
                {@render face()}
            </div>
        {/if}
        <div
            aria-checked={value === model.secondValue}
            aria-describedby={triggerParts.describedby}
            aria-disabled={disabled}
            aria-label={itemName(model.secondValue)}
            aria-posinset={model.secondPosInSet}
            aria-setsize={model.setSize}
            bind:this={second}
            class={[`${prefixCls}-second`, `${cssClasses.PREFIX}-no-focus`]}
            role="radio"
            tabindex={model.secondTabIndex}
            x-semi-prop="character"
            onfocus={handleFocus}
        >
            {@render face()}
        </div>
    </div>
</li>
