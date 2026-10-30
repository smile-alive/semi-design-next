import BaseInputSlot, { updateInputSlotNodeView } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
import BaseSelectSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/select-slot';
import BaseSkillSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/skill-slot';
import InputSlotView from './input-slot.svelte';
import svelteNodeViewRenderer from './node-view.svelte.js';
import SelectSlotView from './select-slot.svelte';
import SkillSlotView from './skill-slot.svelte';

/** The slot extensions of one editor; their views mount with `context`, the editor component's contexts */
export default function slotExtensions(context: Map<unknown, unknown>) {
    return [
        BaseInputSlot.extend({
            addNodeView: () => svelteNodeViewRenderer(InputSlotView, context, updateInputSlotNodeView),
        }),
        BaseSelectSlot.extend({
            addNodeView: () => svelteNodeViewRenderer(SelectSlotView, context),
        }),
        BaseSkillSlot.extend({
            addNodeView: () => svelteNodeViewRenderer(SkillSlotView, context),
        }),
    ];
}
