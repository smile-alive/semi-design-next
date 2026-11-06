<script lang="ts">
    import { List, Pagination } from '@fibrae/semi-ui-svelte';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数'];
    const pageSize = 4;
    const getData = (current: number) => data.slice((current - 1) * pageSize, current * pageSize);
    let page = $state(1);
</script>

<div>
    <div style="margin-inline-end: 16px; width: 280px; display: flex; flex-wrap: wrap">
        <List class="component-list-demo-booklist" dataSource={getData(page)} size="small" split={false} style="border: 1px solid var(--semi-color-border); flex-basis: 100%; flex-shrink: 0">
            {#snippet item(row)}
                <List.Item class="list-item">{row.item}</List.Item>
            {/snippet}
        </List>
        <Pagination bind:currentPage={page} {pageSize} size="small" style="width: 100%; flex-basis: 100%; justify-content: center" total={data.length} />
    </div>
</div>
