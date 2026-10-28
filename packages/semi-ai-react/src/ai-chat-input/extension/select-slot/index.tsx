import { useCallback } from 'react';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import BaseSelectSlot from '@fibrae/semi-ai-foundation/ai-chat-input/extension/select-slot';
import Select from '@fibrae/semi-ui-react/select/index';

function SelectSlotComponent({ node, updateAttributes }: NodeViewProps) {
    const value: string = node.attrs.value ?? '';
    const options: Array<{ value: string; label: string }> = JSON.parse(node.attrs.options || '[]').map((option: string) => ({ value: option, label: option }));

    const handleChange = useCallback(
        (val: string | number | Record<string, any> | (string | number | Record<string, any>)[]) => {
            if (typeof val === 'string') {
                updateAttributes({ value: val });
            }
        },
        [updateAttributes]
    );

    return (
        <NodeViewWrapper className="select-slot-wrapper">
            <Select className="select-slot" value={value} optionList={options} onChange={handleChange} />
        </NodeViewWrapper>
    );
}

export default BaseSelectSlot.extend({
    addNodeView: () => ReactNodeViewRenderer(SelectSlotComponent),
});
