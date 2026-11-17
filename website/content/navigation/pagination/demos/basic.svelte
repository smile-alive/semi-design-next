<script lang="ts">
    import { Pagination } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Pagination aria-label="Pagination of 30 items" style="margin-block-end: 12px" total={30} />
    <Pagination aria-label="Pagination of 80 items" style="margin-block-end: 12px" total={80} />
    <Pagination aria-label="Pagination of 200 items" style="margin-block-end: 12px" total={200} />
    <Pagination aria-label="Pagination of 80 items, 30 per page" pageSize={30} style="margin-block-end: 12px" total={80} />
</div>
