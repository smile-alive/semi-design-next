import AIChatDialogue from './ai-chat-dialogue';
import { AnnotationWidget } from './dialogue/content-item/annotation';
import Code from './dialogue/content-item/code';
import { DialogueStepWidget } from './dialogue/content-item/dialogue-step';
import { ReasoningWidget } from './dialogue/content-item/reasoning';

export type * from './interface';
export type { AnnotationItemProps, AnnotationWidgetProps } from './dialogue/content-item/annotation';
export type { DialogueStepWidgetProps } from './dialogue/content-item/dialogue-step';
export type { ReasoningWidgetProps } from './dialogue/content-item/reasoning';

export default Object.assign(AIChatDialogue, {
    Reasoning: ReasoningWidget,
    Step: DialogueStepWidget,
    Annotation: AnnotationWidget,
    defaultComponents: { code: Code },
});
