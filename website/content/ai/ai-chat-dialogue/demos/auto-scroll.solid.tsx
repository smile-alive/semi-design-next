import { createSignal, onCleanup } from 'solid-js';
import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-solid';
import { Button } from '@fibrae/semi-ui-solid';

const roleConfig = {
    user: {
        name: 'User',
        avatar: '/assets/docs-icon.png',
    },
    assistant: {
        name: 'Assistant',
        avatar: '/assets/placeholder/logo.svg',
    },
};

const REPLY = '这是一段模拟的流式回复，每隔一小段时间追加几个字。回复生成期间，向上滚动（滚轮、拖动滚动条、PageUp 或方向键）会停止自动跟随，停在你滚到的位置；滚回底部后恢复跟随；发送新消息时也会回到底部。'.repeat(3);

const defaultMessages: Message[] = [{ role: 'assistant', id: 'welcome', content: '点击下方按钮发送消息，回复会以流式方式逐步生成。' }];

export default function AIChatDialogueDemo() {
    const [messages, setMessages] = createSignal(defaultMessages);
    const [streaming, setStreaming] = createSignal(false);
    let timer: ReturnType<typeof setInterval> | undefined;

    onCleanup(() => clearInterval(timer));

    const onChatsChange = (chats: Message[]) => {
        setMessages(chats);
    };

    const send = () => {
        const replyId = `reply-${Date.now()}`;
        setMessages((prev) => [...prev, { role: 'user', id: `user-${Date.now()}`, content: '请生成一段较长的回复' }, { role: 'assistant', id: replyId, content: '', status: 'in_progress' }]);
        setStreaming(true);
        let length = 0;
        timer = setInterval(() => {
            length += 6;
            const done = length >= REPLY.length;
            setMessages((prev) => prev.map((message) => (message.id === replyId ? { ...message, content: REPLY.slice(0, length), status: done ? 'completed' : 'in_progress' } : message)));
            if (done) {
                clearInterval(timer);
                setStreaming(false);
            }
        }, 100);
    };

    return (
        <>
            <Button onClick={send} disabled={streaming()} style={{ 'margin-bottom': '12px' }}>
                发送消息
            </Button>
            <div style={{ height: '320px' }}>
                <AIChatDialogue chats={messages()} roleConfig={roleConfig} onChatsChange={onChatsChange} />
            </div>
        </>
    );
}
