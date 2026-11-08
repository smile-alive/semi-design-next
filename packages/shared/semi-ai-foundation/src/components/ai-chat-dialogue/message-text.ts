import type { ContentItem, Message } from './foundation';

function getItemText(item: ContentItem) {
    if (!item || !('content' in item)) {
        return '';
    }
    if (typeof item.content === 'string') {
        return item.content;
    }
    if (!Array.isArray(item.content)) {
        return '';
    }
    return item.content.map((part) => part?.text ?? part?.refusal ?? '').join('');
}

/**
 * The text of a message, or undefined when there is none. Reasoning is excluded.
 * output_text is used only without a content array, which already holds the full answer
 */
export function getMessageText(message?: Message): string | undefined {
    let text: unknown;
    if (Array.isArray(message?.content)) {
        text = message?.content
            .filter((item) => item?.type !== 'reasoning')
            .map(getItemText)
            .join('');
    } else if (typeof message?.content === 'string') {
        text = message?.content;
    } else {
        text = message?.output_text;
    }
    return typeof text === 'string' && text !== '' ? text : undefined;
}
