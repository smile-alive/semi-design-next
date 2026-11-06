import { useState, type KeyboardEvent } from 'react';
import { TextArea, HotKeys } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    const [text, setText] = useState('');

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
        }
    };

    return (
        <>
            <div id="input-shift-enter-hint" style={{ display: 'flex' }}>
                使用
                <HotKeys hotKeys={['shift', 'enter']} style={{ marginBlockEnd: 12, marginInline: 4 }} />
                换行的 TextArea
            </div>
            <TextArea aria-labelledby="input-shift-enter-hint" value={text} onChange={(value) => setText(value)} onKeyDown={handleKeyDown} />
        </>
    );
}
