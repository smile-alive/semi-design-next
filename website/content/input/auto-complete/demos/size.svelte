<script lang="ts">
    import { AutoComplete } from '@fibrae/semi-ui-svelte';

    const data = [1, 2, 3, 4];
</script>

<div>
    <AutoComplete {data} placeholder="small" size="small" style="width: 200px" />
    <br />
    <br />
    <AutoComplete {data} placeholder="default" size="default" style="width: 200px" />
    <br />
    <br />
    <AutoComplete {data} placeholder="large" size="large" style="width: 200px" />
</div>
