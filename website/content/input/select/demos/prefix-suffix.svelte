<script lang="ts">
    import { IconGift, IconVigoLogo } from '@fibrae/semi-icons-svelte';
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'movie', label: '长视频' },
    ];
</script>

<Select aria-label="Select 示例" {optionList} showClear style="width: 320px" value="camera">
    {#snippet prefix()}
        <IconVigoLogo />
    {/snippet}
</Select>
<br />
<br />
<Select aria-label="Select 示例" {optionList} showArrow={false} style="width: 320px" value="camera">
    {#snippet prefix()}
        <IconVigoLogo />
    {/snippet}
    {#snippet suffix()}
        <IconGift />
    {/snippet}
</Select>
