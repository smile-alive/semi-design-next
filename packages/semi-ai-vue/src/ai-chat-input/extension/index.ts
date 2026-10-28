import { VueNodeViewRenderer } from '@tiptap/vue-3';
import BaseInputSlot, { updateInputSlotNodeView } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
import BaseSelectSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/select-slot';
import BaseSkillSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/skill-slot';
import InputSlotView from './input-slot.vue';
import SelectSlotView from './select-slot.vue';
import SkillSlotView from './skill-slot.vue';

export const InputSlot = BaseInputSlot.extend({
    addNodeView() {
        return VueNodeViewRenderer(InputSlotView, {
            update: (update) => updateInputSlotNodeView(this.editor, update),
        });
    },
});

export const SelectSlot = BaseSelectSlot.extend({
    addNodeView: () => VueNodeViewRenderer(SelectSlotView),
});

export const SkillSlot = BaseSkillSlot.extend({
    addNodeView: () => VueNodeViewRenderer(SkillSlotView),
});
