import AIChatDialogue from './ai-chat-dialogue.vue';
import AnnotationWidget from './dialogue/content-item/annotation.vue';
import Code from './dialogue/content-item/code.vue';
import DialogueStepWidget from './dialogue/content-item/dialogue-step.vue';
import ReasoningWidget from './dialogue/content-item/reasoning.vue';

// Annotated so declaration emit refers to the SFC types instead of inlining Vue's GlobalComponents.
const AIChatDialogueWithParts: typeof AIChatDialogue & {
    Reasoning: typeof ReasoningWidget;
    Step: typeof DialogueStepWidget;
    Annotation: typeof AnnotationWidget;
    defaultComponents: { code: typeof Code };
} = Object.assign(AIChatDialogue, {
    Reasoning: ReasoningWidget,
    Step: DialogueStepWidget,
    Annotation: AnnotationWidget,
    defaultComponents: { code: Code },
});
export default AIChatDialogueWithParts;
export type * from './interface';
