import { ReactNodeViewRenderer } from '@tiptap/react';
import BaseInputSlot, { updateInputSlotNodeView } from '@fibrae/semi-ai-foundation/ai-chat-input/extension/input-slot';
import Component from './component';

export default BaseInputSlot.extend({
    addNodeView() {
        return ReactNodeViewRenderer(Component, {
            update: (update) => updateInputSlotNodeView(this.editor, update),
        });
    },
});
