import type { ComputedRef } from 'vue';
import type { Annotation, InputFile, InputImage, Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { createContext } from '@fibrae/semi-ui-vue/_base/create-context';
import type { AIChatDialogueEmits, AIChatDialogueProps } from './interface';

export type AIChatDialogueView = Required<Pick<AIChatDialogueProps, 'align' | 'disabledFileItemClick' | 'escapeHtml' | 'mode' | 'selecting' | 'showReference' | 'showReset'>> & Pick<AIChatDialogueProps, 'markdownRenderProps'>;

export interface AIChatDialogueContext {
    view: ComputedRef<AIChatDialogueView>;
    selectChange: (checked: boolean, id: string) => void;
    annotationClick: (annotations: Annotation[]) => void;
    fileClick: (file: InputFile) => void;
    imageClick: (image: InputImage) => void;
    referenceClick: (...args: AIChatDialogueEmits['referenceClick']) => void;
    messageCopy: (message: Message) => void;
    messageShare: (message: Message) => void;
    messageGoodFeedback: (message: Message) => void;
    messageBadFeedback: (message: Message) => void;
    messageReset: (message: Message) => void;
    messageEdit: (message: Message) => void;
    messageDelete: (message: Message) => void;
}

const [provideAIChatDialogueContext, useAIChatDialogueContext] = createContext<AIChatDialogueContext>('AIChatDialogue');

export { useAIChatDialogueContext, provideAIChatDialogueContext };
