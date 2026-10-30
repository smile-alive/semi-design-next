<script lang="ts">
    import { CheckboxGroup } from '@fibrae/semi-ui-svelte';

    const options = [
        { label: '抖音', value: 'abc' },
        { label: '今日头条', value: 'toutiao' },
    ];
</script>

<CheckboxGroup aria-label="CheckboxGroup 示例" direction="horizontal" {options} />
