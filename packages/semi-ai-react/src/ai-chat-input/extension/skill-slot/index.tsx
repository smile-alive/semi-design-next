import React from 'react';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import BaseSkillSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/skill-slot';
import { IconClose } from '@fibrae/semi-icons-react';
import { useLocale } from '@fibrae/semi-ui-react/hooks';

function SkillSlotComponent({ node, editor, deleteNode }: NodeViewProps) {
    const { locale } = useLocale('AIChatInput');

    const value: string = node.attrs.label ?? node.attrs.value ?? '';

    const onRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        deleteNode();
        // the button leaves with the slot, so focus would otherwise fall to the body
        editor?.commands.focus();
    };

    if (value === '') {
        return null;
    }

    return (
        <NodeViewWrapper className="skill-slot-wrapper">
            <span className="skill-slot">
                {value}
                <button type="button" className="skill-slot-delete" aria-label={locale.removeSkill} onClick={onRemove}>
                    <IconClose />
                </button>
            </span>
        </NodeViewWrapper>
    );
}

export default BaseSkillSlot.extend({
    addNodeView: () => ReactNodeViewRenderer(SkillSlotComponent),
});
