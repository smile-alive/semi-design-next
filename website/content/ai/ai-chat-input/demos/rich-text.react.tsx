import { useRef, useCallback, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { AIChatInput, type AIChatInputHandle } from '@fibrae/semi-ai-react';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };
const temp = {
    'input-slot': '我是一个<input-slot placeholder="[职业]">程序员</input-slot>',
    'select-slot': `我是<select-slot value="前端开发" options='["设计","前端开发","后端开发"]'></select-slot>，帮我完成...`,
    'skill-slot': `<skill-slot data-label="AI Coding" data-value="AI Coding" data-template=false></skill-slot> 帮我完成...`,
};

export default function AIChatInputDemo() {
    const [activeIndex, setActiveIndex] = useState(0);
    const ref = useRef<AIChatInputHandle>(null);

    const setTemplate = useCallback(
        (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
            const index = Number(event.target instanceof HTMLElement ? event.target.dataset.index : undefined);
            setActiveIndex(index);
            const content = Object.values(temp)[index];
            if (ref.current) {
                ref.current.setContent(content);
                ref.current.focusEditor();
            }
        },
        [ref]
    );

    return (
        <>
            <div className="aiChatInput-radio" role="tablist">
                {Object.keys(temp).map((item, index) => {
                    return (
                        <div
                            className={`aiChatInput-radio-item ${index === activeIndex ? 'aiChatInput-radio-item-selected' : ''}`}
                            key={index}
                            data-index={index}
                            role="tab"
                            aria-selected={index === activeIndex}
                            tabIndex={0}
                            onClick={setTemplate}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setTemplate(e);
                                }
                            }}
                        >
                            {item}
                        </div>
                    );
                })}
            </div>
            <AIChatInput ref={ref} defaultContent={temp['input-slot']} placeholder="输入内容或者上传内容" uploadProps={uploadProps} style={outerStyle} />
        </>
    );
}
