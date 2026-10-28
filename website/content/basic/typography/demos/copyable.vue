<script setup lang="ts">
    import { IconSetting } from '@fibrae/semi-icons-vue';
    import { Button, TextArea, Toast, Typography } from '@fibrae/semi-ui-vue';

    const { Paragraph, Text, Numeral } = Typography;
    // fixed so the server render and the browser agree
    const timestamp = 1700000000;
</script>

<template>
    <div>
        <Paragraph copyable>点击右边的图标复制文本。</Paragraph>
        <Paragraph :copyable="{ content: 'Hello, Semi Design!' }">点击复制文本。</Paragraph>
        <Paragraph copyable @copy="Toast.success({ content: '复制文本成功' })">点击右边的图标复制文本。</Paragraph>
        时间戳:
        <Numeral copyable truncate="ceil" underline>{{ timestamp }}s</Numeral>
        <Paragraph copyable>
            自定义复制节点
            <template #copyIcon>
                <IconSetting style="color: var(--semi-color-link)" />
            </template>
        </Paragraph>
        <Paragraph :copyable="{ content: 'Custom render!' }">
            自定义复制渲染
            <template #copyAction="{ copied, copy, config }">
                <Button size="small" @click="copy">
                    <span>{{ copied ? '复制成功' : `点击复制:${config.content}` }}</span>
                </Button>
            </template>
        </Paragraph>
        <br />
        <br />
        <Text id="typography-copyable-paste" type="secondary">粘贴区域：</Text>
        <br />
        <TextArea aria-labelledby="typography-copyable-paste" autosize :rows="3" style="width: 320px; margin-top: 4px" />
    </div>
</template>
