import { useState, useCallback, useRef, type CSSProperties } from 'react';
import { Chat, type ChatMessage as Message, type ChatRenderInputAreaProps as RenderInputAreaProps } from '@fibrae/semi-ai-react';
import { IconUpload } from '@fibrae/semi-icons-react';
import { Form, Button, type FormApi as BaseFormApi, type FileItem } from '@fibrae/semi-ui-react';

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
    borderRadius: '16px',
    height: 500,
};

let id = 0;
function getId() {
    return `id-${id++}`;
}
const uploadProps = { action: 'https://api.semi.design/upload' };

const inputStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--semi-color-border)',
    margin: '8px 16px',
    borderRadius: 8,
    padding: 8,
};

function CustomInputRender({ onSend }: RenderInputAreaProps) {
    const api = useRef<BaseFormApi<InputValues> | null>(null);
    const onSubmit = useCallback(() => {
        if (api.current) {
            const values = api.current.getValues();
            if ((values.name && values.name.length !== 0) || (values.file && values.file.length !== 0)) {
                onSend?.(values.name, values.file);
                api.current.reset();
            }
        }
    }, [onSend]);

    return (
        <div style={inputStyle}>
            <Form getFormApi={(formApi) => (api.current = formApi)}>
                <strong>输入信息</strong>
                <Form.Input field="name" label="名称（Input）" style={{ width: 250 }} trigger="blur" />
                <Form.Upload field="file" label="文档" action="https://api.semi.design/upload">
                    <Button icon={<IconUpload />} theme="light">
                        点击上传
                    </Button>
                </Form.Upload>
            </Form>
            <Button style={{ width: 'fit-content' }} onClick={onSubmit}>
                提交
            </Button>
        </div>
    );
}

export default function ChatDemo() {
    const [message, setMessage] = useState(defaultMessage);

    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const onMessageSend = useCallback(() => {
        const newAssistantMessage: Message = {
            role: 'assistant',
            id: getId(),
            content: `This is a mock response`,
        };
        setTimeout(() => {
            setMessage((message) => [...message, newAssistantMessage]);
        }, 200);
    }, []);

    const renderInputArea = useCallback((props?: RenderInputAreaProps) => {
        return <CustomInputRender {...props} />;
    }, []);

    return <Chat renderInputArea={renderInputArea} style={commonOuterStyle} chats={message} roleConfig={roleInfo} onChatsChange={onChatsChange} onMessageSend={onMessageSend} uploadProps={uploadProps} />;
}
