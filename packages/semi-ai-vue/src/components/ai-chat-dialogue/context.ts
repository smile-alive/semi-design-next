import type { ClassValue, ComputedRef, StyleValue } from 'vue';
import type { Annotation, InputFile, InputImage, Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
import { createContext } from '@fibrae/semi-ui-vue/base';
import type { AIChatDialogueEmits, AIChatDialogueProps } from './interface';

export type AIChatDialogueView = Required<Pick<AIChatDialogueProps, 'align' | 'disabledFileItemClick' | 'escapeHtml' | 'mode' | 'selecting' | 'showReference' | 'showReset'>> & Pick<AIChatDialogueProps, 'classNames' | 'markdownRenderProps' | 'styles'>;

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

export const [provideAIChatDialogueContext, useAIChatDialogueContext] = createContext<AIChatDialogueContext>('AIChatDialogue');

export interface CodePart {
    class?: ClassValue;
    style?: StyleValue;
}

// The code block is a markdown component that the markdown renderer creates, and it also works outside the dialogue
export const [provideCodePart, useCodePartContext] = createContext<ComputedRef<CodePart>>('AIChatDialogue', { optional: true });
