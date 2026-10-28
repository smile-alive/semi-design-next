import type { ReactElement } from 'react';
import { AIChatDialogue, AIChatInput, Annotation, Chat, MCPConfigure, Sidebar } from '../index';

export interface SsrCase {
    // `<component directory>/<scenario>`, so `-t '^(chat|sidebar)/'` selects by directory
    name: string;
    // index.ts exports this case renders; the coverage guard requires every component export in some case
    covers: string[];
    element: () => ReactElement;
    // Server HTML must contain these: first-frame content that hydration cannot catch when it is missing
    html?: string[];
}

const roleConfig = { user: { name: 'User' }, assistant: { name: 'Assistant' } };

export const ssrCases: SsrCase[] = [
    {
        name: 'chat/消息',
        covers: ['Chat'],
        element: () => (
            <Chat
                chats={[
                    { role: 'user', id: '1', content: 'hi' },
                    { role: 'assistant', id: '2', content: 'hello **world**' },
                ]}
                roleConfig={roleConfig}
            />
        ),
        html: ['hi', 'world'],
    },
    {
        name: 'ai-chat-dialogue/消息',
        covers: ['AIChatDialogue'],
        element: () => (
            <AIChatDialogue
                chats={[
                    { role: 'user', id: '1', content: 'hi' },
                    { role: 'assistant', id: '2', content: 'hello **world**', status: 'completed' },
                ]}
                roleConfig={roleConfig}
            />
        ),
        html: ['hi', 'world'],
    },
    { name: 'ai-chat-input/默认', covers: ['AIChatInput'], element: () => <AIChatInput placeholder="ask" /> },
    {
        name: 'sidebar/默认打开',
        covers: ['Sidebar'],
        element: () => (
            <Sidebar
                title="Sidebar"
                activeKey="code"
                options={[
                    { name: 'Code', key: 'code' },
                    { name: 'File', key: 'file' },
                ]}
                visible
            />
        ),
    },
    { name: 'sidebar/注释默认打开', covers: ['Annotation'], element: () => <Annotation info={[]} visible /> },
    { name: 'sidebar/MCP 配置默认打开', covers: ['MCPConfigure'], element: () => <MCPConfigure options={[{ label: 'GitHub', value: 'github', active: true }]} visible /> },
];
