<script lang="ts">
    import { TagInput, Toast } from '@fibrae/semi-ui-svelte';
</script>

<TagInput max={3} onExceed={() => Toast.warning('超过 max')} placeholder="最多输入3条标签.." />
<TagInput maxLength={5} onInputExceed={() => Toast.warning('超过 maxLength')} placeholder="单个标签长度不超过5..." style="margin-top: 12px" />
