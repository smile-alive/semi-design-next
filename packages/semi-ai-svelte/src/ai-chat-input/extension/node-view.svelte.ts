import { type Component, mount, unmount } from 'svelte';
import { type DecorationWithType, type Editor, NodeView, type NodeViewRenderer, type NodeViewRendererProps } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Decoration, DecorationSource, EditorView } from '@tiptap/pm/view';

/** What a slot view component receives; `node` follows ProseMirror's updates */
export interface SlotViewProps {
    editor: Editor;
    view: EditorView;
    node: ProseMirrorNode;
    getPos: () => number | undefined;
    updateAttributes: (attributes: Record<string, unknown>) => void;
    deleteNode: () => void;
}

/** Decides whether a node update reaches the view: return false to redraw the node, call updateProps to pass it on */
export type SlotViewUpdate = (editor: Editor, update: { oldNode: ProseMirrorNode; newNode: ProseMirrorNode; updateProps: () => void }) => boolean;

/**
 * A ProseMirror node view whose DOM a Svelte component renders. The component is mounted with `context`, the
 * AIChatInput's contexts, so it reads the same locale and config; ProseMirror disposes it through `destroy()`.
 */
class SvelteNodeView extends NodeView<Component<SlotViewProps>> {
    #root: HTMLElement;
    #contentDOM: HTMLElement | null;
    #node: ProseMirrorNode;
    #instance: ReturnType<typeof mount>;
    #update: SlotViewUpdate | undefined;

    constructor(component: Component<SlotViewProps>, props: NodeViewRendererProps, context: Map<unknown, unknown>, update?: SlotViewUpdate) {
        super(component, props);
        this.#update = update;
        this.#node = $state.raw(props.node);
        this.#root = document.createElement(props.node.isInline ? 'span' : 'div');
        this.#root.className = `node-${props.node.type.name}`;
        // the getter runs with the props object as `this`
        const readNode = () => this.#node;
        this.#instance = mount(component, {
            target: this.#root,
            context,
            props: {
                editor: this.editor,
                view: props.view,
                get node() {
                    return readNode();
                },
                getPos: () => this.getPos(),
                updateAttributes: (attributes) => this.updateAttributes(attributes),
                deleteNode: () => this.deleteNode(),
            },
        });
        // mount builds the template synchronously while bind:this waits for effects, and ProseMirror reads contentDOM
        // right after construction; flushSync is not an option, node views are created inside the editor's attachment
        // A view of a node with content marks the element ProseMirror renders that content into, as tiptap's own
        // NodeViewContent does
        this.#contentDOM = this.#root.querySelector('[data-node-view-content]');
    }

    override get dom() {
        return this.#root;
    }

    override get contentDOM() {
        return this.node.isLeaf ? null : this.#contentDOM;
    }

    update(node: ProseMirrorNode, decorations: readonly Decoration[], innerDecorations: DecorationSource) {
        if (node.type !== this.node.type) {
            return false;
        }
        const oldNode = this.node;
        this.node = node;
        this.decorations = decorations as DecorationWithType[];
        this.innerDecorations = innerDecorations;
        const updateProps = () => {
            this.#node = node;
        };
        if (this.#update) {
            return this.#update(this.editor, { oldNode, newNode: node, updateProps });
        }
        updateProps();
        return true;
    }

    // Without these ProseMirror marks a selected node draggable as well
    selectNode() {
        this.#root.classList.add('ProseMirror-selectednode');
    }

    deselectNode() {
        this.#root.classList.remove('ProseMirror-selectednode');
    }

    destroy() {
        void unmount(this.#instance);
    }
}

export default function svelteNodeViewRenderer(component: Component<SlotViewProps>, context: Map<unknown, unknown>, update?: SlotViewUpdate): NodeViewRenderer {
    return (props) => new SvelteNodeView(component, props, context, update);
}
