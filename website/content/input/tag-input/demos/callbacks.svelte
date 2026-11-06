<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音']);
</script>

<TagInput
    bind:value
    onAdd={(tag) => {
        console.log(`onAdd，新增：${tag}`);
    }}
    onBlur={() => {
        console.log(`onBlur`);
    }}
    onChange={(tag) => {
        console.log(`onChange,当前标签数组：${tag}`);
    }}
    onFocus={() => {
        console.log(`onFocus`);
    }}
    onInputChange={(input) => {
        console.log(`onInputChange，当前输入内容：${input}`);
    }}
    onRemove={(v, i) => {
        console.log(`onRemove，移除：${v}, 序号：${i}`);
    }}
    placeholder="请输入..."
    showClear
/>
