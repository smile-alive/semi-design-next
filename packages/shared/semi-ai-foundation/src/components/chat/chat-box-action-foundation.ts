import { ActionBarFoundation, type ActionBarAdapter, type ActionBarState } from '../../base/index';
import { isUnfinishedMessageStatus, strings } from './constants';
import type { Message } from './foundation';

export interface ChatBoxActionBaseProps {
    message?: Message;
}

/** The text copied for a message: its string content, or its joined text parts; undefined when empty */
export function getMessageText(message?: Message): string | undefined {
    const content = message?.content;
    const text = Array.isArray(content) ? content.map((item) => item.text ?? '').join('') : content;
    return typeof text === 'string' && text !== '' ? text : undefined;
}

const { ROLE, MESSAGE_STATUS } = strings;

export function getChatBoxActionFlags({ role, status = MESSAGE_STATUS.COMPLETE, isLast }: { role?: string; status?: string; isLast?: boolean }) {
    const complete = status === MESSAGE_STATUS.COMPLETE;
    return {
        complete,
        finished: !isUnfinishedMessageStatus(status),
        showFeedback: role !== ROLE.USER && complete,
        showReset: Boolean(isLast && role === ROLE.ASSISTANT),
    };
}

export type ChatBoxActionKey = 'copyNode' | 'likeNode' | 'dislikeNode' | 'resetNode' | 'deleteNode';

/** The buttons a message shows, in order, for the built-in bar and for a custom one's `defaultActions` */
export function getChatBoxActionKeys({ complete, showFeedback, showReset }: ReturnType<typeof getChatBoxActionFlags>) {
    const keys: ChatBoxActionKey[] = [];
    if (complete) {
        keys.push('copyNode');
    }
    if (showFeedback) {
        keys.push('likeNode', 'dislikeNode');
    }
    if (showReset) {
        keys.push('resetNode');
    }
    keys.push('deleteNode');
    return keys;
}

export type ChatBoxActionState = ActionBarState;

export type ChatBoxActionAdapter<P extends ChatBoxActionBaseProps = ChatBoxActionBaseProps> = ActionBarAdapter<P, ChatBoxActionState>;

export default class ChatBoxActionFoundation<P extends ChatBoxActionBaseProps = ChatBoxActionBaseProps> extends ActionBarFoundation<ChatBoxActionAdapter<P>, P, ChatBoxActionState> {
    getCopyText() {
        return getMessageText(this.getProps().message);
    }
}
