<script lang="ts">
    import { untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconChevronDown, IconChevronUp, IconStoryStroked } from '@fibrae/semi-icons-svelte';
    import watch from '@fibrae/semi-ui-svelte/_base/watch.svelte.js';
    import Collapsible from '@fibrae/semi-ui-svelte/collapsible/collapsible.svelte';
    // renamed: the generated declaration names the component DialogueStep after this file
    import type { DialogueStep as StepItem, DialogueStepWidgetProps } from '../../interface.js';

    let { steps, actionIcon, ...rest }: DialogueStepWidgetProps = $props();

    const openIndexes = new SvelteSet<number>();
    let previousLength = 0;

    const prefixCls = cssClasses.PREFIX_STEP;
    const { PREFIX_CONTENT } = cssClasses;

    const expandable = (step: StepItem) => Boolean(step.actions?.length);

    // streaming sends a new steps array per chunk: only steps added since the last render open; other choices stay
    const openAdded = (length: number) => {
        for (let i = previousLength; i < length; i++) {
            openIndexes.add(i);
        }
        previousLength = length;
    };

    const toggleOpen = (index: number) => {
        if (!openIndexes.delete(index)) {
            openIndexes.add(index);
        }
    };

    const onKeydown = (event: KeyboardEvent, index: number) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleOpen(index);
        }
    };

    untrack(() => openAdded(steps.length));

    watch(() => steps.length, openAdded);
</script>

<div {...rest} class={[`${prefixCls}-wrapper`, rest.class]}>
    {#each steps as step, stepIndex (stepIndex)}
        {#if expandable(step)}
            <div aria-expanded={openIndexes.has(stepIndex)} class={prefixCls} role="button" tabindex="0" onclick={() => toggleOpen(stepIndex)} onkeydown={(event) => onKeydown(event, stepIndex)}>
                {@render header(step, stepIndex, true)}
            </div>
        {:else}
            <div class={prefixCls}>
                {@render header(step, stepIndex, false)}
            </div>
        {/if}
        <Collapsible isOpen={openIndexes.has(stepIndex)}>
            <div class="{prefixCls}-panel">
                <div class="{prefixCls}-line"></div>
                <div class="{prefixCls}-action-wrapper">
                    {#each step.actions ?? [] as item, index (index)}
                        <div class="{prefixCls}-action">
                            <div class="{prefixCls}-action-summary">{item.summary}</div>
                            <div class="{prefixCls}-action-desc">
                                {@render actionIcon?.({ index, item, step, stepIndex })}
                                {item.description}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </Collapsible>
    {/each}
</div>

{#snippet header(step: StepItem, stepIndex: number, withSuffix: boolean)}
    <div class="{prefixCls}-prefix">
        {#if step.status === 'completed'}
            <IconStoryStroked class="{prefixCls}-completed" />
        {:else}
            <span class="{PREFIX_CONTENT}-loading">
                <span class="{PREFIX_CONTENT}-loading-item"></span>
                <span class="{PREFIX_CONTENT}-loading-item"></span>
                <span class="{PREFIX_CONTENT}-loading-item"></span>
            </span>
        {/if}
    </div>
    <div class="{prefixCls}-summary">{step.summary}</div>
    {#if withSuffix}
        <div class="{prefixCls}-suffix">
            {#if openIndexes.has(stepIndex)}
                <IconChevronUp />
            {:else}
                <IconChevronDown />
            {/if}
        </div>
    {/if}
{/snippet}
