import AIChatDialogue from './ai-chat-dialogue';
import { AnnotationWidget } from './dialogue/content-item/annotation';
import Code from './dialogue/content-item/code';
import { DialogueStepWidget } from './dialogue/content-item/dialogue-step';
import { ReasoningWidget } from './dialogue/content-item/reasoning';

export * from '@fibrae/semi-ai-foundation/components/ai-chat-dialogue/foundation';
export * from './interface';

export default Object.assign(AIChatDialogue, {
    Reasoning: ReasoningWidget,
    Step: DialogueStepWidget,
    Annotation: AnnotationWidget,
    defaultComponents: { code: Code },
});
