import { useState } from 'react';
import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
import { ImageUploadNode as ImageUploadSchema, insertUploadedImage } from '@fibrae/semi-ai-foundation/sidebar/file-extensions';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import Upload, { type FileItem, type UploadProps } from '@fibrae/semi-ui-react/upload/index';

const prefixCls = `${cssClasses.FILE}-image-slot`;

export function ImageUploadNodeComponent(props: NodeViewProps) {
    const [status, setStatus] = useState<string>();

    const options: ImageUploadNodeOptions & { type: string } = props.extension.options;

    // HTMLAttributes and type configure the tiptap node; Upload passes unknown props to its root div
    const { onChange, onSuccess, getUploadImageSrc, className, HTMLAttributes, type, ...rest } = options;

    const handleChange = (innerProps: any) => {
        const file = innerProps.fileList[0];
        if (file) {
            setStatus(file.status);
        }
        onChange?.(innerProps);
    };

    const handleSuccess = (responseBody: any, file: File, fileList: FileItem[]) => {
        onSuccess?.(responseBody, file, fileList);
        insertUploadedImage({ editor: props.editor, pos: props.getPos(), nodeSize: props.node.nodeSize, type, response: responseBody, name: file.name, getUploadImageSrc });
    };

    const getDragMainText = (status: string | undefined, locale: Locale['Sidebar']) => {
        if (status === 'validateFail') {
            return locale.validateFailInfo;
        } else if (status === 'uploadFail') {
            return locale.uploadFailInfo;
        }
        return locale.uploadImgInfo;
    };

    return (
        // not focusable itself: the Upload drag area is the slot's Tab stop
        <NodeViewWrapper className={clsx('tiptap-image-slot', className)}>
            <LocaleConsumer componentName="Sidebar">{(locale: Locale['Sidebar']) => <Upload {...rest} className={clsx(status && `${prefixCls}-${status}`)} draggable dragMainText={getDragMainText(status, locale)} onChange={handleChange} onSuccess={handleSuccess} />}</LocaleConsumer>
        </NodeViewWrapper>
    );
}

export interface ImageUploadNodeOptions extends UploadProps {
    HTMLAttributes?: any;
    getUploadImageSrc?: (response: any) => string;
}

export const ImageUploadNode = ImageUploadSchema.extend<ImageUploadNodeOptions & { type: string }>({
    addNodeView() {
        return ReactNodeViewRenderer(ImageUploadNodeComponent);
    },
});
