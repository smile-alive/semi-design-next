<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'jianying', label: '剪映' },
    ];

    let value = $state<string | undefined>('douyin');
</script>

<Select
    bind:value
    {optionList}
/>
