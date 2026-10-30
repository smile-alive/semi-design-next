<script lang="ts">
    import { Select, TagInput, type SelectValue } from '@fibrae/semi-ui-svelte';

    let valList = $state<SelectValue>(['douyin', 'ulikecam']);
    let inputVal = $state('');

    const list = [
        { value: 'douyin', label: '抖音' },
        { value: 'ulikecam', label: '轻颜相机' },
        { value: 'jianying', label: '剪映' },
        { value: 'toutiao', label: '今日头条' },
    ];

    const handleSort = (currentLabels: string[]) => {
        valList = currentLabels.flatMap((item) => list.find((i) => i.label === item)?.value ?? []);
    };
</script>

<h4>可对已选项拖拽重新排序的 Select</h4>
<Select aria-label="可拖拽排序的 Select" bind:value={valList} filter multiple optionList={list} style="width: 240px">
    {#snippet trigger({ value, onSearch })}
        <div role="presentation" onkeydown={(event) => event.stopPropagation()}>
            <TagInput
                allowDuplicates={false}
                draggable
                inputValue={inputVal}
                onChange={handleSort}
                onInputChange={(word) => {
                    onSearch(word);
                    inputVal = word;
                }}
                showClear
                value={value.map((item) => String(item.label))}
            />
        </div>
    {/snippet}
</Select>
