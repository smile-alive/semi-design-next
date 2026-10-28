import { computed, normalizeClass } from 'vue';
import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import DialogueFoundation, { type Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { useAIChatDialogueContext } from './context';

const { PREFIX_CONTENT } = cssClasses;

/** The bubble classes of a message's text blocks, which the #content slot also receives as `class` */
export default function useContentClass(message: () => Message) {
    const { view } = useAIChatDialogueContext();

    return computed(() => {
        const { role, status } = message();
        const { mode } = view.value;
        const { bubble, user, error } = DialogueFoundation.getContentFlags(role, status, mode);
        return normalizeClass([PREFIX_CONTENT, bubble ? `${PREFIX_CONTENT}-${mode}` : `${PREFIX_CONTENT}-no-bubble`, { [`${PREFIX_CONTENT}-user`]: user, [`${PREFIX_CONTENT}-error`]: error }]);
    });
}
