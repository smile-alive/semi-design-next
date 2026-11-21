import type { Accessor, JSX } from 'solid-js';
import type { Annotation, InputFile, InputImage, Message } from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
import { createContext } from '@fibrae/semi-ui-solid/base';
import type { AIChatDialogueProps } from './interface';

export type AIChatDialogueView = Pick<AIChatDialogueProps, 'align' | 'classNames' | 'dialogueRenderConfig' | 'disabledFileItemClick' | 'escapeHtml' | 'markdownRenderProps' | 'messageEditRender' | 'mode' | 'renderDialogueContentItem' | 'selecting' | 'showReference' | 'showReset' | 'styles'>;

export interface AIChatDialogueContextValue {
    view: Accessor<AIChatDialogueView>;
    selectChange: (checked: boolean, id: string) => void;
    annotationClick: (annotations: Annotation[]) => void;
    fileClick: (file: InputFile) => void;
    imageClick: (image: InputImage) => void;
    referenceClick: NonNullable<AIChatDialogueProps['onReferenceClick']>;
    messageCopy: (message: Message) => void;
    messageShare: (message: Message) => void;
    messageGoodFeedback: (message: Message) => void;
    messageBadFeedback: (message: Message) => void;
    messageReset: (message: Message) => void;
    messageEdit: (message: Message) => void;
    messageDelete: (message: Message) => void;
}

export const [AIChatDialogueContext, useAIChatDialogueContext] = createContext<AIChatDialogueContextValue>('AIChatDialogue');

export interface CodePart {
    class?: string;
    style?: JSX.CSSProperties | string;
}

// The code block is a markdown component that the markdown renderer creates, and it also works outside the dialogue
export const [CodePartContext, useCodePartContext] = createContext<Accessor<CodePart>>('AIChatDialogue', { optional: true });
