<script setup lang="ts">
    import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-icons-vue/illustrations';
    import { Empty, Popover, Space, Tag } from '@fibrae/semi-ui-vue';

    const style = {
        border: '2px solid var(--semi-color-border)',
        paddingInlineStart: '4px',
        paddingInlineEnd: '4px',
        borderRadius: '4px',
    };
</script>

<template>
    <Space>
        <Popover>
            <Tag :style="style">Component</Tag>
            <template #content>
                <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                    <template #image>
                        <IllustrationSuccess :style="{ width: '150px', height: '150px' }" />
                    </template>
                    <template #darkModeImage>
                        <IllustrationSuccessDark :style="{ width: '150px', height: '150px' }" />
                    </template>
                    <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
                </Empty>
            </template>
        </Popover>
        <Popover>
            Text
            <template #content>
                <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                    <template #image>
                        <IllustrationSuccess :style="{ width: '150px', height: '150px' }" />
                    </template>
                    <template #darkModeImage>
                        <IllustrationSuccessDark :style="{ width: '150px', height: '150px' }" />
                    </template>
                    <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
                </Empty>
            </template>
        </Popover>
        <Popover>
            <span :style="style">DOM</span>
            <template #content>
                <Empty :style="{ width: '400px', margin: '0 auto', display: 'flex', padding: '20px' }" title="先进的设计 / 研发协作方式">
                    <template #image>
                        <IllustrationSuccess :style="{ width: '150px', height: '150px' }" />
                    </template>
                    <template #darkModeImage>
                        <IllustrationSuccessDark :style="{ width: '150px', height: '150px' }" />
                    </template>
                    <template #description>使用 Semi D2C 快速还原 Figma 设计稿，一键转代码</template>
                </Empty>
            </template>
        </Popover>
    </Space>
</template>
