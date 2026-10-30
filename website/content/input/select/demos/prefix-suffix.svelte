<script lang="ts">
    import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-svelte';
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'xigua', label: '西瓜视频' },
    ];
</script>

<Select aria-label="Select 示例" {optionList} showClear style="width: 320px" value="ulikecam">
    {#snippet prefix()}
        <IconVigoLogo />
    {/snippet}
</Select>
<br />
<br />
<Select aria-label="Select 示例" {optionList} showArrow={false} style="width: 320px" value="ulikecam">
    {#snippet prefix()}
        <IconVigoLogo />
    {/snippet}
    {#snippet suffix()}
        <IconGift />
    {/snippet}
</Select>
