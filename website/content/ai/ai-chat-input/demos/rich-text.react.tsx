import { useRef, useState } from 'react';
import { AIChatInput, type AIChatInputHandle } from '@fibrae/semi-ai-react';
import { mockUpload } from '#/lib/mock-upload';

const uploadProps = { action: '/upload', customRequest: mockUpload };
const outerStyle = { margin: 12 };
const temp = {
    'input-slot': '我是一个<input-slot placeholder="[职业]">程序员</input-slot>',
    'select-slot': `我是<select-slot value="前端开发" options='["设计","前端开发","后端开发"]'></select-slot>，帮我完成...`,
    'skill-slot': `<skill-slot data-label="AI Coding" data-value="AI Coding" data-template=false></skill-slot> 帮我完成...`,
};
const names = Object.keys(temp);
const contents = Object.values(temp);

export default function AIChatInputDemo() {
    const [activeIndex, setActiveIndex] = useState(0);
    const ref = useRef<AIChatInputHandle>(null);

    const setTemplate = (index: number) => {
        setActiveIndex(index);
        ref.current?.setContent(contents[index]);
        ref.current?.focusEditor();
    };

    return (
        <>
            <div className="aiChatInput-radio" role="tablist">
                {names.map((item, index) => {
                    return (
                        <div
                            className={`aiChatInput-radio-item ${index === activeIndex ? 'aiChatInput-radio-item-selected' : ''}`}
                            key={item}
                            role="tab"
                            aria-selected={index === activeIndex}
                            tabIndex={0}
                            onClick={() => setTemplate(index)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setTemplate(index);
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
