<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];
</script>

<Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple onChange={(value) => console.log(value)} {optionList} style="width: 400px" />
<br />
<br />
<Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple onChange={(value) => console.log(value)} {optionList} placeholder="With createItem" style="width: 400px">
    {#snippet createItem({ inputValue, style })}
        <div style={`padding: 10px; ${style ?? ''}`}>Create Item：{inputValue}</div>
    {/snippet}
</Select>
