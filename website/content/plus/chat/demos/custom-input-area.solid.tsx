import { type JSX, createSignal } from 'solid-js';
import { Chat, type ChatMessage as Message, type ChatRenderInputAreaProps as RenderInputAreaProps } from '@fibrae/semi-ai-solid';
import { IconUpload } from '@fibrae/semi-icons-solid';
import { Button, Form, type FileItem, type FormApi, FormInput, FormUpload } from '@fibrae/semi-ui-solid';

interface InputValues {
    name?: string;
    file?: FileItem[];
}

const defaultMessage: Message[] = [
    {
        role: 'system',
        id: '1',
        createAt: 1715676751919,
        content: "Hello, I'm your AI assistant.",
    },
];

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
    'border-radius': '16px',
    height: '500px',
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

const inputStyle: JSX.CSSProperties = {
    display: 'flex',
    'flex-direction': 'column',
    border: '1px solid var(--semi-color-border)',
    margin: '8px 16px',
    'border-radius': '8px',
    padding: '8px',
};

function CustomInputRender(props: RenderInputAreaProps) {
    let api: FormApi<InputValues> | undefined;

    const onSubmit = () => {
        if (api) {
            const values = api.getValues();
            if ((values.name && values.name.length !== 0) || (values.file && values.file.length !== 0)) {
                props.onSend?.(values.name, values.file);
                api.reset();
            }
        }
    };

    return (
        <div style={inputStyle}>
            <Form getFormApi={(formApi) => (api = formApi)}>
                <strong>输入信息</strong>
                <FormInput field="name" label="名称（Input）" style={{ width: '250px' }} trigger="blur" />
                <FormUpload field="file" label="文档" action="https://api.semi.design/upload">
                    <Button icon={<IconUpload />} theme="light">
                        点击上传
                    </Button>
                </FormUpload>
            </Form>
            <Button style={{ width: 'fit-content' }} onClick={onSubmit}>
                提交
            </Button>
        </div>
    );
}

export default function ChatDemo() {
    const [chats, setChats] = createSignal<Message[]>(defaultMessage);

    const onMessageSend = () => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            content: `This is a mock response`,
        };
        setTimeout(() => {
            setChats((list) => [...list, newAssistantMessage]);
        }, 200);
    };

    return <Chat renderInputArea={CustomInputRender} style={commonOuterStyle} chats={chats()} roleConfig={roleInfo} onChatsChange={(next) => setChats(next)} onMessageSend={onMessageSend} uploadProps={uploadProps} />;
}
