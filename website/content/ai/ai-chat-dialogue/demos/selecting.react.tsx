import { useState, useCallback, useRef, useEffect } from 'react';
import { AIChatDialogue, type AIChatDialogueHandle, type AIChatDialogueMessage as Message, type AIChatDialogueProps } from '@fibrae/semi-ai-react';
import { RadioGroup, Radio, type RadioChangeEvent } from '@fibrae/semi-ui-react';

const defaultMessages: Message[] = [
    {
        role: 'system',
        id: '1',
        createdAt: 1715676751919,
        content: "Hello, I'm your AI assistant.",
    },
    {
        role: 'user',
        id: '2',
        createdAt: 1715676751919,
        content: '给一个 Semi Design 的 Button 组件的使用示例',
    },
    {
        role: 'assistant',
        id: '3',
        createdAt: 1715676751919,
        content: "以下是一个 Semi 代码的使用示例：\n```jsx \nimport React from 'react';\nimport { Button } from '@fibrae/semi-ui-react';\n\nconst MyComponent = () => {\n  return (\n    <Button>Click me</Button>\n );\n};\nexport default MyComponent;\n```\n",
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
    const ref = useRef<AIChatDialogueHandle>(null);
    const [messages] = useState(defaultMessages);
    const [align, setAlign] = useState<AIChatDialogueProps['align']>('leftRight');
    const [select, setSelect] = useState(true);
    const [selection, setSelection] = useState('allSelect');

    useEffect(() => {
        ref.current?.selectAll();
    }, []);

    const onSelectChange = useCallback((e: RadioChangeEvent) => {
        setSelect(e.target.value);
    }, []);

    const onSelectionChange = useCallback((e: RadioChangeEvent) => {
        if (e.target.value === 'allSelect') {
            ref.current?.selectAll();
        } else {
            ref.current?.deselectAll();
        }
        setSelection(e.target.value);
    }, []);

    const onSelect = useCallback((selectionId: string[]) => {
        console.log('onSelect', selectionId);
    }, []);

    const onAlignChange = useCallback((e: RadioChangeEvent) => {
        setAlign(e.target.value);
    }, []);

    return (
        <div>
            <span style={{ display: 'flex', flexDirection: 'column', rowGap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: '10px' }}>
                    会话布局方式
                    <RadioGroup onChange={onAlignChange} value={align} type="button">
                        <Radio value="leftRight">左右分布</Radio>
                        <Radio value="leftAlign">左对齐</Radio>
                    </RadioGroup>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: '10px' }}>
                    是否开启选择
                    <RadioGroup onChange={onSelectChange} value={select} type="button">
                        <Radio value>开启</Radio>
                        <Radio value={false}>关闭</Radio>
                    </RadioGroup>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', columnGap: '10px' }}>
                    选择方式
                    <RadioGroup onChange={onSelectionChange} value={selection} type="button">
                        <Radio value="allSelect">全选</Radio>
                        <Radio value="cancelSelect">取消全选</Radio>
                    </RadioGroup>
                </span>
            </span>

            <div style={{ border: '1px solid var(--semi-color-border)', borderRadius: 12, marginTop: 10, padding: 20 }}>
                <AIChatDialogue ref={ref} align={align} mode="bubble" chats={messages} selecting={select} onSelect={onSelect} roleConfig={roleConfig} />
            </div>
        </div>
    );
}
