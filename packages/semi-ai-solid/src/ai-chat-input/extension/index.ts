import type { Owner } from 'solid-js';
import BaseInputSlot, { updateInputSlotNodeView } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
import BaseSelectSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/select-slot';
import BaseSkillSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/skill-slot';
import InputSlotView from './input-slot';
import solidNodeViewRenderer from './node-view';
import SelectSlotView from './select-slot';
import SkillSlotView from './skill-slot';

/** The slot extensions of one editor; their views render under `owner`, the editor's component */
export default function slotExtensions(owner: Owner | null) {
    return [
        BaseInputSlot.extend({
            addNodeView() {
                return solidNodeViewRenderer(InputSlotView, owner, updateInputSlotNodeView);
            },
        }),
        BaseSelectSlot.extend({
            addNodeView: () => solidNodeViewRenderer(SelectSlotView, owner),
        }),
        BaseSkillSlot.extend({
            addNodeView: () => solidNodeViewRenderer(SkillSlotView, owner),
        }),
    ];
}
