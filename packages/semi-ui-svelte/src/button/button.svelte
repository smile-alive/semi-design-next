<script lang="ts">
    import { onMount } from 'svelte';
    import { cssClasses, strings } from '@fibrae/semi-foundation/button/constants';
    import { buttonClassList, colorfulFill, groupLineClass, isAILoading, paddingSides, resolveButtonLooks } from '@fibrae/semi-foundation/button/utils';
    import { joinIds } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/button/button.scss';
    import '@fibrae/semi-foundation/button/icon-button.scss';
    import { IconAILoading } from '@fibrae/semi-icons-svelte';
    import useDefaultProps from '../_base/use-default-props.js';
    import { getInputGroupInScope } from '../input/context.js';
    import SpinIcon from '../spin/icon.svelte';
    import type { TriggerBinding } from '../tooltip/context.js';
    import useTrigger from '../tooltip/use-trigger.svelte.js';
    import { getButtonGroupContext } from './context.js';
    import type { ButtonProps } from './interface.js';

    const defaults = useDefaultProps('Button');

    // size, type, theme, disabled and colorful have no fallback here: they resolve own value -> ButtonGroup -> global
    // default below, and a fallback would make every button look like it was given a value and hide the group's
    let {
        block = defaults('block', false),
        colorful,
        contentClassName = defaults('contentClassName'),
        disabled,
        htmlType = defaults('htmlType', 'button'),
        iconPosition = defaults('iconPosition', strings.DEFAULT_ICON_POSITION),
        loading = defaults('loading', false),
        noHorizontalPadding = defaults('noHorizontalPadding', false),
        size,
        theme,
        type,
        children,
        icon,
        ...rest
    }: ButtonProps = $props();

    const group = getButtonGroupContext();

    let root = $state<HTMLButtonElement>();

    const inputGroup = getInputGroupInScope();

    // Told by an enclosing Tooltip whose span wraps this button: a loading button keeps the popup's description and
    // state itself, and one the span answers for ignores the pointer
    const bindTrigger = useTrigger(
        () => root,
        () => ({ disabled: looks.disabled, loading: spinning, block })
    );

    const prefix = cssClasses.PREFIX;

    // A ButtonGroup has already folded the InputGroup into the looks it publishes, so the InputGroup only counts outside one
    const looks = $derived(
        resolveButtonLooks({ disabled, size, type, theme, colorful }, group ?? inputGroup, {
            disabled: defaults('disabled'),
            size: defaults('size'),
            type: defaults('type'),
            theme: defaults('theme'),
            colorful: defaults('colorful'),
        })
    );

    const iconLayout = $derived(Boolean(icon) || (loading && !looks.disabled));
    const iconOnly = $derived(iconLayout && !children);
    const spinning = $derived(loading && !looks.disabled);
    const fill = $derived(looks.colorful ? colorfulFill(looks.theme, looks.type, looks.disabled) : undefined);
    const sides = $derived(iconLayout ? paddingSides(noHorizontalPadding) : []);

    const tooltip = $derived.by(() => {
        const { pointerEventsNone, ...aria }: Partial<TriggerBinding> = bindTrigger() ?? {};
        return { aria, pointerEventsNone: Boolean(pointerEventsNone) };
    });

    // Only known once the group's buttons have mounted, so the server-rendered group has no separators until hydration.
    // Upgrade condition: a first frame with separators needs the group to see its children, which Svelte snippets do not allow.
    const line = $derived(group && root && group.hasNext(root) ? groupLineClass(prefix, looks) : undefined);

    // A loading button stays focusable, so its click is stopped in the capture phase, before the consumer's own capture
    // listener and the delegated onclick; preventDefault blocks form submit, which pointer-events cannot do for Enter or Space.
    const guardLoadingClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
        if (loading) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        rest.onclickcapture?.(event);
    };

    onMount(() => {
        const button = root as HTMLButtonElement;
        group?.add(button);
        return () => group?.remove(button);
    });
</script>

{#snippet iconPart()}
    {#if spinning}
        {#if isAILoading(looks.theme, looks.type, looks.colorful)}
            <IconAILoading class={`${prefix}-content-loading-icon`} />
        {:else}
            <SpinIcon />
        {/if}
    {:else}
        {@render icon?.({ fill })}
    {/if}
{/snippet}

{#snippet textPart()}
    <span
        class={{
            [`${prefix}-content-left`]: iconPosition === 'right',
            [`${prefix}-content-right`]: iconPosition === 'left',
        }}
        x-semi-prop="children"
    >
        {@render children?.()}
    </span>
{/snippet}

<button
    bind:this={root}
    {...tooltip.aria}
    {...rest}
    aria-describedby={joinIds(rest['aria-describedby'], tooltip.aria['aria-describedby'])}
    aria-disabled={looks.disabled || loading || undefined}
    class={[buttonClassList(prefix, looks, { block, withIcon: iconLayout, iconOnly, loading: spinning }), rest.class]}
    disabled={looks.disabled}
    style={[rest.style, ...sides.map((side) => `padding-${side}: 0`), tooltip.pointerEventsNone && 'pointer-events: none'].filter(Boolean).join(';') || undefined}
    type={htmlType}
    onclickcapture={guardLoadingClick}
>
    <span class={[`${prefix}-content`, contentClassName]} x-semi-prop={iconLayout ? undefined : 'children'}>
        {#if iconLayout}
            {#if iconPosition === 'left' || iconOnly}
                {@render iconPart()}
            {/if}
            {#if children}
                {@render textPart()}
            {/if}
            {#if iconPosition !== 'left' && !iconOnly}
                {@render iconPart()}
            {/if}
        {:else}
            {@render children?.()}
        {/if}
    </span>
</button>{#if line}
    <span class={line}></span>
{/if}
