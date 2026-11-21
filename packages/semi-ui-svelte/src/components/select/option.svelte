<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses, type OptionPart, type SelectPart } from '@fibrae/semi-foundation/components/select/constants';
    import { IconTick } from '@fibrae/semi-icons-svelte';
    import { Highlight } from '../highlight/index.js';

    /**
     * One row of the Select list (and of AutoComplete). Not a public child component: the Select reads its options from
     * `optionList`, since a child cannot hand its data to the parent before the first server render.
     */
    interface OptionRowProps {
        id?: string;
        label?: string | number;
        disabled?: boolean;
        showTick?: boolean;
        empty?: boolean;
        selected?: boolean;
        focused?: boolean;
        /** The row aria-activedescendant points at; AutoComplete marks it aria-selected */
        current?: boolean;
        inputValue?: string;
        prefixCls?: string;
        class?: ClassValue;
        style?: string;
        classNames?: Partial<Record<OptionPart, ClassValue>>;
        styles?: Partial<Record<OptionPart, string>>;
        /** The `item*` parts of the parent, applied before the option's own */
        parentClassNames?: Partial<Record<SelectPart, ClassValue>>;
        parentStyles?: Partial<Record<SelectPart, string>>;
        dataAttrs?: Record<string, unknown>;
        children?: Snippet;
        onSelect?: (event: MouseEvent) => void;
        onMouseEnter?: (event: MouseEvent) => void;
    }

    let { id, label, disabled, showTick, empty, selected, focused, current, inputValue, prefixCls = cssClasses.PREFIX_OPTION, class: className, classNames, style, styles, parentClassNames, parentStyles, dataAttrs, children, onSelect, onMouseEnter }: OptionRowProps = $props();

    const rowClass = $derived([
        prefixCls,
        {
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-selected`]: selected,
            [`${prefixCls}-focused`]: focused,
            [`${prefixCls}-empty`]: empty,
        },
        parentClassNames?.item,
        className,
    ]);

    const joinStyles = (...parts: (string | undefined)[]) => parts.filter(Boolean).join('; ') || undefined;

    const handleClick = (event: MouseEvent) => {
        if (!disabled) {
            onSelect?.(event);
        }
    };
</script>

{#if empty}
    <div class={rowClass} {style} x-semi-prop="emptyContent">
        {@render children?.()}
    </div>
{:else}
    <!-- keyboard selection stays on the combobox through aria-activedescendant, so the option takes no focus -->
    <div {...dataAttrs} aria-disabled={disabled ? 'true' : 'false'} aria-selected={selected || current ? 'true' : 'false'} class={rowClass} {id} role="option" style={joinStyles(parentStyles?.item, style)} onclick={handleClick} onmouseenter={onMouseEnter}>
        {#if showTick}
            <div class={[`${prefixCls}-icon`, parentClassNames?.itemIcon, classNames?.icon]} style={joinStyles(parentStyles?.itemIcon, styles?.icon)}>
                <IconTick />
            </div>
        {/if}
        {#if children}
            {@render children()}
        {:else if label !== undefined}
            <div class={[`${prefixCls}-text`, parentClassNames?.itemContent, classNames?.content]} style={joinStyles(parentStyles?.itemContent, styles?.content)}>
                {#if inputValue}
                    <Highlight classNames={{ highlight: `${prefixCls}-keyword` }} searchWords={[inputValue]} sourceString={String(label)} />
                {:else}
                    {label}
                {/if}
            </div>
        {/if}
    </div>
{/if}
