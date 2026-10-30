<script lang="ts">
    import { omit } from 'es-toolkit';
    import { focusableSelector, stepsClasses } from '@fibrae/semi-foundation/steps/constants';
    import { getStepState } from '@fibrae/semi-foundation/steps/utils';
    import '@fibrae/semi-foundation/steps/steps.scss';
    import { IconAlertCircle, IconAlertTriangle, IconChevronRight, IconTickCircle } from '@fibrae/semi-icons-svelte';
    import { groupRole } from '../_base/group-role.js';
    import { getStepsContext } from './context.js';
    import type { StepData } from './interface.js';

    let { item, index, total }: { item: StepData; index: number; total: number } = $props();

    const steps = getStepsContext('Steps.Step');

    const prefixCls = stepsClasses.ITEM;
    const statusIcons = { error: IconAlertCircle, finish: IconTickCircle, warning: IconAlertTriangle };
    const basicIconSize = { small: 'large', default: 'extra-large' } as const;
    const attrs = $derived(omit(item, ['status', 'title', 'description', 'icon', 'onClick']));

    // `false` still counts as custom: it keeps the icon area but leaves it empty
    const customIcon = $derived(item.icon !== undefined);
    const stepNumber = $derived(steps.initial + index);
    const state = $derived(getStepState(stepNumber, steps.current, steps.status, Boolean(item.status)));
    const status = $derived(state.status ?? item.status ?? 'wait');
    const StatusIcon = $derived(status in statusIcons ? statusIcons[status as keyof typeof statusIcons] : undefined);
    const clickable = $derived(steps.clickable || Boolean(item.onClick));
    const role = $derived(clickable ? 'button' : groupRole(attrs));
    const snippetProps = $derived({ item, index });
    const plainTitle = $derived(String(item.title ?? ''));
    const plainDescription = $derived(String(item.description ?? ''));
    const hasTitle = $derived(Boolean(steps.title) || plainTitle !== '');
    const hasDescription = $derived(Boolean(steps.description) || plainDescription !== '');

    // a plain title is also the hover tooltip of a clipped one; a snippet has no text to offer
    const titleText = $derived(steps.title ? undefined : plainTitle || undefined);
    const descriptionText = $derived(steps.description ? undefined : plainDescription || undefined);

    const handleClick = (event: MouseEvent) => {
        item.onClick?.(event);
        // a click on a control inside title or description is that control's own, not a step switch
        if (event.target instanceof Element && event.target.closest(focusableSelector) === event.currentTarget) {
            steps.change(stepNumber);
        }
    };

    const handleKeydown = (event: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
        attrs.onkeydown?.(event);
        // keys typed in a focusable child (an input in the title) must not switch the step
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault(); // Space would otherwise scroll the page
            // a real click runs the click listeners and the change exactly as a pointer does
            event.currentTarget.click();
        }
    };
</script>

{#snippet titleContent()}
    {#if steps.title}{@render steps.title(snippetProps)}{:else}{item.title}{/if}
{/snippet}
{#snippet descriptionContent()}
    {#if steps.description}{@render steps.description(snippetProps)}{:else}{item.description}{/if}
{/snippet}

{#if steps.type === 'fill'}
    <div
        {...attrs}
        aria-current={state.active ? 'step' : undefined}
        class={[
            prefixCls,
            `${prefixCls}-${status}`,
            attrs.class,
            {
                [`${prefixCls}-${status}-hover`]: clickable,
                [`${prefixCls}-${status}-active`]: clickable,
                [`${prefixCls}-clickable`]: clickable,
                [`${steps.prefixCls}-next-error`]: state.nextError,
            },
        ]}
        {role}
        tabindex={clickable ? 0 : undefined}
        onclick={handleClick}
        onkeydown={handleKeydown}
    >
        <div class={[`${prefixCls}-left`, customIcon ? `${prefixCls}-icon` : `${prefixCls}-plain`, { [`${prefixCls}-icon-process`]: !customIcon && status === 'process', [`${prefixCls}-hover`]: clickable }]}>
            {#if customIcon}
                {#if item.icon}{@render item.icon()}{/if}
            {:else if StatusIcon}
                <StatusIcon size="extra-large" />
            {:else}
                {stepNumber + 1}
            {/if}
        </div>
        <div class={`${prefixCls}-content`}>
            <div class={`${prefixCls}-title`} title={titleText}>
                <span class={`${prefixCls}-title-text`}>{@render titleContent()}</span>
            </div>
            <div class={`${prefixCls}-description`} title={descriptionText}>{@render descriptionContent()}</div>
        </div>
    </div>
{:else if steps.type === 'basic'}
    <div
        {...attrs}
        aria-current={state.active ? 'step' : undefined}
        class={[
            prefixCls,
            `${prefixCls}-${status}`,
            attrs.class,
            {
                [`${prefixCls}-active`]: state.active,
                [`${prefixCls}-done`]: state.done,
                [`${prefixCls}-hover`]: clickable,
                [`${prefixCls}-clickable`]: clickable,
                [`${prefixCls}-${status}-hover`]: clickable,
                [`${steps.prefixCls}-next-error`]: state.nextError,
            },
        ]}
        {role}
        tabindex={clickable ? 0 : undefined}
        onclick={handleClick}
        onkeydown={handleKeydown}
    >
        <div class={`${prefixCls}-container`}>
            <div class={`${prefixCls}-left`}>
                <span class={[`${prefixCls}-icon`, { [`${prefixCls}-custom-icon`]: customIcon, [`${prefixCls}-icon-process`]: !customIcon && status === 'process' }]}>
                    {#if customIcon}
                        {#if item.icon}{@render item.icon()}{/if}
                    {:else if StatusIcon}
                        <StatusIcon size={basicIconSize[steps.size]} />
                    {:else}
                        <span class={`${prefixCls}-number-icon`}>{stepNumber + 1}</span>
                    {/if}
                </span>
            </div>
            <div class={`${prefixCls}-content`}>
                <div class={`${prefixCls}-title`}>
                    <div class={[`${prefixCls}-title-text`, { [`${prefixCls}-title-text-empty`]: !hasTitle }]}>{@render titleContent()}</div>
                </div>
                {#if hasDescription}
                    <div class={`${prefixCls}-description`}>{@render descriptionContent()}</div>
                {/if}
            </div>
        </div>
    </div>
{:else if steps.type === 'nav'}
    <div {...attrs} aria-current={state.active ? 'step' : undefined} class={[prefixCls, attrs.class, { [`${prefixCls}-active`]: state.active }]} {role} tabindex={clickable ? 0 : undefined} onclick={handleClick} onkeydown={handleKeydown}>
        <div class={`${prefixCls}-container`}>
            <div class={`${prefixCls}-content`}>
                <div class={`${prefixCls}-title`}>{@render titleContent()}</div>
            </div>
            {#if index !== total - 1}
                <div class={`${prefixCls}-icon`}>
                    <IconChevronRight size="small" />
                </div>
            {/if}
        </div>
    </div>
{/if}
