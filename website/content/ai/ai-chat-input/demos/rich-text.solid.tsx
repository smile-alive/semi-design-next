import { For, createSignal } from 'solid-js';
import { AIChatInput, type AIChatInputElement } from '@fibrae/semi-ai-solid';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: '12px' };
const temp = {
    'input-slot': '我是一个<input-slot placeholder="[职业]">程序员</input-slot>',
    'select-slot': `我是<select-slot value="前端开发" options='["设计","前端开发","后端开发"]'></select-slot>，帮我完成...`,
    'skill-slot': `<skill-slot data-label="AI Coding" data-value="AI Coding" data-template=false></skill-slot> 帮我完成...`,
};
const tabs = Object.keys(temp) as Array<keyof typeof temp>;

export default function AIChatInputDemo() {
    const [activeIndex, setActiveIndex] = createSignal(0);
    let input: AIChatInputElement | undefined;

    const setTemplate = (index: number) => {
        setActiveIndex(index);
        input?.setContent(temp[tabs[index]]);
        input?.focusEditor();
    };

    return (
        <>
            <div class="aiChatInput-radio" role="tablist">
                <For each={tabs}>
                    {(item, index) => (
                        <div
                            class={`aiChatInput-radio-item ${index() === activeIndex() ? 'aiChatInput-radio-item-selected' : ''}`}
                            role="tab"
                            aria-selected={index() === activeIndex()}
                            tabIndex={0}
                            onClick={() => setTemplate(index())}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setTemplate(index());
                                }
                            }}
                        >
                            {item}
                        </div>
                    )}
                </For>
            </div>
            <AIChatInput ref={(element) => (input = element)} defaultContent={temp['input-slot']} placeholder="输入内容或者上传内容" uploadProps={uploadProps} style={outerStyle} />
        </>
    );
}
