<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'xigua', label: '西瓜视频' },
    ];

    let value = $state<string | undefined>('xigua');
</script>

<Select aria-label="业务线" bind:value {optionList} placeholder="受控的Select" style="width: 300px" />
