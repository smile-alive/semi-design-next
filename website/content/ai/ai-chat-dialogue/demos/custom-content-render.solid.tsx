import { type JSX, createSignal } from 'solid-js';
import { AIChatDialogue, type AIChatDialogueAnnotation as Annotation, type AIChatDialogueMessage as Message, type DialogueContentItemRendererMap } from '@fibrae/semi-ai-solid';
import { MarkdownRender, Toast } from '@fibrae/semi-ui-solid';

const defaultMessages: Message[] = [
    {
        id: '1',
        role: 'user',
        content: '你好',
    },
    {
        id: '2',
        role: 'assistant',
        content: '你好呀，请问有什么可以帮助你的吗~',
        status: 'completed',
    },
    {
        id: '3',
        role: 'user',
        content: [
            {
                type: 'message',
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: '帮我生成类似的图片',
                    },
                    {
                        type: 'input_image',
                        image_url: '/assets/root-web-sites/edit-bag.jpeg',
                        file_id: 'demo-file-id',
                    },
                    {
                        type: 'input_image',
                        image_url: '/assets/root-web-sites/edit-bag.jpeg',
                        file_id: 'demo-file-id',
                    },
                ],
            },
        ],
    },
    {
        id: '4',
        role: 'assistant',
        content: [
            {
                type: 'reasoning',
                summary: [
                    {
                        type: 'summary_text',
                        text: '\n用户问需要我帮助他生成类似图片，我需要先分析图片内容，然后生成类似的图片...',
                    },
                ],
                annotations: [
                    {
                        title: 'semi.design',
                        url: 'https://semi.design/',
                        detail: 'semi design page',
                        logo: '/assets/placeholder/logo.svg',
                    },
                    {
                        title: 'semi.design',
                        url: 'https://semi.design/',
                        detail: 'semi design page',
                        logo: '/assets/placeholder/logo.svg',
                    },
                ],
                status: 'completed',
            },
            {
                type: 'function_call',
                name: 'create_travel_guide',
                arguments: '{\n"city": "北京"\n}',
                status: 'completed',
            },
        ],
        status: 'completed',
    },
];

const roleConfig = {
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

const userTextStyle: JSX.CSSProperties = {
    'background-color': 'var(--semi-color-fill-1)',
    color: 'var(--semi-color-text-0)',
    'border-radius': '25px',
    padding: '6px 16px',
};

const assistantStyle: JSX.CSSProperties = {
    color: 'var(--semi-color-text-0)',
    padding: '6px 16px',
};

const functionCallStyle: JSX.CSSProperties = {
    'background-color': 'var(--semi-color-fill-1)',
    padding: '6px 16px',
    'border-radius': '25px',
};

const customRender: DialogueContentItemRendererMap = {
    function_call: {
        create_travel_guide: (item) => {
            return (
                <div style={functionCallStyle}>
                    Function Tool Call: {item.name} {item.arguments}
                </div>
            );
        },
    },
    input_text: (item, message) =>
        message?.role === 'user' ? (
            <div style={userTextStyle} class="userTextStyle">
                {item.text}
            </div>
        ) : (
            <div style={assistantStyle}>{item.text}</div>
        ),
    reasoning: (item) => {
        // the widget takes its annotations from the item; the item is read here instead of spreading it into the props
        const annotations: Annotation[] = item.annotations ?? [];
        return (
            <AIChatDialogue.Reasoning
                status={item.status}
                summary={item.summary}
                customRenderer={() => (
                    <>
                        <AIChatDialogue.Annotation
                            annotation={annotations}
                            description="参考资料"
                            maxCount={3}
                            onClick={(e) => {
                                e.stopPropagation();
                                Toast.success('Ready to open the sidebar!');
                            }}
                        />
                        <div style={{ 'margin-top': '8px' }}>
                            <MarkdownRender format="md" raw={item.summary?.[0]?.text ?? ''} />
                        </div>
                    </>
                )}
            />
        );
    },
    default: (item, message) =>
        message?.role === 'user' ? (
            <div style={userTextStyle} class="userTextStyle">
                {item}
            </div>
        ) : (
            <div style={assistantStyle}>{item}</div>
        ),
};

export default function AIChatDialogueDemo() {
    const [messages, setMessages] = createSignal(defaultMessages);

    const onChatsChange = (chats: Message[]) => {
        setMessages(chats);
    };

    return <AIChatDialogue chats={messages()} roleConfig={roleConfig} onChatsChange={onChatsChange} renderDialogueContentItem={customRender} />;
}
