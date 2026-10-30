import { createSignal, onMount } from 'solid-js';
import { AIChatDialogue, type AIChatDialogueElement, type AIChatDialogueMessage as Message, type AIChatDialogueProps } from '@fibrae/semi-ai-solid';
import { Radio, RadioGroup, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

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

const containerStyle = { display: 'flex', 'flex-direction': 'column', 'row-gap': '8px' } as const;
const rowStyle = { display: 'flex', 'align-items': 'center', 'column-gap': '10px' } as const;
const panelStyle = { border: '1px solid var(--semi-color-border)', 'border-radius': '12px', 'margin-top': '10px', padding: '20px' } as const;

function onSelect(selectionIds: string[]) {
    console.log('onSelect', selectionIds);
}

export default function AIChatDialogueDemo() {
    let dialogue: AIChatDialogueElement | undefined;
    const [messages] = createSignal(defaultMessages);
    const [align, setAlign] = createSignal<AIChatDialogueProps['align']>('leftRight');
    const [select, setSelect] = createSignal(true);
    const [selection, setSelection] = createSignal('allSelect');

    onMount(() => {
        dialogue?.selectAll();
    });

    const onSelectChange = (e: RadioChangeEvent) => {
        setSelect(e.target.value);
    };

    const onSelectionChange = (e: RadioChangeEvent) => {
        if (e.target.value === 'allSelect') {
            dialogue?.selectAll();
        } else {
            dialogue?.deselectAll();
        }
        setSelection(e.target.value);
    };

    const onAlignChange = (e: RadioChangeEvent) => {
        setAlign(e.target.value);
    };

    return (
        <div>
            <span style={containerStyle}>
                <span style={rowStyle}>
                    会话布局方式
                    <RadioGroup onChange={onAlignChange} value={align()} type="button">
                        <Radio value="leftRight">左右分布</Radio>
                        <Radio value="leftAlign">左对齐</Radio>
                    </RadioGroup>
                </span>
                <span style={rowStyle}>
                    是否开启选择
                    <RadioGroup onChange={onSelectChange} value={select()} type="button">
                        <Radio value={true}>开启</Radio>
                        <Radio value={false}>关闭</Radio>
                    </RadioGroup>
                </span>
                <span style={rowStyle}>
                    选择方式
                    <RadioGroup onChange={onSelectionChange} value={selection()} type="button">
                        <Radio value="allSelect">全选</Radio>
                        <Radio value="cancelSelect">取消全选</Radio>
                    </RadioGroup>
                </span>
            </span>

            <div style={panelStyle}>
                <AIChatDialogue ref={(element) => (dialogue = element)} align={align()} mode="bubble" chats={messages()} selecting={select()} onSelect={onSelect} roleConfig={roleConfig} />
            </div>
        </div>
    );
}
