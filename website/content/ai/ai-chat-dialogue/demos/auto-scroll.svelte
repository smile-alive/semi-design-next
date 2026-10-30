<script lang="ts">
    import { onDestroy } from 'svelte';
    import { AIChatDialogue, type AIChatDialogueMessage as Message } from '@fibrae/semi-ai-svelte';
    import { Button } from '@fibrae/semi-ui-svelte';

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

    let messages = $state<Message[]>([{ role: 'assistant', id: 'welcome', content: '点击下方按钮发送消息，回复会以流式方式逐步生成。' }]);
    let streaming = $state(false);
    let timer: ReturnType<typeof setInterval> | undefined;

    onDestroy(() => clearInterval(timer));

    const send = () => {
        const replyId = `reply-${Date.now()}`;
        messages = [...messages, { role: 'user', id: `user-${Date.now()}`, content: '请生成一段较长的回复' }, { role: 'assistant', id: replyId, content: '', status: 'in_progress' }];
        streaming = true;
        let length = 0;
        timer = setInterval(() => {
            length += 6;
            const done = length >= REPLY.length;
            messages = messages.map((message) => (message.id === replyId ? { ...message, content: REPLY.slice(0, length), status: done ? 'completed' : 'in_progress' } : message));
            if (done) {
                clearInterval(timer);
                streaming = false;
            }
        }, 100);
    };
</script>

<Button disabled={streaming} style="margin-bottom: 12px" onclick={send}>发送消息</Button>
<div style="height: 320px">
    <AIChatDialogue bind:chats={messages} {roleConfig} />
</div>
