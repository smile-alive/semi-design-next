<script lang="ts">
    import { TagInput } from '@fibrae/semi-ui-svelte';

    let value = $state(['抖音']);
    let logs = $state<string[]>([]);

    const log = (message: string) => {
        logs = [message, ...logs].slice(0, 5);
    };
</script>

<TagInput
    bind:value
    onAdd={(tag) => log(`onAdd，新增：${tag}`)}
    onBlur={() => log('onBlur')}
    onChange={(tags) => log(`onChange，当前标签数组：${tags}`)}
    onFocus={() => log('onFocus')}
    onInputChange={(input) => log(`onInputChange，当前输入内容：${input}`)}
    onRemove={(removed, index) => log(`onRemove，移除：${removed}，序号：${index}`)}
    placeholder="请输入..."
    showClear
/>
<ul>
    {#each logs as message, index (index)}
        <li>{message}</li>
    {/each}
</ul>
