<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'news', label: '资讯' },
    ];
</script>

<Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple onChange={(value) => console.log(value)} {optionList} style="width: 400px" />
<br />
<br />
<Select allowCreate aria-label="业务线" defaultActiveFirstOption filter multiple onChange={(value) => console.log(value)} {optionList} placeholder="With renderCreateItem" style="width: 400px">
    {#snippet createItem(create)}
        <div style={`padding: 10px; ${create.style ?? ''}`}>Create Item：{create.inputValue}</div>
    {/snippet}
</Select>
