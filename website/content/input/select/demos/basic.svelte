<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映', disabled: true },
        { value: 'xigua', label: '西瓜视频' },
    ];
</script>

<Select aria-label="业务线" {optionList} style="width: 120px" value="douyin" />
<br />
<br />
<Select aria-label="业务线" disabled optionList={optionList.filter((option) => !option.disabled)} style="width: 120px" value="douyin" />
<br />
<br />
<Select aria-label="业务线" {optionList} placeholder="请选择业务线" style="width: 120px" />
