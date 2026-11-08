import { debounce } from 'es-toolkit';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import { easeInOutCubic, tween } from '@fibrae/semi-foundation/utils/tween';

const SCROLL_ANIMATION_TIME = 300;
const SHOW_SCROLL_GAP = 100;

/** The fields of a message the list reads */
export interface ListMessage {
    id?: string;
    status?: string;
    content?: unknown;
    like?: boolean;
    dislike?: boolean;
}

export interface MessageListBaseProps<M extends ListMessage> {
    chats?: M[];
    hints?: string[];
}

export interface MessageListState {
    backBottomVisible: boolean;
}

export interface MessageListAdapter<M extends ListMessage, P extends MessageListBaseProps<M>, S extends MessageListState> extends DefaultAdapter<P, S> {
    getContainerRef: () => HTMLDivElement;
    notifyChatsChange: (chats: M[]) => void;
    notifyLikeMessage: (message: M) => void;
    notifyDislikeMessage: (message: M) => void;
    notifyMessageDelete: (message: M) => void;
}

/**
 * `chats` as a reactive host hands it to the foundation, cached by the host's memo. A caller may push into a reactive
 * list, or append to the last message's text, in place, which keeps the list's identity: reading `chats` through this
 * subscribes to both edits, and the copy it returns makes them a change for `handlePropsChange`. Known limitation:
 * other in-place edits (deep content text, a lone status flip) render but are not followed; upgrade when such an edit
 * needs following.
 */
export function followChats<M extends ListMessage>(chats?: readonly M[]) {
    const list = chats ?? [];
    const content = list.at(-1)?.content;
    void (typeof content === 'string' || Array.isArray(content) ? content.length : content);
    return [...list];
}

/** `hints` as a reactive host hands it to the foundation; see `followChats` */
export function followHints(hints?: readonly string[]) {
    return [...(hints ?? [])];
}

/** The message list of Chat and AIChatDialogue: follows new content to the bottom and edits single messages */
export default abstract class MessageListFoundation<M extends ListMessage, A extends MessageListAdapter<M, P, S>, P extends MessageListBaseProps<M>, S extends MessageListState> extends BaseFoundation<A, P, S> {
    #cancelAnimation?: () => void;
    #scrollFrame?: number;
    /** Whether new content scrolls into view: stops when the user scrolls up, resumes on return */
    #following = true;
    #lastScrollTop = 0;
    /**
     * Scroll position and content height after the last list change or scroll. Known limit: content that grows in
     * between (an image loading) counts as inserted; record on resize too if that shows up.
     */
    #position = { top: 0, height: 0 };

    /** The status of a last message that no longer grows */
    protected abstract readonly completedStatus: string;

    /** Whether a new last message resumes following; Chat resumes on its own send instead, as it knows the sends */
    protected readonly resumeOnAppend: boolean = false;

    static override readonly propKeys = ['chats', 'hints'];

    #syncBackBottomVisible({ scrollHeight, clientHeight, scrollTop }: Pick<HTMLElement, 'scrollHeight' | 'clientHeight' | 'scrollTop'>) {
        const { backBottomVisible } = this.getStates();
        if (scrollHeight - scrollTop - clientHeight <= SHOW_SCROLL_GAP) {
            if (backBottomVisible) {
                this.setState({ backBottomVisible: false } as Pick<S, 'backBottomVisible'>);
            }
        } else if (!backBottomVisible) {
            this.setState({ backBottomVisible: true } as Pick<S, 'backBottomVisible'>);
        }
    }

    #updateBackBottomVisible = debounce((element: Pick<HTMLElement, 'scrollHeight' | 'clientHeight' | 'scrollTop'>) => this.#syncBackBottomVisible(element), 100);

    #animateScrollTop(getTarget: (element: HTMLDivElement) => number, onEnd?: () => void) {
        const element = this.adapter.getContainerRef();
        if (!element) {
            return;
        }
        this.#cancelAnimation?.();
        this.#cancelAnimation = tween({
            from: element.scrollTop,
            to: getTarget(element),
            duration: SCROLL_ANIMATION_TIME,
            easing: easeInOutCubic,
            onFrame: (scrollTop) => {
                element.scrollTop = scrollTop;
            },
            onEnd,
        });
    }

    #recordPosition() {
        const element = this.adapter.getContainerRef();
        if (element) {
            this.#position = { top: element.scrollTop, height: element.scrollHeight };
        }
    }

    /**
     * Earlier messages went in above: keeps the content below in place. Chrome's scroll anchoring does not apply at
     * scrollTop 0, where a user who scrolled up to load history stands. Set from the recorded position, not added to
     * scrollTop, as anchoring may already have moved it.
     */
    #keepPositionAfterPrepend() {
        const element = this.adapter.getContainerRef();
        if (element) {
            element.scrollTop = this.#position.top + element.scrollHeight - this.#position.height;
        }
    }

    #scrollToBottomImmediately() {
        const element = this.adapter.getContainerRef();
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    #toggleFeedback(message: M, key: 'like' | 'dislike') {
        const chats = this.getChats();
        const index = chats.findIndex((item) => item.id === message.id);
        if (index === -1) {
            return;
        }
        if (key === 'like') {
            this.adapter.notifyLikeMessage(message);
        } else {
            this.adapter.notifyDislikeMessage(message);
        }
        const item = chats[index];
        const newChats = [...chats];
        newChats.splice(index, 1, { ...item, like: key === 'like' && !item.like, dislike: key === 'dislike' && !item.dislike });
        this.notifyChats(newChats);
    }

    protected getChats(): M[] {
        return this.getProp('chats') ?? [];
    }

    /** Reports a list the component built itself */
    protected notifyChats(chats: M[]) {
        this.adapter.notifyChatsChange(chats);
    }

    protected resumeFollowing() {
        this.#following = true;
    }

    override init() {
        this.#scrollToBottomImmediately();
        this.#recordPosition();
    }

    override destroy() {
        this.#cancelAnimation?.();
        cancelAnimationFrame(this.#scrollFrame);
        this.#updateBackBottomVisible.cancel();
    }

    /** Follows a new last message, a still growing one and new hints; keeps the content in place when history is prepended */
    override handlePropsChange(prev: Partial<P>) {
        const chats = this.getChats();
        const prevChats = prev.chats ?? [];
        let shouldFollow = (this.getProp('hints') ?? []).length > (prev.hints ?? []).length;
        if (this.getProp('chats') !== prev.chats) {
            const last = chats.at(-1);
            const prevLast = prevChats.at(-1);
            if (chats.length > prevChats.length) {
                if (prevChats.length === 0 || last.id !== prevLast.id) {
                    shouldFollow = true;
                    if (this.resumeOnAppend) {
                        this.#following = true;
                    }
                } else if (chats[chats.length - prevChats.length].id === prevChats[0].id) {
                    this.#keepPositionAfterPrepend();
                }
            } else if (chats.length === prevChats.length && chats.length > 0 && (last.status !== this.completedStatus || last.status !== prevLast.status)) {
                shouldFollow = true;
            }
        }
        if (shouldFollow && this.#following) {
            this.#scrollToBottomImmediately();
        } else {
            // Content that grows or shrinks without scrolling fires no scroll event. Known limit: growth outside `chats`
            // and `hints` (an image loading) is not seen; upgrade to a ResizeObserver on the content if that shows up.
            this.handleScrollContainerResize();
        }
        this.#recordPosition();
    }

    scrollToBottomWithAnimation = () => {
        // the end is fixed when the animation starts; snapping at the end catches content that grew meanwhile, and the
        // resulting scroll event resumes following
        this.#animateScrollTop(
            (element) => element.scrollHeight,
            () => this.#scrollToBottomImmediately()
        );
    };

    scrollToBottom = (animation?: boolean) => {
        if (animation) {
            this.scrollToBottomWithAnimation();
        } else {
            this.#scrollToBottomImmediately();
        }
    };

    scrollToTop = (animation?: boolean) => {
        if (animation) {
            this.#animateScrollTop(() => 0);
            return;
        }
        const element = this.adapter.getContainerRef();
        if (element) {
            element.scrollTop = 0;
        }
    };

    containerScroll = (e: { target: EventTarget | null }) => {
        // the scroll listener sits on the list element and scroll does not bubble, so the target is always that element
        const target = e.target as HTMLElement;
        const { scrollTop, scrollHeight, clientHeight } = target;
        // only the user lowers scrollTop (growth never does); a drop that still ends at the bottom is shrinking
        if (scrollHeight - scrollTop - clientHeight <= 1) {
            this.#following = true;
        } else if (scrollTop < this.#lastScrollTop) {
            this.#following = false;
        }
        this.#lastScrollTop = scrollTop;
        this.#position = { top: scrollTop, height: scrollHeight };
        cancelAnimationFrame(this.#scrollFrame);
        this.#scrollFrame = requestAnimationFrame(() => this.#updateBackBottomVisible(target));
    };

    handleScrollContainerResize = () => {
        const element = this.adapter.getContainerRef();
        if (element) {
            this.#updateBackBottomVisible(element);
        }
    };

    likeMessage = (message: M) => {
        this.#toggleFeedback(message, 'like');
    };

    dislikeMessage = (message: M) => {
        this.#toggleFeedback(message, 'dislike');
    };

    deleteMessage = (message: M) => {
        const chats = this.getChats();
        this.adapter.notifyMessageDelete(message);
        this.notifyChats(chats.filter((item) => item.id !== message.id));
    };
}
