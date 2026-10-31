<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { cssClasses } from '@fibrae/semi-foundation/select/constants';
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
        dataAttrs?: Record<string, unknown>;
        children?: Snippet;
        onSelect?: (event: MouseEvent) => void;
        onMouseEnter?: (event: MouseEvent) => void;
    }

    let { id, label, disabled, showTick, empty, selected, focused, current, inputValue, prefixCls = cssClasses.PREFIX_OPTION, class: className, style, dataAttrs, children, onSelect, onMouseEnter }: OptionRowProps = $props();

    const rowClass = $derived([
        prefixCls,
        {
            [`${prefixCls}-disabled`]: disabled,
            [`${prefixCls}-selected`]: selected,
            [`${prefixCls}-focused`]: focused,
            [`${prefixCls}-empty`]: empty,
        },
        className,
    ]);

    const handleClick = (event: MouseEvent) => {
        if (!disabled) {
            onSelect?.(event);
        }
    };
</script>

{#if empty}
    <div class={rowClass} x-semi-prop="emptyContent">
        {@render children?.()}
    </div>
{:else}
    <!-- keyboard selection stays on the combobox through aria-activedescendant, so the option takes no focus -->
    <div {...dataAttrs} aria-disabled={disabled ? 'true' : 'false'} aria-selected={selected || current ? 'true' : 'false'} class={rowClass} {id} role="option" {style} onclick={handleClick} onmouseenter={onMouseEnter}>
        {#if showTick}
            <div class={`${prefixCls}-icon`}>
                <IconTick />
            </div>
        {/if}
        {#if children}
            {@render children()}
        {:else if label !== undefined}
            <div class={`${prefixCls}-text`}>
                {#if inputValue}
                    <Highlight highlightClassName={`${prefixCls}-keyword`} searchWords={[inputValue]} sourceString={String(label)} />
                {:else}
                    {label}
                {/if}
            </div>
        {/if}
    </div>
{/if}
