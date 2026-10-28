import React, { useState, useCallback } from 'react';
import { AIChatDialogue, type AIChatDialogueMessage as Message, type AIChatDialogueAnnotation as Annotation, type DialogueContentItemRendererMap, type ReasoningWidgetProps } from '@fibrae/semi-ai-react';
import { MarkdownRender, Toast } from '@fibrae/semi-ui-react';

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

export default function AIChatDialogueDemo() {
    const [messages, setMessage] = useState(defaultMessages);
    const onChatsChange = useCallback((chats: Message[]) => {
        setMessage(chats);
    }, []);

    const userTextStyle = {
        backgroundColor: 'var(--semi-color-fill-1)',
        color: 'var(--semi-color-text-0)',
        borderRadius: '25px',
        padding: '6px 16px',
    };

    const assistantStyle = {
        color: 'var(--semi-color-text-0)',
        padding: '6px 16px',
    };

    const functionCallStyle = {
        backgroundColor: 'var(--semi-color-fill-1)',
        padding: '6px 16px',
        borderRadius: '25px',
    };

    const customRenderReasoningContent = useCallback((props: ReasoningWidgetProps) => {
        // the reasoning item also carries its annotations, which the widget props do not declare
        const { annotations = [] } = props as ReasoningWidgetProps & { annotations?: Annotation[] };
        return (
            <React.Fragment>
                <AIChatDialogue.Annotation
                    annotation={annotations}
                    description="参考资料"
                    maxCount={3}
                    onClick={(e) => {
                        e?.stopPropagation();
                        Toast.success('Ready to open the sidebar!');
                    }}
                />
                <div style={{ marginTop: '8px' }}>
                    <MarkdownRender format="md" raw={props.summary?.[0].text ?? ''} {...props.markdownRenderProps} />
                </div>
            </React.Fragment>
        );
    }, []);

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
        input_text: (item, message) => {
            if (message?.role === 'user') {
                return (
                    <div style={userTextStyle} className="userTextStyle">
                        {item.text}
                    </div>
                );
            }
            return <div style={assistantStyle}>{item.text}</div>;
        },
        reasoning: (item) => {
            return <AIChatDialogue.Reasoning {...item} customRenderer={customRenderReasoningContent} />;
        },
        default: (item, message) => {
            if (message?.role === 'user') {
                return (
                    <div style={userTextStyle} className="userTextStyle">
                        {item}
                    </div>
                );
            } else {
                return <div style={assistantStyle}>{item}</div>;
            }
        },
    };

    return <AIChatDialogue chats={messages} roleConfig={roleConfig} onChatsChange={onChatsChange} renderDialogueContentItem={customRender} />;
}
