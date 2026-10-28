<script setup lang="ts">
    import { ref, shallowRef } from 'vue';
    import { Chat, type ChatMessage as Message } from '@fibrae/semi-ai-vue';
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Form, FormInput, FormUpload, type FileItem, type FormApi } from '@fibrae/semi-ui-vue';

    interface InputValues {
        name?: string;
        file?: FileItem[];
    }

    const roleInfo = {
        user: {
            name: 'User',
            avatar: '/assets/docs-icon.png',
        },
        assistant: {
            name: 'Assistant',
            avatar: '/assets/placeholder/logo.svg',
        },
        system: {
            name: 'System',
            avatar: '/assets/placeholder/logo.svg',
        },
    };

    const commonOuterStyle = {
        border: '1px solid var(--semi-color-border)',
        borderRadius: '16px',
        height: '500px',
    };

    const inputStyle = {
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--semi-color-border)',
        margin: '8px 16px',
        borderRadius: '8px',
        padding: '8px',
    } as const;

    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    const messages = ref<Message[]>([
        {
            role: 'system',
            id: '1',
            createAt: 1715676751919,
            content: "Hello, I'm your AI assistant.",
        },
    ]);
    type Send = (content?: string, attachment?: FileItem[]) => void;

    const formApi = shallowRef<FormApi<InputValues>>();
    const setFormApi = (api: FormApi<InputValues>) => {
        formApi.value = api;
    };

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            content: `This is a mock response`,
        };
        setTimeout(() => {
            messages.value = [...messages.value, newAssistantMessage];
        }, 200);
    };

    const submit = (onSend: Send) => {
        const api = formApi.value;
        if (!api) {
            return;
        }
        const values = api.getValues();
        if (values.name?.length || values.file?.length) {
            onSend(values.name, values.file);
            api.reset();
        }
    };
</script>

<template>
    <Chat v-model:chats="messages" :roleConfig="roleInfo" :style="commonOuterStyle" :uploadProps="uploadProps" @messageSend="onMessageSend">
        <template #inputArea="area">
            <div :style="inputStyle">
                <Form @getFormApi="setFormApi">
                    <strong>输入信息</strong>
                    <FormInput field="name" label="名称（Input）" :style="{ width: '250px' }" trigger="blur" />
                    <FormUpload :action="uploadProps.action" field="file" label="文档">
                        <Button theme="light">
                            <template #icon>
                                <IconUpload />
                            </template>
                            点击上传
                        </Button>
                    </FormUpload>
                </Form>
                <Button :style="{ width: 'fit-content' }" @click="submit(area.onSend)">提交</Button>
            </div>
        </template>
    </Chat>
</template>
