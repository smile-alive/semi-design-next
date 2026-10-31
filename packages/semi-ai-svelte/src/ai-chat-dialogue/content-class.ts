import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import DialogueFoundation, { type Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';

const { PREFIX_CONTENT } = cssClasses;

export default function contentClass({ role, status }: Message, mode: string) {
    const { bubble, user, error } = DialogueFoundation.getContentFlags(role, status, mode);
    return [PREFIX_CONTENT, bubble ? `${PREFIX_CONTENT}-${mode}` : `${PREFIX_CONTENT}-no-bubble`, user && `${PREFIX_CONTENT}-user`, error && `${PREFIX_CONTENT}-error`].filter(Boolean).join(' ');
}
