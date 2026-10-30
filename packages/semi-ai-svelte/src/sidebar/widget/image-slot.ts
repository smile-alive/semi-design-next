import { mount, unmount } from 'svelte';
import { NodeView, type NodeViewRendererProps } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ImageUploadNode as ImageUploadSchema } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
import ImageSlotView from './image-slot-view.svelte';
import type { ImageUploadNodeOptions } from './interface.js';

type SlotOptions = ImageUploadNodeOptions & { type: string };

// tiptap's NodeView supplies stopEvent and ignoreMutation, as for the React and Vue renderers
class SvelteImageSlot extends NodeView<typeof ImageSlotView> {
    readonly #dom = document.createElement('div');
    readonly #instance: ReturnType<typeof mount>;

    constructor(props: NodeViewRendererProps, context: Map<unknown, unknown>) {
        super(ImageSlotView, props);
        const options = this.extension.options as SlotOptions;
        // not focusable itself: the Upload drag area is the slot's Tab stop
        this.#dom.className = ['tiptap-image-slot', options.class].filter(Boolean).join(' ');
        // mounted with FileItem's contexts, so the slot reads the same locale and config
        this.#instance = mount(ImageSlotView, {
            target: this.#dom,
            context,
            props: { editor: this.editor, options, getPos: () => this.getPos(), getNodeSize: () => this.node.nodeSize },
        });
    }

    override get dom() {
        return this.#dom;
    }

    update(node: ProseMirrorNode) {
        if (node.type !== this.node.type) {
            return false;
        }
        this.node = node;
        return true;
    }

    destroy() {
        void unmount(this.#instance);
    }
}

/** The image upload slot FileItem's image button inserts; its options are FileItem's imgUploadProps, its views mount with `context` */
export function createImageUploadNode(context: Map<unknown, unknown>, options?: ImageUploadNodeOptions) {
    return ImageUploadSchema.extend<SlotOptions>({
        addNodeView() {
            return (props) => new SvelteImageSlot(props, context);
        },
    }).configure(options);
}
