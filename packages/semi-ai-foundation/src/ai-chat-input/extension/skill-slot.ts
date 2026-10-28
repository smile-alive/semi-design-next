import { Node, mergeAttributes } from '@tiptap/core';
import { getCustomSlotAttribute } from '../utils';

/** The skillSlot schema; each framework adds its node view with `.extend({ addNodeView })` */
export default Node.create({
    name: 'skillSlot',
    inline: true,
    group: 'inline',
    atom: true,

    selectable: false,

    addAttributes() {
        return {
            value: {
                default: '',
                parseHTML: (element: HTMLElement) => element.getAttribute('data-value'),
                renderHTML: (attributes: Record<string, any>) => ({ 'data-value': attributes.value }),
            },
            label: {
                parseHTML: (element: HTMLElement) => element.getAttribute('data-label'),
                renderHTML: (attributes: Record<string, any>) => ({ 'data-label': attributes.label }),
            },
            hasTemplate: {
                parseHTML: (element: HTMLElement) => element.getAttribute('data-template') === 'true',
                renderHTML: (attributes: Record<string, any>) => ({ 'data-template': attributes.hasTemplate }),
            },
            isCustomSlot: getCustomSlotAttribute(),
        };
    },

    parseHTML() {
        return [
            {
                tag: 'skill-slot',
            },
        ];
    },

    renderHTML({ HTMLAttributes: htmlAttributes }) {
        return ['skill-slot', mergeAttributes(htmlAttributes)];
    },
});
