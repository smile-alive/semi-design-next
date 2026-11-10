<script setup lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-vue';
    import { IconDeleteStroked } from '@fibrae/semi-icons-vue';
    import { Divider, Button } from '@fibrae/semi-ui-vue';
    import { mockUpload } from '#/lib/mock-upload';

    const uploadProps = { action: '/upload', customRequest: mockUpload };
</script>

<template>
    <AIChatInput placeholder="输入内容或者上传内容..." style="margin: 12px" :uploadProps="uploadProps">
        <template #actionArea="actionArea">
            <div :class="actionArea.class">
                <div style="display: flex; align-items: center">
                    <Button aria-label="清空内容" style="border-radius: 50%" type="tertiary">
                        <template #icon>
                            <IconDeleteStroked />
                        </template>
                    </Button>
                    <Divider layout="vertical" style="margin-inline-start: 8px" />
                </div>
                <component :is="node" v-for="(node, index) in actionArea.menuItem" :key="index" />
            </div>
        </template>
    </AIChatInput>
</template>
