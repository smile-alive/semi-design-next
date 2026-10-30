<script lang="ts">
    import { Select, Toast } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'xigua', label: '西瓜视频' },
    ];
    const onExceed = () => Toast.warning('最多只允许选择两项');
</script>

<Select aria-label="Select 示例" multiple {optionList} style="width: 320px" value={['douyin', 'ulikecam']} />
<br />
<br />
<Select aria-label="Select 示例" maxTagCount={2} multiple {optionList} restTagsPopoverProps={{ position: 'top' }} showRestTagsPopover style="width: 320px" value={['douyin', 'ulikecam', 'jianying']} />
<br />
<br />
<Select aria-label="Select 示例" max={2} multiple {onExceed} {optionList} style="width: 320px" value={['douyin']} />
<br />
<br />
<Select aria-label="Select 示例" ellipsisTrigger expandRestTagsOnClick maxTagCount={2} multiple {optionList} restTagsPopoverProps={{ position: 'top' }} showRestTagsPopover style="width: 220px" value={['xigua', 'ulikecam', 'jianying', 'douyin']} />
