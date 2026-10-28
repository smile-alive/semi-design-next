import { isUnfinishedStatus, strings } from './constants';
import type { Message, OutputText } from './foundation';

const { MESSAGE_ITEM_TYPE, TOOL_CALL_TYPES } = strings;

/** The citations a text part shows; file citations point at files the dialogue cannot open */
export function getVisibleAnnotations(part: OutputText) {
    return (part.annotations ?? []).filter((annotation) => annotation.type !== 'file_citation' && annotation.type !== 'container_file_citation');
}

/** Whether a message holds several images, which the layout then shows as a list */
export function isImageList(parts: readonly ({ type?: string } | undefined)[]) {
    return parts.filter((part) => part?.type === MESSAGE_ITEM_TYPE.INPUT_IMAGE).length > 1;
}

/**
 * How an image or file part sits among its siblings: it ends a row when it is the last part or the next one is the
 * other kind of attachment, and then a line break follows only in the second case.
 */
export function getAttachmentLayout(parts: readonly ({ type?: string } | undefined)[], index: number) {
    const otherKind = parts[index]?.type === MESSAGE_ITEM_TYPE.INPUT_IMAGE ? MESSAGE_ITEM_TYPE.INPUT_FILE : MESSAGE_ITEM_TYPE.INPUT_IMAGE;
    const breakAfter = parts[index + 1]?.type === otherKind;
    return { isLast: index === parts.length - 1 || breakAfter, breakAfter };
}

/** Whether the message is still being produced and has nothing to show yet, so a loading indicator stands in */
export function isAwaitingOutput({ status, content, output_text }: Message) {
    return isUnfinishedStatus(status) && !content?.length && !output_text;
}

/**
 * The custom renderer for a content item: the entry for its type, or, for tool calls, the nested entry for the call's
 * name. `item` is undefined for the `default` key, which has no nesting.
 */
export function findContentItemRenderer<R extends (...args: never[]) => unknown>(map: Record<string, R | Record<string, R>> | undefined, type: string, item?: unknown): R | undefined {
    const entry = map?.[type];
    if (typeof entry === 'function') {
        return entry;
    }
    const name = (item as { name?: string } | undefined)?.name;
    return entry && name && TOOL_CALL_TYPES.includes(type) ? (entry as Record<string, R>)[name] : undefined;
}
