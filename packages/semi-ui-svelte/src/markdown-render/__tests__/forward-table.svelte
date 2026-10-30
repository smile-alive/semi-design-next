<script lang="ts">
    import type { TableProps } from '../../table';
    import { table as DefaultTable } from '../components';
    import type { MarkdownRenderElementProps } from '../interface';

    const props: TableProps & MarkdownRenderElementProps = $props();
</script>

<!-- a replacement forwards `node` with the rest, and what follows the spread wins over the built-in pagination -->
<DefaultTable {...props} pagination />
