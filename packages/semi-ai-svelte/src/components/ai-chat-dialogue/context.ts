import type { ClassValue } from 'svelte/elements';
import type { Annotation, InputFile, InputImage, Message, Reference } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
import { createContext } from '@fibrae/semi-ui-svelte/base';
import type { AIChatDialogueProps } from './interface.js';

export type AIChatDialogueView = Required<Pick<AIChatDialogueProps, 'align' | 'disabledFileItemClick' | 'escapeHtml' | 'mode' | 'selecting' | 'showReference' | 'showReset'>> & Pick<AIChatDialogueProps, 'classNames' | 'markdownRenderProps' | 'styles'>;

export type AIChatDialogueSnippets = Pick<AIChatDialogueProps, 'avatar' | 'title' | 'content' | 'action' | 'fullDialogue' | 'contentItem' | 'messageText' | 'messageEdit'>;

/** `view` and `snippets` are read through getters, so the messages follow the dialogue's props */
export interface AIChatDialogueContextValue {
    view: AIChatDialogueView;
    snippets: AIChatDialogueSnippets;
    selectChange: (checked: boolean, id: string) => void;
    annotationClick: (annotations: Annotation[]) => void;
    fileClick: (file: InputFile) => void;
    imageClick: (image: InputImage) => void;
    referenceClick: (item: Partial<Reference>) => void;
    messageCopy: (message: Message) => void;
    messageShare: (message: Message) => void;
    messageGoodFeedback: (message: Message) => void;
    messageBadFeedback: (message: Message) => void;
    messageReset: (message: Message) => void;
    messageEdit: (message: Message) => void;
    messageDelete: (message: Message) => void;
}

export const [getAIChatDialogueContext, setAIChatDialogueContext] = createContext<AIChatDialogueContextValue>('AIChatDialogue');

/** Read through getters, like `view` */
export interface CodePart {
    class?: ClassValue;
    style?: string;
}

// The code block is a markdown component that the markdown renderer creates, and it also works outside the dialogue
export const [getCodePartContext, setCodePartContext] = createContext<CodePart>('AIChatDialogue', { optional: true });
