import type { ComputedRef } from 'vue';
import { createContext } from '@fibrae/semi-ui-vue/_base/create-context';
import type { ToastHookApi } from '@fibrae/semi-ui-vue/toast/index';
import type { ChatMessage, ChatProps } from './interface';

export type ChatView = Pick<ChatProps, 'align' | 'customMarkDownComponents' | 'escapeHtml' | 'markdownRenderProps' | 'mode' | 'roleConfig'>;

export interface ChatContext {
    view: ComputedRef<ChatView>;
    /** The api of the Holder Chat renders above its messages, so a toast stays inside the chat */
    toast: ToastHookApi;
    likeMessage: (message: ChatMessage) => void;
    dislikeMessage: (message: ChatMessage) => void;
    resetMessage: (message: ChatMessage) => void;
    deleteMessage: (message: ChatMessage) => void;
    copyMessage: (message: ChatMessage) => void;
}

const [provideChatContext, useChatContext] = createContext<ChatContext>('Chat');

export { useChatContext, provideChatContext };
