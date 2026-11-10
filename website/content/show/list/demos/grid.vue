<script setup lang="ts">
    import { Button, ButtonGroup, Descriptions, List, Rating } from '@fibrae/semi-ui-vue';

    const data = [
        { title: 'Semi UI', rating: 4.5, feedbacks: 124 },
        { title: 'Semi Icons', rating: 4, feedbacks: 108 },
        { title: 'Semi Theme', rating: 4.5, feedbacks: 244 },
    ];

    const grid = { gutter: 12, span: 6 };

    const itemStyle = {
        border: '1px solid var(--semi-color-border)',
        backgroundColor: 'var(--semi-color-bg-2)',
        borderRadius: '3px',
        paddingInlineStart: '20px',
    };
</script>

<template>
    <div>
        <List :dataSource="data" :grid="grid">
            <template #item="row">
                <List.Item :style="itemStyle">
                    <div>
                        <h3 :style="{ color: 'var(--semi-color-text-0)', fontWeight: 500 }">{{ row.item.title }}</h3>
                        <Descriptions align="center" row size="small">
                            <Descriptions.Item>
                                <template #itemKey>满意度</template>
                                <Rating allowHalf :modelValue="row.item.rating" size="small" />
                            </Descriptions.Item>
                            <Descriptions.Item>
                                <template #itemKey>反馈数</template>
                                {{ row.item.feedbacks }}
                            </Descriptions.Item>
                        </Descriptions>
                        <div :style="{ margin: '12px 0', display: 'flex', justifyContent: 'flex-end' }">
                            <ButtonGroup :style="{ marginBlockStart: '8px' }" theme="borderless">
                                <Button>编辑</Button>
                                <Button>更多</Button>
                            </ButtonGroup>
                        </div>
                    </div>
                </List.Item>
            </template>
        </List>
    </div>
</template>
