import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { getFileKind } from '../../utils/file-suffix';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}-ai-chat-dialogue`,
    PREFIX_ACTION: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-action`,
    PREFIX_CONTENT: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-content`,
    PREFIX_REASONING: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-reasoning`,
    PREFIX_ANNOTATION: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-annotation`,
    PREFIX_REFERENCES: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-references`,
    PREFIX_REFERENCE: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-reference`,
    PREFIX_STEP: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-step`,
    PREFIX_CODE: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-code`,
    PREFIX_HINT: `${BASE_CLASS_PREFIX}-ai-chat-dialogue-hint`,
};
const ROLE = {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
};

const DIALOGUE_ALIGN = {
    LEFT_RIGHT: 'leftRight',
    LEFT_ALIGN: 'leftAlign',
};

const STATUS = {
    QUEUED: 'queued',
    IN_PROGRESS: 'in_progress',
    INCOMPLETE: 'incomplete',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};

export function isUnfinishedStatus(status?: string) {
    return status === STATUS.QUEUED || status === STATUS.IN_PROGRESS;
}

const MODE = {
    BUBBLE: 'bubble',
    NO_BUBBLE: 'noBubble',
    USER_BUBBLE: 'userBubble',
};

const SEND_HOT_KEY = {
    ENTER: 'enter',
    SHIFT_PLUS_ENTER: 'shift+enter',
};

const MESSAGE_ITEM_TYPE = {
    MESSAGE: 'message',
    OUTPUT_TEXT: 'output_text',
    REFUSAL: 'refusal',
    FILE_SEARCH_CALL: 'file_search_call',
    FUNCTION_CALL: 'function_call',
    WEB_SEARCH_CALL: 'web_search_call',
    REASONING: 'reasoning',
    MCP_CALL: 'mcp_call',
    CUSTOM_TOOL_CALL: 'custom_tool_call',
    IMAGE_GENERATION_CALL: 'image_generation_call',
    MCP_LIST_TOOLS: 'mcp_list_tools',
    INPUT_TEXT: 'input_text',
    INPUT_IMAGE: 'input_image',
    INPUT_FILE: 'input_file',
    STEPS: 'steps',
    ITEM_REFERENCE: 'item_reference',
};

const FINISH_REASON = {
    STOP: 'stop',
    LENGTH: 'length',
    CONTENT_FILTER: 'content_filter',
    TOOL_CALLS: 'tool_calls',
    FUNCTION_CALL: 'function_call',
};

// length and content_filter truncate the answer, which OpenAI Responses reports as `incomplete`.
export function finishReasonToStatus(finishReason?: string | null) {
    if (finishReason == null) return STATUS.IN_PROGRESS;
    return finishReason === FINISH_REASON.LENGTH || finishReason === FINISH_REASON.CONTENT_FILTER ? STATUS.INCOMPLETE : STATUS.COMPLETED;
}

const TEXT_TYPES = [MESSAGE_ITEM_TYPE.INPUT_TEXT, MESSAGE_ITEM_TYPE.OUTPUT_TEXT, MESSAGE_ITEM_TYPE.REFUSAL];

const TOOL_CALL_TYPES = [MESSAGE_ITEM_TYPE.FUNCTION_CALL, MESSAGE_ITEM_TYPE.CUSTOM_TOOL_CALL, MESSAGE_ITEM_TYPE.MCP_CALL];

// The kinds the dialogue has an icon for; ppt and audio files get the default icon
const DIALOGUE_FILE_KINDS = ['word', 'image', 'pdf', 'excel', 'code', 'video'] as const;

export type DialogueFileKind = (typeof DIALOGUE_FILE_KINDS)[number];

/** The kinds drawn as an icon; an image is drawn as a thumbnail */
export type DialogueIconKind = Exclude<DialogueFileKind, 'image'>;

export function getDialogueFileKind(type?: string): DialogueFileKind | undefined {
    const kind = getFileKind(type);
    return DIALOGUE_FILE_KINDS.find((candidate) => candidate === kind);
}

export const strings = {
    STATUS,
    ROLE,
    DIALOGUE_ALIGN,
    MODE,
    SEND_HOT_KEY,
    MESSAGE_ITEM_TYPE,
    FINISH_REASON,
    TEXT_TYPES,
    TOOL_CALL_TYPES,
};
