<script lang="ts">
    import { Switch } from '@fibrae/semi-ui-svelte';

    const log = (checked: boolean) => console.log(checked);
</script>

<div>
    <Switch aria-label="示例开关" onChange={log} />
    <br />
    <Switch aria-label="示例开关，初始开启" checked onChange={log} />
</div>
