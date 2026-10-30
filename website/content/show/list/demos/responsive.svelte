<script lang="ts">
    import { Button, ButtonGroup, Descriptions, List, ListItem, Rating } from '@fibrae/semi-ui-svelte';

    const data = [
        { title: '审核管理平台', rating: 4.5, feedbacks: 124 },
        { title: '扁鹊', rating: 4, feedbacks: 108 },
        { title: '直播审核平台', rating: 3.5, feedbacks: 244 },
        { title: '抖音安全测试', feedbacks: 189 },
        { title: '内容平台', rating: 3, feedbacks: 128 },
        { title: '策略平台', rating: 4, feedbacks: 156 },
    ];

    const grid = { gutter: 12, xs: 0, sm: 0, md: 12, lg: 8, xl: 8, xxl: 6 };

    const style = 'border: 1px solid var(--semi-color-border); background-color: var(--semi-color-bg-2); border-radius: 3px; padding-left: 20px; margin: 8px 2px';
</script>

<div>
    <List dataSource={data} {grid}>
        {#snippet item({ item: entry })}
            <ListItem {style}>
                <div>
                    <h3 style="color: var(--semi-color-text-0); font-weight: 500">{entry.title}</h3>
                    <Descriptions align="center" data={[{ key: '满意度' }, { key: '反馈数', value: entry.feedbacks }]} row size="small">
                        {#snippet value({ index, item: field })}
                            {#if index === 0}
                                <Rating allowHalf size="small" value={entry.rating} />
                            {:else}
                                {field.value}
                            {/if}
                        {/snippet}
                    </Descriptions>
                    <div style="margin: 12px 0; display: flex; justify-content: flex-end">
                        <ButtonGroup style="margin-top: 8px" theme="borderless">
                            <Button>编辑</Button>
                            <Button>更多</Button>
                        </ButtonGroup>
                    </div>
                </div>
            </ListItem>
        {/snippet}
    </List>
</div>
