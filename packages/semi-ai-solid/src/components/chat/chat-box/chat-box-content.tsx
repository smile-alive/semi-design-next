import { type JSX, Index, Match, Show, Switch, createMemo } from 'solid-js';
import { cssClasses, strings, type ChatMode } from '@fibrae/semi-ai-foundation/components/chat/constants';
import ChatFoundation, { type Content } from '@fibrae/semi-ai-foundation/components/chat/foundation';
import { getFileType } from '@fibrae/semi-ai-foundation/utils/file-suffix';
import MarkdownRender, { type MarkdownRenderComponents } from '@fibrae/semi-ui-solid/markdown-render/index';
import { FileAttachment, ImageAttachment } from '../attachment';
import Code from '../code';
import type { MarkdownRenderProps, Message, Metadata, RenderContentProps } from '../interface';

const { PREFIX_CHAT_BOX } = cssClasses;
const { MESSAGE_STATUS } = strings;

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
    const markdownComponents = createMemo<MarkdownRenderComponents>(() => ChatFoundation.mergeMarkdownComponents({ code: Code, SemiFile: FileAttachment, img: ImageAttachment }, props.customMarkDownComponents));

    const wrapCls = () => ChatFoundation.getContentClass(props.message.role, props.message.status, props.mode);

    const markdown = (text: () => string | undefined) => <MarkdownRender format="md" {...props.markdownRenderProps} components={markdownComponents()} raw={ChatFoundation.getMarkdownRaw(text(), props.message.role, props.escapeHtml)} />;

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
