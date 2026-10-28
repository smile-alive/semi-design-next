<script setup lang="ts">
    import { Button, ButtonGroup, Descriptions, DescriptionsItem, List, ListItem, Rating } from '@fibrae/semi-ui-vue';

    const data = [
        { title: 'Semi UI', rating: 4.5, feedbacks: 124 },
        { title: 'Semi DSM', rating: 4, feedbacks: 108 },
        { title: 'Semi D2C', rating: 4.5, feedbacks: 244 },
    ];

    const grid = { gutter: 12, span: 6 };

    const itemStyle = {
        border: '1px solid var(--semi-color-border)',
        backgroundColor: 'var(--semi-color-bg-2)',
        borderRadius: '3px',
        paddingLeft: '20px',
    };
</script>

<template>
    <div>
        <List :dataSource="data" :grid="grid">
            <template #item="{ item }">
                <ListItem :style="itemStyle">
                    <div>
                        <h3 :style="{ color: 'var(--semi-color-text-0)', fontWeight: 500 }">{{ item.title }}</h3>
                        <Descriptions align="center" row size="small">
                            <DescriptionsItem>
                                <template #itemKey>满意度</template>
                                <Rating allowHalf :modelValue="item.rating" size="small" />
                            </DescriptionsItem>
                            <DescriptionsItem>
                                <template #itemKey>反馈数</template>
                                {{ item.feedbacks }}
                            </DescriptionsItem>
                        </Descriptions>
                        <div :style="{ margin: '12px 0', display: 'flex', justifyContent: 'flex-end' }">
                            <ButtonGroup :style="{ marginTop: '8px' }" theme="borderless">
                                <Button>编辑</Button>
                                <Button>更多</Button>
                            </ButtonGroup>
                        </div>
                    </div>
                </ListItem>
            </template>
        </List>
    </div>
</template>
