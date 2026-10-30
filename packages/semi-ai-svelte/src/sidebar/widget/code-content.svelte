<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { Collapse, CollapsePanel } from '@fibrae/semi-ui-svelte/collapse/index';
    import CodeItem from './code-item.svelte';
    import CollapseHeader from './collapse-header.svelte';
    import ExpandButton from './expand-button.svelte';
    import type { CodeContentProps, CodeItemData } from './interface.js';

    let { activeKey = $bindable(), codes = [], onChange, onExpand, customRender, searchButton, ...rest }: CodeContentProps = $props();

    const collapseCls = cssClasses.COLLAPSE;

    const itemProps = ({ key: _key, ...item }: CodeItemData) => item;
</script>

<Collapse {...rest} bind:activeKey class={[collapseCls, `${collapseCls}-code`, rest.class]} clickHeaderToExpand={false} onChange={(next) => onChange?.(next)}>
    {#each codes as code (code.key)}
        {#snippet expand()}
            <ExpandButton onClick={(event) => onExpand?.(event, code, 'code')} />
        {/snippet}
        <!-- the panel's extra sits beside the toggle button, not inside it -->
        <CollapsePanel extra={onExpand ? expand : undefined} itemKey={code.key ?? ''}>
            {#snippet header()}
                <CollapseHeader mode="code" name={code.name} />
            {/snippet}
            <CodeItem {...itemProps(code)} {customRender} {searchButton} />
        </CollapsePanel>
    {/each}
</Collapse>
