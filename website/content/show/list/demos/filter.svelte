<script lang="ts">
    import { IconSearch } from '@fibrae/semi-icons-svelte';
    import { Input, List } from '@fibrae/semi-ui-svelte';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚'];

    let list = $state.raw(data);

    const onSearch = (keyword?: string) => {
        list = keyword ? data.filter((item) => item.includes(keyword)) : data;
    };
</script>

<div>
    <div style="margin-inline-end: 16px; width: 280px; display: flex; flex-wrap: wrap; border: 1px solid var(--semi-color-border)">
        <List class="component-list-demo-booklist" dataSource={list} size="small" split={false} style="flex-basis: 100%; flex-shrink: 0; border-bottom: 1px solid var(--semi-color-border)">
            {#snippet header()}
                <Input onChange={(value) => !value && onSearch()} onCompositionEnd={(event) => onSearch((event.target as HTMLInputElement).value)} placeholder="搜索">
                    {#snippet prefix()}
                        <IconSearch />
                    {/snippet}
                </Input>
            {/snippet}
            {#snippet item(row)}
                <List.Item class="list-item">{row.item}</List.Item>
            {/snippet}
        </List>
    </div>
</div>
