<script setup lang="ts">
    import { AIChatInput } from '@fibrae/semi-ai-vue';
    import { IconDeleteStroked } from '@fibrae/semi-icons-vue';
    import { Divider, Button } from '@fibrae/semi-ui-vue';

    const uploadProps = { action: 'https://api.semi.design/upload' };
</script>

<template>
    <AIChatInput placeholder="输入内容或者上传内容..." style="margin: 12px" :uploadProps="uploadProps">
        <template #actionArea="{ menuItem, class: actionClass }">
            <div :class="actionClass">
                <div style="display: flex; align-items: center">
                    <Button aria-label="清空内容" style="border-radius: 50%" type="tertiary">
                        <template #icon>
                            <IconDeleteStroked />
                        </template>
                    </Button>
                    <Divider layout="vertical" style="margin-left: 8px" />
                </div>
                <component :is="node" v-for="(node, index) in menuItem" :key="index" />
            </div>
        </template>
    </AIChatInput>
</template>
