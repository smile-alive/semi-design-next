import { Node, mergeAttributes, type Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { getCustomSlotAttribute } from '../utils';
import { ensureTrailingText, keyDownHandlePlugin } from './plugins';

/** The inputSlot schema; each framework adds its node view with `.extend({ addNodeView })` */
export default Node.create({
    name: 'inputSlot',
    group: 'inline',
    inline: true,
    content: 'inline*',
    atom: false,
    selectable: true,
    draggable: false,

    parseHTML() {
        return [
            {
                tag: 'input-slot',
                getAttrs: (element) => ({
                    placeholder: element.getAttribute('placeholder'),
                }),
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['input-slot', mergeAttributes(HTMLAttributes), 0];
    },

    addAttributes() {
        return {
            placeholder: {
                default: '',
                parseHTML: (element) => element.getAttribute('placeholder') || '',
                renderHTML: (attributes) => ({
                    placeholder: attributes.placeholder,
                }),
            },
            isCustomSlot: getCustomSlotAttribute(),
        };
    },

    addProseMirrorPlugins() {
        return [ensureTrailingText(this.editor.schema), keyDownHandlePlugin(this.editor.schema)];
    },
});

/** Whether the selection lies strictly inside the node at `pos`; a node view without a position holds no selection */
export function isSelectionInsideNode({ from, to }: { from: number; to: number }, pos: number | undefined, nodeSize: number) {
    return pos !== undefined && from > pos && to < pos + nodeSize;
}

/** The `update` option of the inputSlot node view renderer */
export function updateInputSlotNodeView(editor: Editor, { oldNode, newNode, updateProps }: { oldNode: ProseMirrorNode; newNode: ProseMirrorNode; updateProps: () => void }) {
    if (newNode.type !== oldNode.type) {
        return false;
    }
    if (editor.view.composing) {
        // Keep the live composition DOM untouched while IME is active.
        return true;
    }
    updateProps();
    return true;
}
