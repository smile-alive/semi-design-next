import { createContext } from '@fibrae/semi-ui-svelte/_base/create-context';
import type { ToastHookApi } from '@fibrae/semi-ui-svelte/toast/interface';
import type { ChatMessage, ChatProps } from './interface.js';

export type ChatView = Required<Pick<ChatProps, 'align' | 'escapeHtml' | 'mode'>> & Pick<ChatProps, 'customMarkDownComponents' | 'markdownRenderProps' | 'roleConfig'>;

export type ChatSnippets = Pick<ChatProps, 'title' | 'avatar' | 'roleAvatar' | 'content' | 'action' | 'fullChatBox'>;

/** `view` and `snippets` are read through getters, so the messages follow the chat's props */
export interface ChatContextValue {
    view: ChatView;
    snippets: ChatSnippets;
    /** The api of the Holder Chat renders above its messages, so a toast stays inside the chat */
    toast: ToastHookApi;
    likeMessage: (message: ChatMessage) => void;
    dislikeMessage: (message: ChatMessage) => void;
    resetMessage: (message: ChatMessage) => void;
    deleteMessage: (message: ChatMessage) => void;
    copyMessage: (message: ChatMessage) => void;
}

export const [getChatContext, setChatContext] = createContext<ChatContextValue>('Chat');
