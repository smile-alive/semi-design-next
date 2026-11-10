import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-chat`,
    PREFIX_DIVIDER: `${BASE_CLASS_PREFIX}-chat-divider`,
    PREFIX_CHAT_BOX: `${BASE_CLASS_PREFIX}-chat-chatBox`,
    PREFIX_CHAT_BOX_ACTION: `${BASE_CLASS_PREFIX}-chat-chatBox-action`,
    PREFIX_INPUT_BOX: `${BASE_CLASS_PREFIX}-chat-inputBox`,
    PREFIX_ATTACHMENT: `${BASE_CLASS_PREFIX}-chat-attachment`,
    PREFIX_HINT: `${BASE_CLASS_PREFIX}-chat-hint`,
};

const ROLE = {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
    DIVIDER: 'divider',
} as const;

const CHAT_ALIGN = {
    LEFT_RIGHT: 'leftRight',
    LEFT_ALIGN: 'leftAlign',
} as const;

const MESSAGE_STATUS = {
    LOADING: 'loading',
    INCOMPLETE: 'incomplete',
    COMPLETE: 'complete',
    ERROR: 'error',
} as const;

export function isUnfinishedMessageStatus(status?: string) {
    return status === MESSAGE_STATUS.LOADING || status === MESSAGE_STATUS.INCOMPLETE;
}

const MODE = {
    BUBBLE: 'bubble',
    NO_BUBBLE: 'noBubble',
    USER_BUBBLE: 'userBubble',
} as const;

const SEND_HOT_KEY = {
    ENTER: 'enter',
    SHIFT_PLUS_ENTER: 'shift+enter',
} as const;

export type ChatAlign = (typeof CHAT_ALIGN)[keyof typeof CHAT_ALIGN];
export type ChatMode = (typeof MODE)[keyof typeof MODE];
export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];
export type SendHotKey = (typeof SEND_HOT_KEY)[keyof typeof SEND_HOT_KEY];

export const strings = {
    ROLE,
    CHAT_ALIGN,
    MESSAGE_STATUS,
    MODE,
    SEND_HOT_KEY,
};
