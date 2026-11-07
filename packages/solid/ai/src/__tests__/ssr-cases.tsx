import { For } from 'solid-js';
import { IllustrationConstruction, IllustrationFailure, IllustrationIdleDark, IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-solid';
import type { SsrCase } from '@test/solid/ssr.solid';
import { AIChatDialogue, AIChatInput, Annotation, Chat, MCPConfigure, Sidebar, type ChatMessage, type AIChatDialogueMessage } from '..';
import type * as Entry from '..';

// A remote avatar's error can land after hydration and switch Avatar to its fallback; a data URL settles before the
// client modules run
const avatarSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const roleConfig = {
    user: { name: 'User', avatar: avatarSrc },
    assistant: { name: 'Assistant', avatar: avatarSrc },
    system: { name: 'System', avatar: avatarSrc },
};

const chats: ChatMessage[] = [
    { role: 'user', id: '1', createAt: 1715676751919, content: 'Question text' },
    { role: 'assistant', id: '2', createAt: 1715676751919, content: '**Answer** text' },
];

const dialogue: AIChatDialogueMessage[] = [
    { role: 'user', id: '1', content: 'Dialogue question' },
    { role: 'assistant', id: '2', content: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Dialogue answer' }] }] },
];

const annotationInfo = [{ header: 'References', key: '1', annotations: [{ order: 1, title: 'Annotation title', url: 'https://semi.design/', siteName: 'Semi Design' }] }];

const sidebarMountDiff = ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'];

export const ssrCases: SsrCase<keyof typeof Entry>[] = [
    // A sample of the illustrations, which the package's own test renders on the server only. Their SVG ids carry a
    // per-instance `{uid}`, which is where a mismatched hydration key shows first; two of one kind in a tree checks
    // that instances stay apart.
    {
        name: 'illustrations/hydration 抽样',
        covers: [],
        render: () => (
            <div>
                <IllustrationNoContent />
                <IllustrationNoContent />
                <IllustrationNoContentDark />
                <IllustrationFailure />
                <IllustrationConstruction />
                <IllustrationIdleDark />
            </div>
        ),
        html: ['<svg'],
    },
    { name: 'chat/默认', covers: ['Chat'], render: () => <Chat chats={chats} roleConfig={roleConfig} />, text: ['Question text', 'Answer'] },
    {
        name: 'chat/renderRoleAvatar 渲染头像内容',
        covers: ['Chat'],
        render: () => <Chat chats={chats} roleConfig={{ user: { name: 'User' }, assistant: { name: 'Assistant' } }} chatBoxRenderConfig={{ renderRoleAvatar: (args) => <span class="role-avatar">{args.role?.name?.[0]}</span> }} />,
        html: ['class="role-avatar"'],
    },
    {
        name: 'chat/renderChatBoxAction 只插入部分默认按钮',
        covers: ['Chat'],
        render: () => <Chat chats={chats} roleConfig={roleConfig} chatBoxRenderConfig={{ renderChatBoxAction: (args) => <div class="custom-action">{args.defaultActionsObj?.copyNode?.()}</div> }} />,
        html: ['custom-action', 'semi-chat-chatBox-action-btn'],
    },
    {
        name: 'chat/renderChatBoxTitle、Avatar、Content 插入默认节点',
        covers: ['Chat'],
        render: () => (
            <Chat
                chats={chats}
                roleConfig={roleConfig}
                chatBoxRenderConfig={{
                    renderChatBoxTitle: (args) => <div class="custom-title">{args.defaultTitle?.()}</div>,
                    renderChatBoxAvatar: (args) => <div class="custom-avatar">{args.defaultAvatar?.()}</div>,
                    renderChatBoxContent: (args) => <div class="custom-content">{args.defaultContent?.()}</div>,
                }}
            />
        ),
        html: ['custom-title', 'custom-avatar', 'custom-content', 'semi-chat-chatBox-title', 'semi-chat-chatBox-avatar'],
    },
    {
        name: 'chat/renderFullChatBox 只插入部分默认节点',
        covers: ['Chat'],
        render: () => <Chat chats={chats} roleConfig={roleConfig} chatBoxRenderConfig={{ renderFullChatBox: (args) => <div class="custom-full">{args.defaultNodes?.content?.()}</div> }} />,
        text: ['Question text'],
        html: ['custom-full', 'semi-chat-chatBox-content'],
    },
    {
        name: 'chat/renderInputArea 只插入部分默认节点',
        covers: ['Chat'],
        render: () => <Chat chats={chats} roleConfig={roleConfig} renderInputArea={(args) => <div class="custom-input-area">{args.detailProps?.inputNode?.()}</div>} />,
        html: ['custom-input-area', 'semi-chat-inputBox-inputArea'],
    },
    { name: 'ai-chat-dialogue/默认', covers: ['AIChatDialogue'], render: () => <AIChatDialogue chats={dialogue} roleConfig={roleConfig} />, text: ['Dialogue question', 'Dialogue answer'] },
    {
        name: 'ai-chat-dialogue/renderDialogueAction 插入默认按钮',
        covers: ['AIChatDialogue'],
        render: () => (
            <AIChatDialogue
                chats={dialogue}
                roleConfig={roleConfig}
                dialogueRenderConfig={{
                    renderDialogueAction: (p) => (
                        <div class="custom-action">
                            <For each={p.defaultActions}>{(action) => action()}</For>
                        </div>
                    ),
                }}
            />
        ),
        html: ['custom-action', 'semi-ai-chat-dialogue-action-btn'],
    },
    {
        name: 'ai-chat-dialogue/renderDialogueTitle、Avatar、Content 插入默认节点',
        covers: ['AIChatDialogue'],
        render: () => (
            <AIChatDialogue
                chats={dialogue}
                roleConfig={roleConfig}
                dialogueRenderConfig={{
                    renderDialogueTitle: (p) => <div class="custom-title">{p.defaultTitle?.()}</div>,
                    renderDialogueAvatar: (p) => <div class="custom-avatar">{p.defaultAvatar?.()}</div>,
                    renderDialogueContent: (p) => <div class="custom-content">{p.defaultContent?.()}</div>,
                }}
            />
        ),
        text: ['Dialogue question', 'Dialogue answer'],
        html: ['custom-title', 'custom-avatar', 'custom-content', 'semi-ai-chat-dialogue-title', 'semi-ai-chat-dialogue-avatar'],
    },
    {
        name: 'ai-chat-dialogue/renderFullDialogue 只插入部分默认节点',
        covers: ['AIChatDialogue'],
        render: () => <AIChatDialogue chats={dialogue} roleConfig={roleConfig} dialogueRenderConfig={{ renderFullDialogue: (p) => <div class="custom-full">{p.defaultNodes?.content?.()}</div> }} />,
        text: ['Dialogue question', 'Dialogue answer'],
        html: ['custom-full'],
    },
    // The editor is created on mount and fills the container the server left empty; attribute lists cannot describe a
    // subtree (docs/component-issues.md, AIChatInput)
    { name: 'ai-chat-input/默认', covers: ['AIChatInput'], render: () => <AIChatInput placeholder="Ask anything" />, mountDiff: ['*'] },
    {
        name: 'ai-chat-input/renderUploadButton 插入默认按钮',
        covers: ['AIChatInput'],
        render: () => <AIChatInput placeholder="Ask anything" renderUploadButton={(args) => <span class="custom-upload">{args.defaultNode()}</span>} />,
        html: ['custom-upload', 'footer-action-upload'],
        mountDiff: ['*'],
    },
    // the resize handle's range follows the measured layout, written after mount (Resizable)
    { name: 'sidebar/默认打开', covers: ['Sidebar'], render: () => <Sidebar visible title="Sidebar title" />, mountDiff: sidebarMountDiff },
    { name: 'sidebar/annotation 默认打开', covers: ['Annotation'], render: () => <Annotation visible info={annotationInfo} />, mountDiff: sidebarMountDiff },
    { name: 'sidebar/mcp-configure 默认打开', covers: ['MCPConfigure'], render: () => <MCPConfigure visible options={[{ label: 'Search', value: 'search', active: true }]} />, mountDiff: sidebarMountDiff },
    {
        name: 'sidebar/选项、MCP 项与参考来源分组的渲染函数',
        covers: ['Sidebar', 'MCPConfigure', 'Annotation'],
        render: () => (
            <div>
                <Sidebar visible options={[{ name: 'Code', key: 'code' }]} renderOptionIcon={(option) => <i class="option-icon">{option.key}</i>} />
                <MCPConfigure visible options={[{ label: 'Search', value: 'search' }]} renderIcon={({ option }) => <i class="mcp-icon">{option.value}</i>} renderDesc={() => <i class="mcp-desc">Custom desc</i>} />
                <Annotation visible info={annotationInfo} renderInfoHeader={(info) => <i class="info-header">{`Group ${info.key}`}</i>} />
            </div>
        ),
        text: ['Custom desc', 'Group 1'],
        html: ['class="option-icon"', 'class="mcp-icon"'],
        mountDiff: sidebarMountDiff,
    },
    {
        name: 'sidebar/隐藏时带 header 与 detail 渲染函数',
        covers: ['Sidebar'],
        render: () => (
            <div>
                <Sidebar mode="code" visible={false} renderDetailHeader={() => <i class="detail-header">Header</i>} renderDetailContent={() => <i class="detail-content">Content</i>} />
                <Sidebar.Container visible={false} renderHeader={() => <i class="container-header">Header</i>} />
            </div>
        ),
    },
];
