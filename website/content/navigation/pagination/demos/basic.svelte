<script lang="ts">
    import { Pagination } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Pagination style="margin-bottom: 12px" total={30} />
    <Pagination style="margin-bottom: 12px" total={80} />
    <Pagination style="margin-bottom: 12px" total={200} />
    <Pagination pageSize={30} style="margin-bottom: 12px" total={80} />
</div>
