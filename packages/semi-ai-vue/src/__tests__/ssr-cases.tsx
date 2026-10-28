/** @jsxImportSource vue */
import type { SsrCase } from '@test/utils/vue.ssr';
import { AIChatDialogue, AIChatInput, Annotation, Chat, MCPConfigure, Sidebar } from '..';

const messages = [
    { id: '1', role: 'user', content: 'hello' },
    { id: '2', role: 'assistant', content: '**bold** reply' },
];
const roleConfig = {
    user: { name: 'User' },
    assistant: { name: 'Assistant' },
};
const mcpOptions = [{ value: 'm1', label: 'tool', configure: true }];

export const ssrCases: SsrCase[] = [
    { name: 'chat/基本', covers: ['Chat'], render: () => <Chat chats={messages} roleConfig={roleConfig} /> },
    { name: 'ai-chat-dialogue/基本', covers: ['AIChatDialogue'], render: () => <AIChatDialogue chats={messages} roleConfig={roleConfig} /> },
    { name: 'ai-chat-input/基本', covers: ['AIChatInput'], render: () => <AIChatInput /> },
    { name: 'sidebar/基本', covers: ['Sidebar'], render: () => <Sidebar visible={false} options={[]} /> },
    { name: 'sidebar/annotation 基本', covers: ['Annotation'], render: () => <Annotation visible={false} /> },
    { name: 'sidebar/mcp-configure 基本', covers: ['MCPConfigure'], render: () => <MCPConfigure visible={false} options={mcpOptions} /> },
    // Open containers record the focused element before mount, which must not touch document on the server
    { name: 'sidebar/默认打开', covers: ['Sidebar'], render: () => <Sidebar visible options={[]} /> },
    { name: 'sidebar/annotation 默认打开', covers: ['Annotation'], render: () => <Annotation visible /> },
    { name: 'sidebar/mcp-configure 默认打开', covers: ['MCPConfigure'], render: () => <MCPConfigure visible options={mcpOptions} /> },
];

// Data-adapter functions are plain helpers
export const nonComponentExports = new Set(['getConfigureItem', 'chatCompletionToMessage', 'streamingChatCompletionToMessage', 'streamingResponseToMessage', 'responseToMessage', 'chatInputToMessage', 'chatInputToChatCompletion']);
