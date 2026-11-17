<script lang="ts">
    import { Pagination } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Pagination aria-label="Page sizes 50 to 200" pageSizeOpts={[50, 80, 90, 200]} showSizeChanger style="margin-block-end: 12px" total={300} />
    <Pagination aria-label="Page sizes 10 to 200" pageSizeOpts={[10, 20, 50, 200]} showSizeChanger total={300} />
</div>
