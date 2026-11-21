<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/components/sidebar/constants';
    import { Collapse, CollapsePanel } from '@fibrae/semi-ui-svelte/collapse/index';
    import CollapseHeader from './collapse-header.svelte';
    import ExpandButton from './expand-button.svelte';
    import FileItem from './file-item.svelte';
    import type { FileContentProps } from './interface.js';

    let { activeKey = $bindable(), classNames, styles, files = [], onChange, onExpand, ...rest }: FileContentProps = $props();

    const collapseCls = cssClasses.COLLAPSE;
</script>

<Collapse {...rest} bind:activeKey class={[collapseCls, `${collapseCls}-file`, rest.class]} clickHeaderToExpand={false} onChange={(next) => onChange?.(next)}>
    {#each files as file (file.key)}
        {#snippet expand()}
            <ExpandButton class={classNames?.itemExpand} onClick={(event) => onExpand?.(event, file, 'file')} style={styles?.itemExpand} />
        {/snippet}
        <!-- the panel's extra sits beside the toggle button, not inside it -->
        <CollapsePanel extra={onExpand ? expand : undefined} itemKey={file.key ?? ''}>
            {#snippet header()}
                <CollapseHeader class={classNames?.itemHeader} mode="file" name={file.name} style={styles?.itemHeader} />
            {/snippet}
            <FileItem content={file.content} editable={false} extensions={file.extensions} imgUploadProps={file.imgUploadProps} name={file.name} />
        </CollapsePanel>
    {/each}
</Collapse>
