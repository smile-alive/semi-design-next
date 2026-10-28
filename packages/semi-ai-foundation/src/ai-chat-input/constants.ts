import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-aiChatInput`,
};

export const strings = {
    ZERO_WIDTH_CHAR: '\uFEFF',
    SKIP_ZERO_WIDTH_NORMALIZE_META: 'skipCustomTransactionPlugin',
    SEND_HOTKEY: {
        ENTER: 'enter' as const,
        SHIFT_ENTER: 'shift+enter' as const,
    },
};

export const numbers = {
    SCROLL_AMOUNT: 300,
    SKILL_MAX_HEIGHT: 270,
    TEMPLATE_MAX_HEIGHT: 500,
    SUGGESTION_MAX_HEIGHT: 270,
};
