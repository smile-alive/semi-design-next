import { type Accessor, type Component, type Owner, type Setter, createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { type DecorationWithType, type Editor, NodeView, type NodeViewRenderer, type NodeViewRendererProps } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Decoration, DecorationSource, EditorView } from '@tiptap/pm/view';

/** What a slot view component receives; `node` follows ProseMirror's updates */
export interface SlotViewProps {
    editor: Editor;
    view: EditorView;
    node: Accessor<ProseMirrorNode>;
    getPos: () => number | undefined;
    updateAttributes: (attributes: Record<string, unknown>) => void;
    deleteNode: () => void;
    /** The element ProseMirror renders the node's content into; a node with content must set it while rendering */
    contentRef: (element: HTMLElement) => void;
}

/** Decides whether a node update reaches the view: return false to redraw the node, call updateProps to pass it on */
export type SlotViewUpdate = (editor: Editor, update: { oldNode: ProseMirrorNode; newNode: ProseMirrorNode; updateProps: () => void }) => boolean;

/**
 * A ProseMirror node view whose DOM a Solid component renders. The root is created under `owner`, so the component
 * reads the AIChatInput's context (locale, config, popup layers); ProseMirror disposes it through `destroy()`.
 */
class SolidNodeView extends NodeView<Component<SlotViewProps>> {
    #root: HTMLElement;
    #contentDOM: HTMLElement | null = null;
    #setNode: Setter<ProseMirrorNode>;
    #dispose: () => void;
    #update: SlotViewUpdate | undefined;

    constructor(component: Component<SlotViewProps>, props: NodeViewRendererProps, owner: Owner | null, update?: SlotViewUpdate) {
        super(component, props);
        this.#update = update;
        const [node, setNode] = createSignal(props.node);
        this.#setNode = setNode;
        this.#root = document.createElement(props.node.isInline ? 'span' : 'div');
        this.#root.className = `node-${props.node.type.name}`;
        const viewProps: SlotViewProps = {
            editor: this.editor,
            view: props.view,
            node,
            getPos: () => this.getPos(),
            updateAttributes: (attributes) => this.updateAttributes(attributes),
            deleteNode: () => this.deleteNode(),
            contentRef: (element) => (this.#contentDOM = element),
        };
        // synchronous: ProseMirror reads dom and contentDOM right after construction
        this.#dispose = render(() => component(viewProps), this.#root, undefined, { owner });
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
            this.#setNode(node);
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
        this.#dispose();
    }
}

export default function solidNodeViewRenderer(component: Component<SlotViewProps>, owner: Owner | null, update?: SlotViewUpdate): NodeViewRenderer {
    return (props) => new SolidNodeView(component, props, owner, update);
}
