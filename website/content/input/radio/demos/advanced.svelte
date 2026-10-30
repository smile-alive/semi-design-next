<script lang="ts">
    import { Radio, type RadioChangeEvent } from '@fibrae/semi-ui-svelte';

    let checked = $state(true);
    const onChange = (e: RadioChangeEvent) => console.log('radio checked', e.target.checked);
</script>

<Radio aria-label="单选示例" bind:checked mode="advanced" name="demo-radio-advanced" {onChange}>允许取消选择</Radio>
