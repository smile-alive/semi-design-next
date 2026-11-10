<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑', disabled: true },
        { value: 'movie', label: '长视频' },
    ];
</script>

<Select aria-label="业务线" {optionList} style="width: 120px" value="video" />
<br />
<br />
<Select aria-label="业务线" disabled optionList={optionList.filter((option) => !option.disabled)} style="width: 120px" value="video" />
<br />
<br />
<Select aria-label="业务线" {optionList} placeholder="请选择业务线" style="width: 120px" />
