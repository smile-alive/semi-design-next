<script lang="ts">
    import { AutoComplete } from '@fibrae/semi-ui-svelte';

    const data = [1, 2, 3, 4];
</script>

<AutoComplete {data} disabled placeholder="禁用下拉菜单" style="width: 200px" />
