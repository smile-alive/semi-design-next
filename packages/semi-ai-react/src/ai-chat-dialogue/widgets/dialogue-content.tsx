import React, { type ReactNode, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { omitBy } from 'es-toolkit';
import { cssClasses, getDialogueFileKind, strings } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
import { messageToChatInput } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/data-adapter/index';
import DialogueFoundation, { type FunctionToolCall, type InputFile, type ContentItem, type InputMessage, type InputText, type InputImage, type OutputText, type Reasoning, type CustomToolCall, type OutputMessage, type Refusal } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/foundation';
import { findContentItemRenderer, getAttachmentLayout, getVisibleAnnotations, isAwaitingOutput, isImageList } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-content';
import { getMessageText } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/message-text';
import { getFileType } from '@fibrae/semi-ai-foundation/file-suffix';
import type { Locale } from '@fibrae/semi-foundation/locale/interface';
import { escapeHtmlInMarkdown } from '@fibrae/semi-foundation/utils/escape-html';
import { IconAlertCircle, IconCode, IconExcel, IconFile, IconPdf, IconSendMsgStroked, IconVideo, IconWord, IconWrench } from '@fibrae/semi-icons-react';
import { useLocale } from '@fibrae/semi-ui-react/hooks';
import Image from '@fibrae/semi-ui-react/image/index';
import LocaleConsumer from '@fibrae/semi-ui-react/locale/locale-consumer';
import MarkdownRender from '@fibrae/semi-ui-react/markdown-render/index';
import type { DialogueContentProps } from '../interface';
import { AnnotationWidget } from './content-item/annotation';
import Code from './content-item/code';
import { ReasoningWidget } from './content-item/reasoning';
import { ReferenceWidget } from './content-item/reference';

interface FileAttachmentProps extends InputFile {
    onFileClick?: (file: InputFile) => void;
    disabledFileItemClick?: boolean;
    role?: string;
    showReference?: boolean;
    onReferenceClick?: DialogueContentProps['onReferenceClick'];
    isLastFile?: boolean;
}

const { PREFIX_CONTENT } = cssClasses;
const { STATUS, ROLE, MESSAGE_ITEM_TYPE, TEXT_TYPES } = strings;

const FILE_ICONS = { word: IconWord, pdf: IconPdf, excel: IconExcel, code: IconCode, video: IconVideo, default: IconFile };

const ImageAttachment = React.memo(function ImageAttachment({ src, isList, msg, onImageClick, isLastImage }: { src: string; isList: boolean; msg: InputImage; onImageClick?: (msg: InputImage) => void; isLastImage?: boolean }) {
    const { locale } = useLocale('AIChatDialogue');
    return (
        <Image
            className={clsx(`${PREFIX_CONTENT}-img`, {
                [`${PREFIX_CONTENT}-img-list`]: isList,
                [`${PREFIX_CONTENT}-img-last`]: isLastImage,
            })}
            alt={locale.image}
            src={src}
            onClick={() => {
                onImageClick?.(msg);
            }}
        />
    );
});

const FileAttachment = React.memo(function FileAttachment(props: FileAttachmentProps) {
    const { onFileClick, disabledFileItemClick, role, onReferenceClick, showReference, isLastFile, ...restProps } = props;
    const { locale } = useLocale('AIChatDialogue');
    const realType = getFileType(restProps.filename, restProps.fileInstance?.type);
    const kind = getDialogueFileKind(realType) ?? 'default';
    const Icon = kind === 'image' ? undefined : FILE_ICONS[kind];

    const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        onFileClick?.(restProps);
        if (disabledFileItemClick) {
            e.preventDefault();
        }
    };

    // cancels the default too: the card link must not open, and Space must not scroll
    const handleReference = (e: React.SyntheticEvent) => {
        onReferenceClick?.({ name: restProps?.filename, url: restProps?.file_url });
        e.preventDefault();
    };

    return (
        <a
            className={clsx(`${PREFIX_CONTENT}-file`, {
                [`${PREFIX_CONTENT}-file-last`]: isLastFile,
            })}
            href={restProps?.file_url}
            rel="noreferrer"
            target="_blank"
            onClick={handleFileClick}
        >
            <div className={`${PREFIX_CONTENT}-file-icon-wrapper ${PREFIX_CONTENT}-file-icon-${kind}`}>{Icon ? <Icon className={`${PREFIX_CONTENT}-file-icon`} size="extra-large" /> : <div className={`${PREFIX_CONTENT}-file-icon`} style={{ backgroundImage: `url(${restProps.file_url})` }} />}</div>
            <div className={`${PREFIX_CONTENT}-file-info`}>
                <span
                    className={clsx(`${PREFIX_CONTENT}-file-title`, {
                        [`${PREFIX_CONTENT}-file-title-ellipsis`]: role === ROLE.USER && showReference,
                    })}
                >
                    {restProps?.filename}
                </span>
                <span className={`${PREFIX_CONTENT}-file-metadata`}>
                    <span className={`${PREFIX_CONTENT}-file-type`}>{realType}</span> {restProps?.size}
                </span>
            </div>
            {role === ROLE.USER && showReference && (
                // shortcut: a role="button" div because a native button may not sit inside the card's <a>; move it
                // beside the link as a native button when the card layout is reworked
                <div
                    className={`${PREFIX_CONTENT}-icon-reference`}
                    aria-label={locale.reference}
                    role="button"
                    tabIndex={0}
                    onClick={handleReference}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            handleReference(e);
                        }
                    }}
                >
                    <IconSendMsgStroked />
                </div>
            )}
        </a>
    );
});

const ToolCallWidget = React.memo(function ToolCallWidget(props: FunctionToolCall | CustomToolCall) {
    // both shapes share `type?: string`, so `in` cannot tell them apart
    const { name, arguments: args, input } = props as FunctionToolCall & CustomToolCall;
    return (
        <div className={`${PREFIX_CONTENT}-tool-call`}>
            <IconWrench />
            {name} {args ?? input}
        </div>
    );
});

function DialogueContent({ message, customRenderFunc, role: roleInfo, mode, markdownRenderProps, editing, messageEditRender, showReference, onFileClick, onImageClick, disabledFileItemClick, renderDialogueContentItem, onAnnotationClick, onReferenceClick, escapeHtml }: DialogueContentProps) {
    const { locale } = useLocale('AIChatDialogue');

    const { content, role, status, references } = message;
    const shouldEscapeHtml = escapeHtml && role === ROLE.USER;

    const markdownComponents = useMemo(
        () => ({
            code: Code,
            // an explicit undefined entry would replace the built-in component with a non-component
            ...omitBy(markdownRenderProps?.components ?? {}, (component) => component === undefined),
        }),
        [markdownRenderProps]
    );

    const { bubble, user, error } = DialogueFoundation.getContentFlags(role, status, mode);

    const wrapCls = clsx(PREFIX_CONTENT, {
        [`${PREFIX_CONTENT}-${mode}`]: bubble,
        [`${PREFIX_CONTENT}-no-bubble`]: !bubble,
        [`${PREFIX_CONTENT}-user`]: user,
        [`${PREFIX_CONTENT}-error`]: error,
    });

    const awaitingOutput = isAwaitingOutput(message);

    const loadingNode = useMemo(() => {
        if (awaitingOutput) {
            return (
                <span className={`${PREFIX_CONTENT}-loading`}>
                    <span className={`${PREFIX_CONTENT}-loading-item`} />
                    <span className={`${PREFIX_CONTENT}-loading-item`} />
                    <span className={`${PREFIX_CONTENT}-loading-item`} />
                    <span className={`${PREFIX_CONTENT}-loading-text`}>
                        <LocaleConsumer componentName="AIChatDialogue">{(locale: Locale['AIChatDialogue']) => locale['loading']}</LocaleConsumer>
                    </span>
                </span>
            );
        } else {
            return null;
        }
    }, [awaitingOutput]);

    const customRenderer = useCallback(
        (type: string, key: React.Key, item: ContentItem) => {
            const renderer = findContentItemRenderer(renderDialogueContentItem, type, item);
            return renderer ? (
                <div key={`index-${key}`} className={`${PREFIX_CONTENT}-custom-renderer`}>
                    {renderer(item, message)}
                </div>
            ) : null;
        },
        [renderDialogueContentItem, message]
    );

    const renderMarkdown = useCallback(
        (text: string, key: React.Key) => {
            if (text !== '') {
                const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(text) : text;
                return (
                    <div key={key} className={wrapCls}>
                        <MarkdownRender format="md" {...markdownRenderProps} components={markdownComponents} raw={rawText} />
                        {role === ROLE.USER && showReference && (
                            <button type="button" className={`${PREFIX_CONTENT}-icon-reference`} aria-label={locale.reference} onClick={() => onReferenceClick?.({ type: 'text', content: text })}>
                                <IconSendMsgStroked />
                            </button>
                        )}
                    </div>
                );
            }
            return null;
        },
        [wrapCls, markdownComponents, markdownRenderProps, role, onReferenceClick, showReference, shouldEscapeHtml, locale]
    );

    const renderMessage = useCallback(
        (msg: InputMessage | OutputMessage, index: number) => {
            if (typeof msg.content === 'string') {
                return renderMarkdown(msg.content, `msg-${index}`);
            }
            const inner = (msg.content ?? []) as Array<InputText | InputImage | InputFile | OutputText>;
            const imageList = isImageList(inner);

            return inner.map((i, innerIdx) => {
                const customNode = customRenderer(i?.type, `${index}-${innerIdx}`, i);

                if (customNode) return customNode;

                if (TEXT_TYPES.includes(i?.type)) {
                    const annotations = getVisibleAnnotations(i as OutputText);
                    return (
                        <React.Fragment key={`msg-${index}-${innerIdx}`}>
                            {annotations.length > 0 && (
                                <AnnotationWidget
                                    annotation={annotations}
                                    // Known limitation: the count is fixed; make it configurable when needed
                                    maxCount={15}
                                    onClick={() => onAnnotationClick?.(annotations)}
                                />
                            )}
                            {renderMarkdown((i as InputText | OutputText).text || '', `msg-${index}-${innerIdx}`)}
                            {renderMarkdown((i as Refusal).refusal || '', `msg-${index}-${innerIdx}-refusal`)}
                        </React.Fragment>
                    );
                }
                if (i?.type === MESSAGE_ITEM_TYPE.INPUT_IMAGE) {
                    const { isLast, breakAfter } = getAttachmentLayout(inner, innerIdx);
                    return (
                        <React.Fragment key={`msg-${index}-${innerIdx}`}>
                            <ImageAttachment isLastImage={isLast} isList={imageList} msg={i} src={(i as InputImage).image_url} onImageClick={onImageClick} />
                            {breakAfter && <br />}
                        </React.Fragment>
                    );
                }
                if (i?.type === MESSAGE_ITEM_TYPE.INPUT_FILE) {
                    const { isLast, breakAfter } = getAttachmentLayout(inner, innerIdx);
                    return (
                        <React.Fragment key={`msg-${index}-${innerIdx}`}>
                            <FileAttachment {...i} role={role} disabledFileItemClick={!!disabledFileItemClick} isLastFile={isLast} showReference={showReference} onFileClick={onFileClick} onReferenceClick={onReferenceClick} />
                            {breakAfter && <br />}
                        </React.Fragment>
                    );
                }
                return null;
            });
        },
        [renderMarkdown, customRenderer, onAnnotationClick, onImageClick, onFileClick, disabledFileItemClick, role, onReferenceClick, showReference]
    );

    const renderToolCall = useCallback((item: ContentItem, index: number) => <ToolCallWidget key={`tool-${index}`} {...(item as FunctionToolCall | CustomToolCall)} />, []);

    const builtinRenderers = useMemo(
        () =>
            ({
                [MESSAGE_ITEM_TYPE.MESSAGE]: (item: ContentItem, index: number) => renderMessage(item, index),
                [MESSAGE_ITEM_TYPE.REASONING]: (item: ContentItem, index: number) => <ReasoningWidget key={`reason-${index}`} content={(item as Reasoning).content} markdownRenderProps={markdownRenderProps} status={(item as Reasoning).status} summary={(item as Reasoning).summary} />,
                [MESSAGE_ITEM_TYPE.FUNCTION_CALL]: renderToolCall,
                [MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL]: renderToolCall,
            }) as Record<string, (item: ContentItem, index: number) => React.ReactNode>,
        [renderMessage, markdownRenderProps, renderToolCall]
    );

    const node = useMemo(() => {
        if (editing) {
            return messageEditRender?.(messageToChatInput(message));
        } else {
            let realContent: ReactNode | ReactNode[];
            const textContent = Array.isArray(content) ? undefined : getMessageText(message);

            if (textContent) {
                const defaultRenderer = findContentItemRenderer(renderDialogueContentItem, 'default');
                if (defaultRenderer) {
                    realContent = <div className={`${PREFIX_CONTENT}-custom-renderer`}>{defaultRenderer(textContent, message)}</div>;
                } else {
                    const rawText = shouldEscapeHtml ? escapeHtmlInMarkdown(textContent) : textContent;
                    realContent = (
                        <div className={wrapCls}>
                            <MarkdownRender format="md" {...markdownRenderProps} components={markdownComponents} raw={rawText} />
                            {role === ROLE.USER && showReference && (
                                <button type="button" className={`${PREFIX_CONTENT}-icon-reference`} aria-label={locale.reference} onClick={() => onReferenceClick?.({ type: 'text', content: textContent })}>
                                    <IconSendMsgStroked />
                                </button>
                            )}
                        </div>
                    );
                }
            } else if (Array.isArray(content)) {
                realContent = content.map((item: ContentItem, index) => {
                    const typeKey: string | undefined = item?.type;
                    const effectiveType = typeKey ?? MESSAGE_ITEM_TYPE.MESSAGE;

                    const customNode = customRenderer(effectiveType, index, item);
                    if (customNode) return customNode;

                    const renderer = builtinRenderers[effectiveType];
                    if (renderer) return renderer(item, index);
                    return null;
                });
            }
            return (
                <div className={`${PREFIX_CONTENT}-wrapper`}>
                    {(status === STATUS.FAILED || status === STATUS.CANCELLED) && (
                        <div className={`${PREFIX_CONTENT}-failed`}>
                            <IconAlertCircle />
                        </div>
                    )}
                    <div className={`${PREFIX_CONTENT}-inner`}>{realContent}</div>
                </div>
            );
        }
    }, [status, content, editing, message, role, messageEditRender, markdownRenderProps, wrapCls, markdownComponents, builtinRenderers, customRenderer, renderDialogueContentItem, showReference, onReferenceClick, shouldEscapeHtml, locale]);

    const defaultContent = (
        <>
            {references && references.length > 0 && !editing && <ReferenceWidget references={references} />}
            {node}
            {loadingNode}
        </>
    );

    if (customRenderFunc && typeof customRenderFunc === 'function') {
        return customRenderFunc({
            message,
            role: roleInfo,
            defaultContent,
            className: wrapCls,
        });
    }

    return (
        <div
            className={clsx(`${PREFIX_CONTENT}`, {
                [`${PREFIX_CONTENT}-editing`]: editing,
            })}
        >
            {defaultContent}
        </div>
    );
}

export default React.memo(DialogueContent);
