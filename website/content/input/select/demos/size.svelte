<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [{ value: 'ulikecam', label: '轻颜相机' }];
</script>

<Select aria-label="small" {optionList} placeholder="请选择业务线" size="small" style="width: 180px" />
<br />
<br />
<Select aria-label="default" {optionList} placeholder="请选择业务线" style="width: 180px" />
<br />
<br />
<Select aria-label="large" {optionList} placeholder="请选择业务线" size="large" style="width: 180px" />
