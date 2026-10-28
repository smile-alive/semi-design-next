import { type Owner, createRoot, createSignal, untrack } from 'solid-js';
import { insert } from 'solid-js/web';
import { NodeView, type NodeViewRendererProps } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { ImageUploadNode as ImageUploadSchema, insertUploadedImage } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Upload, { type FileItem, type OnChangeProps, type UploadProps } from '@fibrae/semi-ui-solid/upload/index';

const prefixCls = `${cssClasses.FILE}-image-slot`;

export interface ImageUploadNodeOptions extends Omit<UploadProps, 'action'> {
    /** Optional: a `customRequest` alone also uploads */
    action?: string;
    HTMLAttributes?: Record<string, unknown>;
    getUploadImageSrc?: (response: any) => string;
}

type SlotOptions = ImageUploadNodeOptions & { type: string };

function ImageSlot(props: { view: ImageSlotView }) {
    const locale = useLocale('Sidebar');

    const [status, setStatus] = createSignal<string>();

    // HTMLAttributes and type configure the tiptap node and class goes on the slot element; Upload passes unknown props
    // to its root div
    // the node view and its options are fixed for the slot's life
    const { onChange, onSuccess, getUploadImageSrc, class: _class, HTMLAttributes: _attributes, type, ...uploadProps } = untrack(() => props.view.extension.options as SlotOptions);

    const dragMainText = () => {
        const text = locale().locale;
        if (status() === 'validateFail') {
            return text.validateFailInfo;
        }
        if (status() === 'uploadFail') {
            return text.uploadFailInfo;
        }
        return text.uploadImgInfo;
    };

    const handleChange = (info: OnChangeProps) => {
        const file = info.fileList[0];
        if (file) {
            setStatus(file.status);
        }
        onChange?.(info);
    };

    const handleSuccess = (responseBody: any, file: File, fileList: FileItem[]) => {
        onSuccess?.(responseBody, file, fileList);
        const { editor, node } = props.view;
        insertUploadedImage({ editor, pos: props.view.getPos(), nodeSize: node.nodeSize, type, response: responseBody, name: file.name, getUploadImageSrc });
    };

    return <Upload {...uploadProps} action={uploadProps.action ?? ''} class={clsx(status() && `${prefixCls}-${status()}`)} draggable dragMainText={dragMainText()} onChange={handleChange} onSuccess={handleSuccess} />;
}

// tiptap's NodeView supplies stopEvent and ignoreMutation, as for the React and Vue renderers
class ImageSlotView extends NodeView<typeof ImageSlot> {
    readonly #dom = document.createElement('div');
    readonly #dispose: () => void;

    constructor(props: NodeViewRendererProps, owner: Owner | null) {
        super(ImageSlot, props);
        // not focusable itself: the Upload drag area is the slot's Tab stop
        this.#dom.className = clsx('tiptap-image-slot', (this.extension.options as SlotOptions).class);
        // under FileItem's owner, so the slot reads the providers around the editor
        this.#dispose = createRoot((dispose) => {
            insert(this.#dom, () => <ImageSlot view={this} />);
            return dispose;
        }, owner ?? undefined);
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
        this.#dispose();
        // disposing a root stops its computations but leaves the nodes it inserted
        this.#dom.replaceChildren();
    }
}

/** The image upload slot; each FileItem extends it with its own owner so the slot sees FileItem's context */
export function createImageUploadNode(owner: Owner | null, options?: ImageUploadNodeOptions) {
    return ImageUploadSchema.extend<SlotOptions>({
        addNodeView() {
            return (props) => new ImageSlotView(props, owner);
        },
    }).configure(options);
}
