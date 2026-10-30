<script lang="ts">
    import { Checkbox } from '@fibrae/semi-ui-svelte';
</script>

<div>
    <Checkbox aria-label="Checkbox 示例" checked={false} disabled>Unchecked Disabled</Checkbox>
    <br />
    <Checkbox aria-label="Checkbox 示例" checked disabled>Checked Disabled</Checkbox>
</div>
