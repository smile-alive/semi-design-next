import AIChatDialogue from './ai-chat-dialogue';
import { AnnotationWidget } from './widgets/content-item/annotation';
import Code from './widgets/content-item/code';
import { DialogueStepWidget } from './widgets/content-item/dialogue-step';
import { ReasoningWidget } from './widgets/content-item/reasoning';

export type * from './interface';
export type { AnnotationItemProps, AnnotationWidgetProps } from './widgets/content-item/annotation';
export type { DialogueStepWidgetProps } from './widgets/content-item/dialogue-step';
export type { ReasoningWidgetProps } from './widgets/content-item/reasoning';

export default Object.assign(AIChatDialogue, {
    Reasoning: ReasoningWidget,
    Step: DialogueStepWidget,
    Annotation: AnnotationWidget,
    defaultComponents: { code: Code },
});
