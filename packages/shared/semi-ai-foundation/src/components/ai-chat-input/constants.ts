import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base';

const PREFIX = `${BASE_CLASS_PREFIX}-aiChatInput`;

export const cssClasses = {
    PREFIX,
    // The foundation checks whether focus is inside it
    FOOTER_CONFIGURE: `${PREFIX}-footer-configure`,
};

/** Keys of `classNames` and `styles`; the root element takes `className` and `style` */
export type AIChatInputPart = 'templates';

export const strings = {
    // Key of the status extension's editor storage, read by the foundation
    STATUS_EXTENSION_NAME: 'SemiAIChatInput' as const,
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
