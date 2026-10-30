import AIChatDialogueBase from './ai-chat-dialogue.svelte';
import AnnotationWidget from './widgets/content-item/annotation.svelte';
import Code from './widgets/content-item/code.svelte';
import DialogueStepWidget from './widgets/content-item/dialogue-step.svelte';
import ReasoningWidget from './widgets/content-item/reasoning.svelte';

// Svelte components are functions, so the parts attach to the component itself
export const AIChatDialogue: typeof AIChatDialogueBase & {
    Reasoning: typeof ReasoningWidget;
    Step: typeof DialogueStepWidget;
    Annotation: typeof AnnotationWidget;
    defaultComponents: { code: typeof Code };
} = Object.assign(AIChatDialogueBase, {
    Reasoning: ReasoningWidget,
    Step: DialogueStepWidget,
    Annotation: AnnotationWidget,
    defaultComponents: { code: Code },
});
