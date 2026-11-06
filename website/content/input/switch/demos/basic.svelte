<script lang="ts">
    import { Switch } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Switch aria-label="a switch for demo" onChange={(checked) => console.log(checked)} />
    <br />
    <Switch aria-label="a switch for semi demo" checked onChange={(checked) => console.log(checked)} />
</div>
