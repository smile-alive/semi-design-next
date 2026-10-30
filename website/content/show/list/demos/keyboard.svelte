<script lang="ts">
    import { List, ListItem } from '@fibrae/semi-ui-svelte';

    const list = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚'];

    let hoverIndex = $state(-1);

    const changeIndex = (offset: number) => {
        let index = hoverIndex + offset;
        if (index < 0) {
            index = list.length - 1;
        }
        if (index >= list.length) {
            index = 0;
        }
        hoverIndex = index;
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            changeIndex(-1);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            changeIndex(1);
        }
    };
</script>

<svelte:window onkeydown={onKeydown} />

<div>
    <div style="margin-right: 16px; width: 280px; display: flex; flex-wrap: wrap; border: 1px solid var(--semi-color-border)">
        <List class="component-list-demo-booklist" dataSource={list} size="small" split={false} style="flex-basis: 100%; flex-shrink: 0; border-bottom: 1px solid var(--semi-color-border)">
            {#snippet item({ item: book, index })}
                <ListItem class={index === hoverIndex ? 'component-list-demo-booklist-active-item' : undefined}>
                    {book}
                </ListItem>
            {/snippet}
        </List>
    </div>
</div>
