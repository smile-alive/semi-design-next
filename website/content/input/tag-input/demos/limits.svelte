<script lang="ts">
    import { TagInput, Toast } from '@fibrae/semi-ui-svelte';
</script>

<TagInput
    max={3}
    onChange={(v) => console.log(v)}
    onExceed={(v) => {
        Toast.warning('超过 max');
        console.log(v);
    }}
    placeholder="最多输入3条标签.."
/>
<TagInput
    maxLength={5}
    onChange={(v) => console.log(v)}
    onInputExceed={(v) => {
        Toast.warning('超过 maxLength');
        console.log(v);
    }}
    placeholder="单个标签长度不超过5..."
    style="margin-block-start: 12px"
/>
