<script lang="ts">
    // aliased: the generated declaration names this component `Table` after its file
    import { Table as SemiTable, type TableProps } from '../../table/index.js';
    import type { MarkdownRenderElementProps } from '../interface.js';
    import MarkdownChildren from '../markdown-children.svelte';
    import { parseTable } from './tree.js';

    // the cells come from `node`, so the children snippet is dropped
    const { children: _children, node, ...rest }: TableProps & MarkdownRenderElementProps = $props();

    const parsed = $derived(parseTable(node?.props.children));
</script>

<!-- a chat message must not hide rows behind the default 10-row pagination -->
<SemiTable columns={parsed.columns} dataSource={parsed.dataSource} pagination={false} {...rest}>
    {#snippet headerCell({ column })}
        <MarkdownChildren content={parsed.head[Number(column.dataIndex)]} />
    {/snippet}
    {#snippet cell({ column, record })}
        <MarkdownChildren content={parsed.body[Number(record.key)]?.[Number(column.dataIndex)]} />
    {/snippet}
</SemiTable>
