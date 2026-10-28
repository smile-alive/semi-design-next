import { createSignal } from 'solid-js';
import { AIChatInput, type AIChatInputContent as Content } from '@fibrae/semi-ai-solid';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };
const suggestionTemplate = ['天气如何', '空气质量', '工作进程', '日程安排'];

export default function AIChatInputDemo() {
    const [suggestion, setSuggestion] = createSignal<string[]>([]);

    const onChange = (content: Content[]) => {
        const value = content.length && content[0].text ? content[0].text : undefined;
        if (value === undefined || value.includes('\n') || value.length >= 4) {
            setSuggestion([]);
            return;
        }
        setSuggestion(value.length ? suggestionTemplate.map((item) => `${value}，${item}`) : []);
    };

    return <AIChatInput suggestions={suggestion()} onContentChange={onChange} uploadProps={uploadProps} style={outerStyle} placeholder="输入内容，当内容长度小于 4个字符可以看到建议，使用上下按键可切换侯选项" />;
}
