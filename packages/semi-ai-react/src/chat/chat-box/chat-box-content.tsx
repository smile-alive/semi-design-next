import { type ReactNode, useMemo } from 'react';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses, strings, type ChatMode } from '@fibrae/semi-ai-foundation/chat/constants';
import ChatFoundation from '@fibrae/semi-ai-foundation/chat/foundation';
import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
import MarkdownRender from '@fibrae/semi-ui-react/markdown-render/index';
import { FileAttachment, ImageAttachment } from '../attachment';
import type { ChatBoxProps, Message, Metadata, RenderContentProps, MarkdownRenderProps } from '../interface';
import Code from './code';

const { PREFIX_CHAT_BOX } = cssClasses;
const { MESSAGE_STATUS, ROLE } = strings;

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
    const shouldEscapeHtml = escapeHtml && role === ROLE.USER;
    const { bubble, user, error } = ChatFoundation.getContentFlags(role, status, mode);

    const wrapCls = clsx(`${PREFIX_CHAT_BOX}-content`, {
        [`${PREFIX_CHAT_BOX}-content-${mode}`]: bubble,
        [`${PREFIX_CHAT_BOX}-content-user`]: user,
        [`${PREFIX_CHAT_BOX}-content-error`]: error,
    });

    const markdownComponents = useMemo(
        () => ({
            code: Code,
            SemiFile: FileAttachment,
            img: ImageAttachment,
            // an explicit undefined entry would replace the built-in component with a non-component
            ...omitBy(customMarkDownComponents ?? {}, (component) => component === undefined),
        }),
        [customMarkDownComponents]
    );

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
                const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(content) : content;
                realContent = <MarkdownRender format="md" {...markdownRenderProps} components={markdownComponents} raw={rawText} />;
            } else if (Array.isArray(content)) {
                realContent = content.map((item, index) => {
                    if (item.type === 'text') {
                        const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(item.text) : item.text;
                        return <MarkdownRender key={index} format="md" {...markdownRenderProps} components={markdownComponents} raw={rawText} />;
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
    }, [status, content, shouldEscapeHtml, markdownComponents, markdownRenderProps]);

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
