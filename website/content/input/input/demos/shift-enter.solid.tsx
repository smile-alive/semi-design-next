import { createSignal } from 'solid-js';
import { HotKeys, TextArea } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    const [text, setText] = createSignal('');

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
        }
    };

    return (
        <>
            <div id="input-shift-enter-hint" style={{ display: 'flex' }}>
                使用
                <HotKeys hotKeys={['shift', 'enter']} style={{ 'margin-bottom': '12px', 'margin-left': '4px', 'margin-right': '4px' }} />
                换行的 TextArea
            </div>
            <TextArea aria-labelledby="input-shift-enter-hint" value={text()} onChange={(value) => setText(value)} onKeyDown={handleKeyDown} />
        </>
    );
}
