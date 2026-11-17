<script lang="ts">
    import { Pagination } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Pagination aria-label="Pagination of 80 items" showSizeChanger style="margin-block-end: 12px" total={80} />
    <Pagination aria-label="Pagination of 300 items" showSizeChanger total={300} />
</div>
