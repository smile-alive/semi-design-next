<script lang="ts">
    import { Chat, type ChatMessage } from '@fibrae/semi-ai-svelte';
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Form, FormInput, FormUpload, type FileItem, type FormApi } from '@fibrae/semi-ui-svelte';

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

    const commonOuterStyle = 'border: 1px solid var(--semi-color-border); border-radius: 16px; height: 500px';
    const inputStyle = 'display: flex; flex-direction: column; border: 1px solid var(--semi-color-border); margin: 8px 16px; border-radius: 8px; padding: 8px';
    const uploadProps = { action: 'https://api.semi.design/upload' };

    let id = 0;
    const getId = () => `id-${id++}`;

    let message = $state<ChatMessage[]>([
        {
            role: 'system',
            id: '1',
            createAt: 1715676751919,
            content: "Hello, I'm your AI assistant.",
        },
    ]);

    type Send = (content?: string, attachment?: FileItem[]) => void;

    let formApi: FormApi<InputValues> | undefined;

    const onMessageSend = () => {
        const newAssistantMessage: ChatMessage = {
            role: 'assistant',
            id: getId(),
            content: 'This is a mock response',
        };
        setTimeout(() => {
            message = [...message, newAssistantMessage];
        }, 200);
    };

    const submit = (onSend: Send) => {
        if (!formApi) {
            return;
        }
        const values = formApi.getValues();
        if ((values.name && values.name.length !== 0) || (values.file && values.file.length !== 0)) {
            onSend(values.name, values.file);
            formApi.reset();
        }
    };
</script>

<Chat bind:chats={message} {onMessageSend} roleConfig={roleInfo} style={commonOuterStyle} {uploadProps}>
    {#snippet inputArea(props)}
        <div style={inputStyle}>
            <Form getFormApi={(api) => (formApi = api)}>
                <strong>输入信息</strong>
                <FormInput field="name" label="名称（Input）" style="width: 250px" trigger="blur" />
                <FormUpload action={uploadProps.action} field="file" label="文档">
                    <Button theme="light">
                        {#snippet icon()}
                            <IconUpload />
                        {/snippet}
                        点击上传
                    </Button>
                </FormUpload>
            </Form>
            <Button style="width: fit-content" onclick={() => submit(props.onSend)}>提交</Button>
        </div>
    {/snippet}
</Chat>
