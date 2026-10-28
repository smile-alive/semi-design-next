import type { Accessor } from 'solid-js';
import type { Annotation, InputFile, InputImage, Message } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { createContext } from '@fibrae/semi-ui-solid/_base/create-context';
import type { AIChatDialogueProps } from './interface';

export type AIChatDialogueView = Pick<AIChatDialogueProps, 'align' | 'dialogueRenderConfig' | 'disabledFileItemClick' | 'escapeHtml' | 'markdownRenderProps' | 'messageEditRender' | 'mode' | 'renderDialogueContentItem' | 'selecting' | 'showReference' | 'showReset'>;

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
