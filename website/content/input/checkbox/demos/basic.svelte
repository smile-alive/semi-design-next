<script lang="ts">
    import { Checkbox, type CheckboxEvent } from '@fibrae/semi-ui-svelte';

    const onChange = (e: CheckboxEvent) => console.log(e);
</script>

<Checkbox aria-label="Checkbox 示例" {onChange}>Semi Design</Checkbox>
