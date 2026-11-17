<script lang="ts">
    import { Pagination } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Pagination aria-label="Pagination of 80 items" showQuickJumper style="margin-block-end: 12px" total={80} />
    <Pagination aria-label="Pagination of 300 items" showQuickJumper total={300} />
</div>
