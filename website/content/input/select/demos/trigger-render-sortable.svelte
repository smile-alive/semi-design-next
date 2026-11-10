<script lang="ts">
    import { Select, TagInput, type SelectValue } from '@fibrae/semi-ui-svelte';

    let valList = $state<SelectValue>(['video', 'camera']);
    let inputVal = $state('');

    const list = [
        { value: 'video', label: '短视频' },
        { value: 'camera', label: '相机' },
        { value: 'editing', label: '剪辑' },
        { value: 'news', label: '资讯' },
    ];

    const handleSort = (currentLabels: string[]) => {
        valList = currentLabels.flatMap((item) => list.find((i) => i.label === item)?.value ?? []);
    };
</script>

<h4>可对已选项拖拽重新排序的 Select</h4>
<Select aria-label="可拖拽排序的 Select" bind:value={valList} filter multiple optionList={list} style="width: 240px">
    {#snippet trigger(selectState)}
        <div role="presentation" onkeydown={(event) => event.stopPropagation()}>
            <TagInput
                allowDuplicates={false}
                draggable
                inputValue={inputVal}
                onChange={handleSort}
                onInputChange={(word) => {
                    selectState.onSearch(word);
                    inputVal = word;
                }}
                showClear
                value={selectState.value.map((item) => String(item.label))}
            />
        </div>
    {/snippet}
</Select>
