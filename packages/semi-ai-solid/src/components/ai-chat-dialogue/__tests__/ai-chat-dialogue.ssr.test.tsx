import type { JSX } from 'solid-js';
import { expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import AIChatDialogue from '..';
import type { FullDialogueNodes, Message, RenderAvatarProps, RenderContentProps, RenderTitleProps } from '../interface';

const roleConfig = {
    user: { name: 'User', avatar: 'https://example.com/user.png' },
    assistant: { name: 'Assistant', avatar: 'https://example.com/assistant.png' },
};

const chats: Message[] = [
    { id: '1', role: 'user', content: 'hello', status: 'completed' },
    { id: '2', role: 'assistant', content: 'world', status: 'completed' },
];

it('类型：默认节点是渲染函数', () => {
    expectTypeOf<NonNullable<RenderTitleProps['defaultTitle']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderAvatarProps['defaultAvatar']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderContentProps['defaultContent']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<FullDialogueNodes['avatar']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<FullDialogueNodes['action']>>().toEqualTypeOf<() => JSX.Element>();
});

it('renderDialogueTitle、Avatar、Content 在插入处调用默认节点的渲染函数', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <AIChatDialogue
                chats={chats}
                roleConfig={roleConfig}
                dialogueRenderConfig={{
                    renderDialogueTitle: (p) => <div class="custom-title">{p.defaultTitle?.()}</div>,
                    renderDialogueAvatar: (p) => <div class="custom-avatar">{p.defaultAvatar?.()}</div>,
                    renderDialogueContent: (p) => <div class="custom-content">{p.defaultContent?.()}</div>,
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html.match(/class="custom-title"/g)).toHaveLength(2);
    expect(html.match(/semi-ai-chat-dialogue-title/g)).toHaveLength(2);
    expect(html.match(/semi-ai-chat-dialogue-avatar/g)).toHaveLength(2);
    expect(html).toContain('world');
});

it('renderFullDialogue 只插入其中一个默认节点时，其余不创建', async () => {
    const { html, errors } = await renderServer({
        render: () => <AIChatDialogue chats={chats} roleConfig={roleConfig} dialogueRenderConfig={{ renderFullDialogue: (p) => <div class="custom-full">{p.defaultNodes?.title?.()}</div> }} />,
    });
    expect(errors).toEqual([]);
    expect(html.match(/class="custom-full"/g)).toHaveLength(2);
    expect(html.match(/semi-ai-chat-dialogue-title/g)).toHaveLength(2);
    expect(html).not.toContain('semi-ai-chat-dialogue-avatar');
    expect(html).not.toContain('semi-ai-chat-dialogue-action-btn');
});

it('renderFullDialogue 取出默认节点但不调用时，不创建这个节点', async () => {
    const messageEditRender = vi.fn<() => JSX.Element>(() => <i class="editor" />);
    const editing: Message[] = [{ id: '1', role: 'user', content: 'edit me', status: 'completed', editing: true }];
    const { html, errors } = await renderServer({
        render: () => (
            <AIChatDialogue
                chats={editing}
                roleConfig={roleConfig}
                messageEditRender={messageEditRender}
                dialogueRenderConfig={{
                    renderFullDialogue: (p) => {
                        const { content, title } = p.defaultNodes ?? {};
                        return (
                            <div class="custom-full" data-has-content={content ? '' : undefined}>
                                {title?.()}
                            </div>
                        );
                    },
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('custom-full');
    expect(messageEditRender).not.toHaveBeenCalled();
});
