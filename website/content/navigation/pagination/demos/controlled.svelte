<script lang="ts">
    import { Pagination } from '@fibrae/semi-ui-svelte';

    let page = $state(3);
</script>

<Pagination bind:currentPage={page} total={200} />
