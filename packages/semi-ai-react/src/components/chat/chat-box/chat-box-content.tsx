import { type ReactNode, useMemo } from 'react';
import { cssClasses, strings, type ChatMode } from '@fibrae/semi-ai-foundation/components/chat/constants';
import ChatFoundation from '@fibrae/semi-ai-foundation/components/chat/foundation';
import { getFileType } from '@fibrae/semi-ai-foundation/utils';
import MarkdownRender from '@fibrae/semi-ui-react/markdown-render/index';
import { FileAttachment, ImageAttachment } from '../attachment';
import Code from '../code';
import type { ChatBoxProps, Message, Metadata, RenderContentProps, MarkdownRenderProps } from '../interface';

const { PREFIX_CHAT_BOX } = cssClasses;
const { MESSAGE_STATUS } = strings;

interface ChatBoxContentProps {
    mode?: ChatMode;
    customMarkDownComponents?: ChatBoxProps['customMarkDownComponents'];
    children?: string;
    escapeHtml?: boolean;
    role?: Metadata;
    message?: Message;
    customRenderFunc?: (props: RenderContentProps) => ReactNode;
    markdownRenderProps?: MarkdownRenderProps;
}

export default function ChatBoxContent({ message = {}, customRenderFunc, role: roleInfo, customMarkDownComponents, mode, markdownRenderProps, escapeHtml }: ChatBoxContentProps) {
    const { content, role, status } = message;
    const wrapCls = ChatFoundation.getContentClass(role, status, mode);
    const markdownComponents = useMemo(() => ChatFoundation.mergeMarkdownComponents({ code: Code, SemiFile: FileAttachment, img: ImageAttachment }, customMarkDownComponents), [customMarkDownComponents]);

    const node = useMemo<ReactNode>(() => {
        if (status === MESSAGE_STATUS.LOADING) {
            return (
                <span className={`${PREFIX_CHAT_BOX}-content-loading`}>
                    <span className={`${PREFIX_CHAT_BOX}-content-loading-item`} />
                </span>
            );
        } else {
            let realContent;
            if (typeof content === 'string') {
                realContent = <MarkdownRender format="md" {...markdownRenderProps} components={markdownComponents} raw={ChatFoundation.getMarkdownRaw(content, role, escapeHtml)} />;
            } else if (Array.isArray(content)) {
                realContent = content.map((item, index) => {
                    if (item.type === 'text') {
                        return <MarkdownRender key={index} format="md" {...markdownRenderProps} components={markdownComponents} raw={ChatFoundation.getMarkdownRaw(item.text, role, escapeHtml)} />;
                    } else if (item.type === 'image_url') {
                        return <ImageAttachment key={index} src={item.image_url.url} />;
                    } else if (item.type === 'file_url') {
                        const { name, size, url, type } = item.file_url;
                        return <FileAttachment key={index} name={name} type={getFileType(name, type)} size={size} url={url} />;
                    }
                    return null;
                });
            }
            return realContent;
        }
    }, [status, content, role, escapeHtml, markdownComponents, markdownRenderProps]);

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        return customRenderFunc({
            message,
            role: roleInfo,
            defaultContent: node,
            className: wrapCls,
        });
    }

    return <div className={wrapCls}>{node}</div>;
}
