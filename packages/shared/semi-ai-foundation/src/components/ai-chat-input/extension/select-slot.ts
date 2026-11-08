import { Node, mergeAttributes } from '@tiptap/core';
import { strings } from '../constants';
import { getCustomSlotAttribute } from '../utils';

/** The selectSlot schema; each framework adds its node view with `.extend({ addNodeView })` */
export default Node.create({
    name: 'selectSlot',
    inline: true,
    group: 'inline',
    atom: true,
    selectable: false,

    addAttributes() {
        return {
            value: {
                default: strings.ZERO_WIDTH_CHAR,
                parseHTML: (element: HTMLElement) => element.getAttribute('value'),
                renderHTML: (attrs: Record<string, any>) => ({ value: attrs.value }),
            },
            options: {
                default: '',
                parseHTML: (element: HTMLElement) => element.getAttribute('options') || '',
                renderHTML: (attrs: Record<string, any>) => (attrs.options ? { options: attrs.options } : {}),
            },
            isCustomSlot: getCustomSlotAttribute(),
        };
    },

    parseHTML() {
        return [
            {
                tag: 'select-slot',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['select-slot', mergeAttributes(HTMLAttributes)];
    },
});
