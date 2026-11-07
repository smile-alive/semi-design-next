import { isNodeEmpty } from '@tiptap/core';
import { Placeholder, type PlaceholderOptions } from '@tiptap/extensions';
import type { Node } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { strings } from '../constants';

/**
 * Overrides the stock Placeholder decorations so a document holding only a skillSlot and zero-width characters still
 * shows the placeholder.
 */
export default Placeholder.extend<PlaceholderOptions & { showPlaceholderWhenSkillOnly?: boolean }>({
    addProseMirrorPlugins() {
        const dataAttribute = 'data-placeholder';

        const isActuallyEmpty = (root: Node) => {
            let actuallyEmpty = true;
            root.descendants((node) => {
                if (!actuallyEmpty || node.type.name === 'skillSlot') {
                    return false;
                }
                if (node.isText) {
                    actuallyEmpty = (node.text || '').replaceAll(strings.ZERO_WIDTH_CHAR, '').length === 0;
                    return actuallyEmpty;
                }
                if (node.type.name !== 'paragraph') {
                    actuallyEmpty = false;
                    return false;
                }
                return true;
            });
            return actuallyEmpty;
        };

        const paragraphHasSkillSlot = (paragraphNode: Node) => {
            let hasSkill = false;
            paragraphNode.descendants((node) => {
                if (node.type.name === 'skillSlot') {
                    hasSkill = true;
                    return false;
                }
                return true;
            });
            return hasSkill;
        };

        return [
            new Plugin({
                key: new PluginKey('custom-placeholder'),
                props: {
                    decorations: ({ doc, selection }) => {
                        const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;
                        const { anchor } = selection;
                        const decorations: Decoration[] = [];

                        if (!active) {
                            return null;
                        }

                        const showPlaceholderWhenSkillOnly = this.options.showPlaceholderWhenSkillOnly ?? false;
                        const isEmptyDoc = this.editor.isEmpty || (showPlaceholderWhenSkillOnly && isActuallyEmpty(doc));

                        doc.descendants((node, pos) => {
                            const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
                            const isEmpty = !node.isLeaf && (node.type.name === 'paragraph' ? (showPlaceholderWhenSkillOnly ? isActuallyEmpty(node) : isNodeEmpty(node)) : isNodeEmpty(node));

                            if ((hasAnchor || !this.options.showOnlyCurrent) && isEmpty) {
                                const classes = [this.options.emptyNodeClass];

                                if (isEmptyDoc) {
                                    classes.push(this.options.emptyEditorClass);
                                }

                                const hasSkill = showPlaceholderWhenSkillOnly && node.type.name === 'paragraph' && paragraphHasSkillSlot(node);
                                if (hasSkill) {
                                    classes.push('has-skill-slot');
                                }

                                decorations.push(
                                    Decoration.node(pos, pos + node.nodeSize, {
                                        class: classes.join(' '),
                                        [dataAttribute]:
                                            typeof this.options.placeholder === 'function'
                                                ? this.options.placeholder({
                                                      editor: this.editor,
                                                      node,
                                                      pos,
                                                      hasAnchor,
                                                  })
                                                : this.options.placeholder,
                                    })
                                );
                            }

                            return this.options.includeChildren;
                        });

                        return DecorationSet.create(doc, decorations);
                    },
                },
            }),
        ];
    },
});
