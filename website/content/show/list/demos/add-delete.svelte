<script lang="ts">
    import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-svelte';
    import { Button, List } from '@fibrae/semi-ui-svelte';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];

    let list = $state.raw(data.slice(0, 8));

    const removeItem = (book: string) => {
        list = list.filter((entry) => entry !== book);
    };
    const addItem = () => {
        list = list.concat(data.slice(list.length, list.length + 1));
    };
</script>

<div>
    <div style="margin-right: 16px; width: 280px; display: flex; flex-wrap: wrap; border: 1px solid var(--semi-color-border)">
        <List class="component-list-demo-booklist" dataSource={list} size="small" split={false} style="flex-basis: 100%; flex-shrink: 0; border-bottom: 1px solid var(--semi-color-border)">
            {#snippet item({ item: book })}
                <li class="list-item" style="margin: 4px">
                    <Button aria-label={`删除${book}`} style="margin-right: 4px" theme="borderless" type="danger" onclick={() => removeItem(book)}>
                        {#snippet icon()}
                            <IconMinusCircle />
                        {/snippet}
                    </Button>
                    {book}
                </li>
            {/snippet}
        </List>
        <div style="margin: 4px; font-size: 14px">
            <Button aria-label="新增书籍" style="margin-right: 4px; color: var(--semi-color-info)" theme="borderless" onclick={addItem}>
                {#snippet icon()}
                    <IconPlusCircle />
                {/snippet}
            </Button>
            新增书籍
        </div>
    </div>
</div>
