import { Index, Match, Show, Switch, createMemo, untrack } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses, getDialogueFileKind, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import { messageToChatInput } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
import DialogueFoundation, { type ContentItem, type CustomToolCall, type FunctionToolCall, type InputFile, type InputImage, type InputMessage, type InputText, type Message, type OutputMessage, type OutputText, type Reasoning, type Refusal } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { findContentItemRenderer, getAttachmentLayout, getVisibleAnnotations, isAwaitingOutput, isImageList } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-content';
import { getMessageText } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-text';
import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
import { IconAlertCircle, IconCode, IconExcel, IconFile, IconPdf, IconSendMsgStroked, IconVideo, IconWord, IconWrench } from '@fibrae/semi-icons-solid';
import { useLocale } from '@fibrae/semi-ui-solid/hooks';
import Image from '@fibrae/semi-ui-solid/image/index';
import MarkdownRender from '@fibrae/semi-ui-solid/markdown-render/index';
import { useAIChatDialogueContext } from '../context';
import type { DialogueContentItemRenderer, Metadata } from '../interface';
import { AnnotationWidget } from './content-item/annotation';
import Code from './content-item/code';
import { ReasoningWidget } from './content-item/reasoning';
import { ReferenceWidget } from './content-item/reference';

type MessagePartItem = InputText | InputImage | InputFile | OutputText | Refusal;

interface DialogueContentProps {
    message: Message;
    role?: Metadata;
}

interface BlockProps {
    class: string;
    isUser: boolean;
    message: Message;
}

const { PREFIX_CONTENT } = cssClasses;
const { STATUS, ROLE, MESSAGE_ITEM_TYPE, TEXT_TYPES } = strings;

const FILE_ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo, default: IconFile };

const EMPTY: ContentItem[] = [];

function CustomRenderer(props: { renderer: DialogueContentItemRenderer; item: unknown; message: Message }) {
    // a new item rebuilds the custom nodes; the message is the one at call time, so a like does not rebuild them
    const node = createMemo(() => {
        const render = props.renderer;
        const item = props.item;
        return untrack(() => render(item, props.message));
    });

    return <div class={`${PREFIX_CONTENT}-custom-renderer`}>{node()}</div>;
}

function MarkdownBlock(props: { text: string; class: string; isUser: boolean }) {
    const { view, referenceClick } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    // its own memo: a change of another view key (selecting, mode) must not render the markdown again
    const markdownRenderProps = createMemo(() => view().markdownRenderProps);

    // an explicit undefined entry would replace the dialogue code block with the built-in one
    const components = createMemo(() => ({ code: Code, ...omitBy(markdownRenderProps()?.components ?? {}, (component) => component === undefined) }));

    const raw = () => (view().escapeHtml && props.isUser ? escapeHtmlInMarkdown(props.text) : props.text);

    return (
        <div class={props.class}>
            <MarkdownRender format="md" {...markdownRenderProps()} components={components()} raw={raw()} />
            <Show when={props.isUser && view().showReference}>
                <button type="button" class={`${PREFIX_CONTENT}-icon-reference`} aria-label={locale().locale.reference} onClick={() => referenceClick({ type: 'text', content: props.text })}>
                    <IconSendMsgStroked />
                </button>
            </Show>
        </div>
    );
}

function ImageAttachment(props: { image: InputImage; isList: boolean; isLast: boolean }) {
    const { imageClick } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    return (
        <Image
            class={clsx(`${PREFIX_CONTENT}-img`, {
                [`${PREFIX_CONTENT}-img-list`]: props.isList,
                [`${PREFIX_CONTENT}-img-last`]: props.isLast,
            })}
            alt={locale().locale.image}
            src={props.image.image_url}
            onClick={() => imageClick(props.image)}
        />
    );
}

function FileAttachment(props: { file: InputFile; isLast: boolean; isUser: boolean }) {
    const { view, fileClick, referenceClick } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const realType = () => getFileType(props.file.filename, props.file.fileInstance?.type);

    const kind = () => getDialogueFileKind(realType()) ?? 'default';

    const icon = () => {
        const current = kind();
        return current === 'image' ? undefined : FILE_ICONS[current];
    };

    const showReference = () => props.isUser && view().showReference;

    // cancels the default too: the card link must not open, and Space must not scroll
    const reference = (e: Event) => {
        referenceClick({ name: props.file.filename, url: props.file.file_url });
        e.preventDefault();
    };

    return (
        <a
            class={clsx(`${PREFIX_CONTENT}-file`, { [`${PREFIX_CONTENT}-file-last`]: props.isLast })}
            href={props.file.file_url}
            rel="noreferrer"
            target="_blank"
            onClick={(e) => {
                fileClick(props.file);
                if (view().disabledFileItemClick) {
                    e.preventDefault();
                }
            }}
        >
            <div class={clsx(`${PREFIX_CONTENT}-file-icon-wrapper`, `${PREFIX_CONTENT}-file-icon-${kind()}`)}>
                <Show when={icon()} keyed fallback={<div class={`${PREFIX_CONTENT}-file-icon`} style={{ 'background-image': `url(${props.file.file_url})` }} />}>
                    {(Icon) => <Dynamic component={Icon} class={`${PREFIX_CONTENT}-file-icon`} size="extra-large" />}
                </Show>
            </div>
            <div class={`${PREFIX_CONTENT}-file-info`}>
                <span class={clsx(`${PREFIX_CONTENT}-file-title`, { [`${PREFIX_CONTENT}-file-title-ellipsis`]: showReference() })}>{props.file.filename}</span>
                <span class={`${PREFIX_CONTENT}-file-metadata`}>
                    <span class={`${PREFIX_CONTENT}-file-type`}>{realType()}</span> {props.file.size}
                </span>
            </div>
            <Show when={showReference()}>
                {/* shortcut: a role="button" div because a native button may not sit inside the card's <a>; move it
                    beside the link as a native button when the card layout is reworked */}
                <div
                    class={`${PREFIX_CONTENT}-icon-reference`}
                    aria-label={locale().locale.reference}
                    role="button"
                    tabIndex={0}
                    onClick={reference}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            reference(e);
                        }
                    }}
                >
                    <IconSendMsgStroked />
                </div>
            </Show>
        </a>
    );
}

function ToolCallWidget(props: { item: FunctionToolCall | CustomToolCall }) {
    // both shapes share `type?: string`, so `in` cannot tell them apart
    const item = () => props.item as FunctionToolCall & CustomToolCall;

    return (
        <div class={`${PREFIX_CONTENT}-tool-call`}>
            <IconWrench />
            {item().name} {item().arguments ?? item().input}
        </div>
    );
}

function MessagePart(props: BlockProps & { part: MessagePartItem; layout: ReturnType<typeof getAttachmentLayout>; isImageList: boolean }) {
    const { view, annotationClick } = useAIChatDialogueContext();

    const type = createMemo(() => props.part?.type ?? '');
    const renderer = createMemo(() => findContentItemRenderer(view().renderDialogueContentItem, type(), props.part));

    const annotations = () => getVisibleAnnotations(props.part as OutputText);

    return (
        <Show
            when={renderer()}
            keyed
            fallback={
                <Switch>
                    <Match when={TEXT_TYPES.includes(type())}>
                        <Show when={annotations().length > 0}>
                            <AnnotationWidget
                                annotation={annotations()}
                                // Known limitation: the count is fixed; make it configurable when needed
                                maxCount={15}
                                onClick={() => annotationClick(annotations())}
                            />
                        </Show>
                        <Show when={(props.part as OutputText).text}>{(text) => <MarkdownBlock class={props.class} isUser={props.isUser} text={text()} />}</Show>
                        <Show when={(props.part as Refusal).refusal}>{(refusal) => <MarkdownBlock class={props.class} isUser={props.isUser} text={refusal()} />}</Show>
                    </Match>
                    <Match when={type() === MESSAGE_ITEM_TYPE.INPUT_IMAGE}>
                        <ImageAttachment image={props.part as InputImage} isLast={props.layout.isLast} isList={props.isImageList} />
                        <Show when={props.layout.breakAfter}>
                            <br />
                        </Show>
                    </Match>
                    <Match when={type() === MESSAGE_ITEM_TYPE.INPUT_FILE}>
                        <FileAttachment file={props.part as InputFile} isLast={props.layout.isLast} isUser={props.isUser} />
                        <Show when={props.layout.breakAfter}>
                            <br />
                        </Show>
                    </Match>
                </Switch>
            }
        >
            {(render) => <CustomRenderer item={props.part} message={props.message} renderer={render} />}
        </Show>
    );
}

function MessageItem(props: BlockProps & { item: InputMessage | OutputMessage }) {
    const parts = () => (Array.isArray(props.item.content) ? (props.item.content as MessagePartItem[]) : []);

    const imageList = () => isImageList(parts());

    return (
        <Show
            when={typeof props.item.content === 'string' ? props.item.content : undefined}
            fallback={
                // positions, not identities: a streamed chunk replaces each part with a new object
                <Index each={parts()}>{(part, index) => <MessagePart class={props.class} isImageList={imageList()} isUser={props.isUser} layout={getAttachmentLayout(parts(), index)} message={props.message} part={part()} />}</Index>
            }
        >
            {(text) => <MarkdownBlock class={props.class} isUser={props.isUser} text={text()} />}
        </Show>
    );
}

function ContentBlock(props: BlockProps & { item: ContentItem }) {
    const { view } = useAIChatDialogueContext();

    const type = createMemo(() => props.item?.type ?? MESSAGE_ITEM_TYPE.MESSAGE);
    const renderer = createMemo(() => findContentItemRenderer(view().renderDialogueContentItem, type(), props.item));
    const markdownRenderProps = createMemo(() => view().markdownRenderProps);

    return (
        <Show
            when={renderer()}
            keyed
            fallback={
                <Switch>
                    <Match when={type() === MESSAGE_ITEM_TYPE.MESSAGE}>
                        <MessageItem class={props.class} isUser={props.isUser} item={props.item as InputMessage | OutputMessage} message={props.message} />
                    </Match>
                    <Match when={type() === MESSAGE_ITEM_TYPE.REASONING}>
                        <ReasoningWidget content={(props.item as Reasoning).content} markdownRenderProps={markdownRenderProps()} status={(props.item as Reasoning).status} summary={(props.item as Reasoning).summary} />
                    </Match>
                    <Match when={type() === MESSAGE_ITEM_TYPE.FUNCTION_CALL || type() === MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL}>
                        <ToolCallWidget item={props.item as FunctionToolCall | CustomToolCall} />
                    </Match>
                </Switch>
            }
        >
            {(render) => <CustomRenderer item={props.item} message={props.message} renderer={render} />}
        </Show>
    );
}

export default function DialogueContent(props: DialogueContentProps) {
    const { view } = useAIChatDialogueContext();
    const locale = useLocale('AIChatDialogue');

    const isUser = createMemo(() => props.message.role === ROLE.USER);

    // without messageEditRender the editing branch would render nothing, so the message stays as is
    const editing = createMemo(() => Boolean(props.message.editing && isUser() && view().messageEditRender));
    const textContent = createMemo(() => (Array.isArray(props.message.content) ? undefined : getMessageText(props.message)));
    const items = createMemo(() => (Array.isArray(props.message.content) ? props.message.content : EMPTY));
    const textRenderer = createMemo(() => findContentItemRenderer(view().renderDialogueContentItem, 'default'));

    const wrapCls = () => {
        const { bubble, user, error } = DialogueFoundation.getContentFlags(props.message.role, props.message.status, view().mode);
        return clsx(PREFIX_CONTENT, {
            [`${PREFIX_CONTENT}-${view().mode}`]: bubble,
            [`${PREFIX_CONTENT}-no-bubble`]: !bubble,
            [`${PREFIX_CONTENT}-user`]: user,
            [`${PREFIX_CONTENT}-error`]: error,
        });
    };

    const failed = () => props.message.status === STATUS.FAILED || props.message.status === STATUS.CANCELLED;

    const loading = () => isAwaitingOutput(props.message);

    const references = () => (!editing() && props.message.references?.length ? props.message.references : undefined);

    const body = () => (
        <div class={`${PREFIX_CONTENT}-wrapper`}>
            <Show when={failed()}>
                <div class={`${PREFIX_CONTENT}-failed`}>
                    <IconAlertCircle />
                </div>
            </Show>
            <div class={`${PREFIX_CONTENT}-inner`}>
                <Show
                    when={textContent()}
                    fallback={
                        // positions, not identities: a streamed chunk replaces each item with a new object
                        <Index each={items()}>{(item) => <ContentBlock class={wrapCls()} isUser={isUser()} item={item()} message={props.message} />}</Index>
                    }
                >
                    {(text) => (
                        <Show when={textRenderer()} keyed fallback={<MarkdownBlock class={wrapCls()} isUser={isUser()} text={text()} />}>
                            {(render) => <CustomRenderer item={text()} message={props.message} renderer={render} />}
                        </Show>
                    )}
                </Show>
            </div>
        </div>
    );

    const defaultContent = () => (
        <>
            <Show when={references()}>{(list) => <ReferenceWidget references={list()} />}</Show>
            <Show when={editing()} fallback={body()}>
                {/* called once when editing starts: the editor keeps its own draft */}
                <Show when={view().messageEditRender} keyed>
                    {(render) => render(messageToChatInput(untrack(() => props.message)))}
                </Show>
            </Show>
            <Show when={loading()}>
                <span class={`${PREFIX_CONTENT}-loading`}>
                    <span class={`${PREFIX_CONTENT}-loading-item`} />
                    <span class={`${PREFIX_CONTENT}-loading-item`} />
                    <span class={`${PREFIX_CONTENT}-loading-item`} />
                    <span class={`${PREFIX_CONTENT}-loading-text`}>{locale().locale.loading}</span>
                </span>
            </Show>
        </>
    );

    return (
        <Show when={view().dialogueRenderConfig?.renderDialogueContent} keyed fallback={<div class={clsx(PREFIX_CONTENT, { [`${PREFIX_CONTENT}-editing`]: editing() })}>{defaultContent()}</div>}>
            {(render) =>
                render({
                    get message() {
                        return props.message;
                    },
                    get role() {
                        return props.role;
                    },
                    defaultContent,
                    get class() {
                        return wrapCls();
                    },
                })
            }
        </Show>
    );
}
