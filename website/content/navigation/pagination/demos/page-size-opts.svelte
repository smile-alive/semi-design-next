<script lang="ts">
    import { Pagination } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Pagination pageSizeOpts={[50, 80, 90, 200]} showSizeChanger style="margin-bottom: 12px" total={300} />
    <Pagination pageSizeOpts={[10, 20, 50, 200]} showSizeChanger total={300} />
</div>
