<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { IconBookOpenStroked } from '@fibrae/semi-icons-svelte';
    import { Collapse, CollapsePanel } from '@fibrae/semi-ui-svelte/collapse/index';
    import AnnotationItemView from './annotation-item.svelte';
    import type { AnnotationContentProps } from './interface.js';

    let { activeKey = $bindable(), info = [], onChange, onClick, header: groupHeader, item, ...rest }: AnnotationContentProps = $props();

    const collapseCls = cssClasses.COLLAPSE;
    const annotationCls = cssClasses.ANNOTATION;
</script>

<Collapse {...rest} bind:activeKey class={[collapseCls, rest.class]} clickHeaderToExpand={false} onChange={(next) => onChange?.(next)}>
    {#each info as group, groupIndex (group.key)}
        <CollapsePanel itemKey={group.key}>
            {#snippet header()}
                <!-- a span: Collapse renders the header inside its toggle button -->
                <span class={`${collapseCls}-header-content`}>
                    <IconBookOpenStroked />
                    {#if groupHeader}{@render groupHeader({ item: group, index: groupIndex })}{:else}{group.header}{/if}
                </span>
            {/snippet}
            <div class={`${annotationCls}-content`}>
                {#each group.annotations as cite, index (index)}
                    {#if item}
                        {@render item({ item: cite, index })}
                    {:else}
                        <AnnotationItemView item={cite} onClick={(event) => onClick?.(event, cite)} />
                    {/if}
                {/each}
            </div>
        </CollapsePanel>
    {/each}
</Collapse>
