<script setup lang="ts">
    import { Button, ButtonGroup, Descriptions, DescriptionsItem, List, Rating } from '@fibrae/semi-ui-vue';

    const data = [
        { title: '审核管理平台', rating: 4.5, feedbacks: 124 },
        { title: '扁鹊', rating: 4, feedbacks: 108 },
        { title: '直播审核平台', rating: 3.5, feedbacks: 244 },
        { title: '抖音安全测试', feedbacks: 189 },
        { title: '内容平台', rating: 3, feedbacks: 128 },
        { title: '策略平台', rating: 4, feedbacks: 156 },
    ];

    const grid = { gutter: 12, xs: 0, sm: 0, md: 12, lg: 8, xl: 8, xxl: 6 };

    const style = {
        border: '1px solid var(--semi-color-border)',
        backgroundColor: 'var(--semi-color-bg-2)',
        borderRadius: '3px',
        paddingLeft: '20px',
        margin: '8px 2px',
    };
</script>

<template>
    <div>
        <List :dataSource="data" :grid="grid">
            <template #item="{ item }">
                <List.Item :style="style">
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
                </List.Item>
            </template>
        </List>
    </div>
</template>
