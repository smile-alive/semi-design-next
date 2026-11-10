<script lang="ts">
    import { Select, Toast } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'movie', label: '长视频' },
    ];
    const onExceed = () => Toast.warning('最多只允许选择两项');
</script>

<Select aria-label="Select 示例" multiple {optionList} style="width: 320px" value={['video', 'camera']} />
<br />
<br />
<Select aria-label="Select 示例" maxTagCount={2} multiple {optionList} restTagsPopoverProps={{ position: 'top' }} showRestTagsPopover style="width: 320px" value={['video', 'camera', 'editing']} />
<br />
<br />
<Select aria-label="Select 示例" max={2} multiple {onExceed} {optionList} style="width: 320px" value={['video']} />
<br />
<br />
<Select aria-label="Select 示例" ellipsisTrigger expandRestTagsOnClick maxTagCount={2} multiple {optionList} restTagsPopoverProps={{ position: 'top' }} showRestTagsPopover style="width: 220px" value={['movie', 'camera', 'editing', 'video']} />
