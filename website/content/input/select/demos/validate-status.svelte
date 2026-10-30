<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [{ value: 'ulikecam', label: '轻颜相机' }];
</script>

<Select aria-label="default" {optionList} style="width: 180px" />
<br />
<br />
<Select aria-label="warning" {optionList} style="width: 180px" validateStatus="warning" />
<br />
<br />
<Select aria-label="error" {optionList} style="width: 180px" validateStatus="error" />
