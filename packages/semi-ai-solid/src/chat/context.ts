import type { Accessor } from 'solid-js';
import { createContext } from '@fibrae/semi-ui-solid/_base/create-context';
import type { ToastHookApi } from '@fibrae/semi-ui-solid/toast/index';
import type { ChatProps, Message } from './interface';

export type ChatView = Pick<ChatProps, 'align' | 'chatBoxRenderConfig' | 'customMarkDownComponents' | 'escapeHtml' | 'markdownRenderProps' | 'mode' | 'renderDivider' | 'roleConfig'>;

export interface ChatContextValue {
    view: Accessor<ChatView>;
    /** The api of the holder Chat renders beside its messages, so a toast stays inside the chat */
    toast: ToastHookApi;
    /** The message list, which takes focus when a confirmed delete removes the focused message */
    container: Accessor<HTMLDivElement | undefined>;
    likeMessage: (message: Message) => void;
    dislikeMessage: (message: Message) => void;
    resetMessage: (message: Message) => void;
    deleteMessage: (message: Message) => void;
    copyMessage: (message: Message) => void;
}

export const [ChatContext, useChatContext] = createContext<ChatContextValue>('Chat');
