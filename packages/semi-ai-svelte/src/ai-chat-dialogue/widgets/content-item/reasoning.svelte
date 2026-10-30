<script lang="ts">
    import { untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconAISearchLevel2, IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-svelte';
    import Collapsible from '@fibrae/semi-ui-svelte/collapsible/collapsible.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';
    import MarkdownRender from '@fibrae/semi-ui-svelte/markdown-render/markdown-render.svelte';
    import type { ReasoningWidgetProps } from '../../interface.js';

    let { status, summary, content, markdownRenderProps, children, ...rest }: ReasoningWidgetProps = $props();

    const locale = useLocale('AIChatDialogue');

    // open while the model is still thinking; later status changes leave the reader's choice alone, as in React
    let isOpen = $state(untrack(() => status !== 'completed'));

    const prefixCls = cssClasses.PREFIX_REASONING;
    const text = $derived((summary?.length ? summary : (content ?? [])).map((item) => item.text).join('\n'));
</script>

<div {...rest} class={[`${prefixCls}-wrapper`, rest.class]}>
    <button aria-expanded={isOpen} class="{prefixCls}-header" type="button" onclick={() => (isOpen = !isOpen)}>
        <span class="{prefixCls}-header-prefix"><IconAISearchLevel2 /></span>
        <span class="{prefixCls}-header-title">
            {status === 'completed' ? locale().locale.reasoning.completed : locale().locale.reasoning.thinking}
        </span>
        <span class="{prefixCls}-header-suffix">
            {#if isOpen}
                <IconChevronUp />
            {:else}
                <IconChevronDown />
            {/if}
        </span>
    </button>
    <Collapsible {isOpen}>
        <div class="{prefixCls}-content">
            {#if children}
                {@render children({ content, markdownRenderProps, status, summary })}
            {:else}
                <MarkdownRender format="md" {...markdownRenderProps} raw={text} />
            {/if}
        </div>
    </Collapsible>
</div>
