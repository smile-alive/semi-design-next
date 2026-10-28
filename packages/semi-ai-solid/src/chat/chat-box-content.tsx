import { type JSX, Index, Match, Show, Switch, createMemo } from 'solid-js';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses, strings, type ChatMode } from '@fibrae/semi-ai-foundation/chat/constants';
import ChatFoundation, { type Content } from '@fibrae/semi-ai-foundation/chat/foundation';
import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
import MarkdownRender, { type MarkdownRenderComponents } from '@fibrae/semi-ui-solid/markdown-render/index';
import { FileAttachment, ImageAttachment } from './attachment';
import Code from './code';
import type { MarkdownRenderProps, Message, Metadata, RenderContentProps } from './interface';

const { PREFIX_CHAT_BOX } = cssClasses;
const { MESSAGE_STATUS, ROLE } = strings;

interface ChatBoxContentProps {
    mode?: ChatMode;
    customMarkDownComponents?: MarkdownRenderComponents;
    escapeHtml?: boolean;
    role?: Metadata;
    message: Message;
    customRenderFunc?: (props: RenderContentProps) => JSX.Element;
    markdownRenderProps?: MarkdownRenderProps;
}

export default function ChatBoxContent(props: ChatBoxContentProps) {
    const markdownComponents = createMemo<MarkdownRenderComponents>(() => ({
        code: Code,
        SemiFile: FileAttachment,
        img: ImageAttachment,
        // an explicit undefined entry would replace the built-in component with a non-component
        ...omitBy(props.customMarkDownComponents ?? {}, (component) => component === undefined),
    }));

    const isUser = () => props.message.role === ROLE.USER;

    const shouldEscapeHtml = () => props.escapeHtml && isUser();

    const wrapCls = () => {
        const { bubble, user, error } = ChatFoundation.getContentFlags(props.message.role, props.message.status, props.mode);
        return clsx(`${PREFIX_CHAT_BOX}-content`, {
            [`${PREFIX_CHAT_BOX}-content-${props.mode}`]: bubble,
            [`${PREFIX_CHAT_BOX}-content-user`]: user,
            [`${PREFIX_CHAT_BOX}-content-error`]: error,
        });
    };

    const markdown = (text: () => string | undefined) => <MarkdownRender format="md" {...props.markdownRenderProps} components={markdownComponents()} raw={shouldEscapeHtml() ? escapeHtmlInMarkdown(text() ?? '') : (text() ?? '')} />;

    const part = (item: () => Content) => (
        <Switch>
            <Match when={item().type === 'text'}>{markdown(() => item().text)}</Match>
            <Match when={item().type === 'image_url'}>
                <ImageAttachment src={item().image_url?.url} />
            </Match>
            <Match when={item().type === 'file_url'}>
                <FileAttachment name={item().file_url?.name} type={getFileType(item().file_url?.name, item().file_url?.type)} size={item().file_url?.size} url={item().file_url?.url} />
            </Match>
        </Switch>
    );

    const node = () => (
        <Switch>
            <Match when={props.message.status === MESSAGE_STATUS.LOADING}>
                <span class={`${PREFIX_CHAT_BOX}-content-loading`}>
                    <span class={`${PREFIX_CHAT_BOX}-content-loading-item`} />
                </span>
            </Match>
            <Match when={typeof props.message.content === 'string'}>{markdown(() => props.message.content as string)}</Match>
            <Match when={Array.isArray(props.message.content)}>
                {/* parts have no id and may repeat, so they follow the position */}
                <Index each={props.message.content as Content[]}>{part}</Index>
            </Match>
        </Switch>
    );

    return (
        <Show when={props.customRenderFunc} keyed fallback={<div class={wrapCls()}>{node()}</div>}>
            {(render) =>
                render({
                    get message() {
                        return props.message;
                    },
                    get role() {
                        return props.role;
                    },
                    defaultContent: node,
                    get class() {
                        return wrapCls();
                    },
                })
            }
        </Show>
    );
}
