import { For, type JSX } from 'solid-js';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Chat from '..';
import type { FullChatBoxNodes, Message, Metadata, RenderActionProps, RenderAvatarProps, RenderContentProps, RenderInputAreaProps, RenderTitleProps } from '../interface';

const chats: Message[] = [
    { role: 'user', id: '1', createAt: 1715676751919, content: 'Question text' },
    { role: 'assistant', id: '2', createAt: 1715676751919, content: 'Answer text' },
];

it('类型：roleConfig 的 avatar 只是图片地址', () => {
    // @ts-expect-error avatar content other than an image goes through chatBoxRenderConfig.renderRoleAvatar
    const role: Metadata = { name: 'Bot', avatar: () => <b /> };
    expect(role.name).toBe('Bot');
});

it('类型：renderChatBoxAction 收到的默认按钮是渲染函数', () => {
    expectTypeOf<NonNullable<RenderActionProps['defaultActions']>>().toEqualTypeOf<(() => JSX.Element)[]>();
    expectTypeOf<NonNullable<NonNullable<RenderActionProps['defaultActionsObj']>['copyNode']>>().toEqualTypeOf<() => JSX.Element>();
});

it('renderChatBoxAction 只插入其中一个默认按钮时，只创建这一个', async () => {
    const { html, errors } = await renderServer({
        render: () => <Chat chats={chats} chatBoxRenderConfig={{ renderChatBoxAction: (args) => <div class="custom-action">{args.defaultActionsObj?.copyNode?.()}</div> }} />,
    });
    expect(errors).toEqual([]);
    expect(html.match(/class="custom-action"/g)).toHaveLength(2);
    expect(html.match(/semi-chat-chatBox-action-btn/g)).toHaveLength(2);
});

it('renderChatBoxAction 按顺序调用 defaultActions 的渲染函数', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Chat
                chats={chats.slice(1)}
                chatBoxRenderConfig={{
                    renderChatBoxAction: (args) => (
                        <div class="custom-action">
                            <For each={args.defaultActions}>{(action) => action()}</For>
                        </div>
                    ),
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    // the last assistant message: copy, like, dislike, reset and delete
    expect(html.match(/semi-chat-chatBox-action-btn/g)).toHaveLength(5);
});

it('renderRoleAvatar 在每条消息的头像里创建一次内容', async () => {
    const created: string[] = [];
    const mark = (id: string) => {
        created.push(id);
        return <i data-mark={id} />;
    };
    const roleConfig = { user: { name: 'User', avatar: 'https://semi.design/user.png' }, assistant: { name: 'Assistant' } };
    const { html, errors } = await renderServer({
        render: () => <Chat chats={chats} roleConfig={roleConfig} chatBoxRenderConfig={{ renderRoleAvatar: (args) => mark(`${args.role?.name}-${args.message?.id}`) }} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('data-mark="Assistant-2"');
    expect(created).toEqual(['User-1', 'Assistant-2']);
});

it('类型：默认节点是渲染函数', () => {
    expectTypeOf<NonNullable<RenderTitleProps['defaultTitle']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderAvatarProps['defaultAvatar']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderContentProps['defaultContent']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<FullChatBoxNodes['content']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<RenderInputAreaProps['defaultNode']>>().toEqualTypeOf<() => JSX.Element>();
    expectTypeOf<NonNullable<NonNullable<RenderInputAreaProps['detailProps']>['sendNode']>>().toEqualTypeOf<() => JSX.Element>();
});

it('renderChatBoxTitle、Avatar、Content 在插入处调用默认节点的渲染函数', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Chat
                chats={chats}
                chatBoxRenderConfig={{
                    renderChatBoxTitle: (args) => <div class="custom-title">{args.defaultTitle?.()}</div>,
                    renderChatBoxAvatar: (args) => <div class="custom-avatar">{args.defaultAvatar?.()}</div>,
                    renderChatBoxContent: (args) => <div class="custom-content">{args.defaultContent?.()}</div>,
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html.match(/class="custom-title"/g)).toHaveLength(2);
    expect(html.match(/semi-chat-chatBox-title/g)).toHaveLength(2);
    expect(html.match(/semi-chat-chatBox-avatar/g)).toHaveLength(2);
    expect(html).toContain('Answer text');
});

it('renderFullChatBox 取出默认节点但不调用时，不创建这个节点', async () => {
    const created: string[] = [];
    const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };
    const { html, errors } = await renderServer({
        render: () => (
            <Chat
                chats={chats}
                roleConfig={roleConfig}
                chatBoxRenderConfig={{
                    renderRoleAvatar: (args) => {
                        created.push(args.message?.id ?? '');
                        return <i />;
                    },
                    renderFullChatBox: (args) => {
                        const { avatar, content } = args.defaultNodes ?? {};
                        return (
                            <div class="custom-full" data-has-avatar={avatar ? '' : undefined}>
                                {content?.()}
                            </div>
                        );
                    },
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html.match(/class="custom-full"/g)).toHaveLength(2);
    expect(html).toContain('Answer text');
    expect(created).toEqual([]);
});

it('renderInputArea 只插入其中一个默认节点时，只创建这一个', async () => {
    const { html, errors } = await renderServer({
        render: () => <Chat chats={chats} renderInputArea={(args) => <div class="custom-input-area">{args.detailProps?.inputNode?.()}</div>} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('custom-input-area');
    expect(html).toContain('semi-chat-inputBox-inputArea');
    expect(html).not.toContain('semi-chat-inputBox-sendButton');
});

it('renderInputArea 的 defaultNode 是渲染函数', async () => {
    const { html, errors } = await renderServer({
        render: () => <Chat chats={chats} renderInputArea={(args) => <div class="custom-input-area">{args.defaultNode?.()}</div>} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('semi-chat-inputBox-sendButton');
});
